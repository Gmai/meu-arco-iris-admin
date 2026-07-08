import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { Storage } from '@google-cloud/storage';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const permissions = (session.user as any).permissions || {};

    if (role !== 'ADMIN' && !permissions.canDeleteOrders) {
      return NextResponse.json({ error: 'Você não tem permissão para remover pedidos.' }, { status: 403 });
    }

    const { id } = await params;

    // Buscar o pedido para saber quais imagens deletar no bucket
    const order = await prisma.order.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Excluir do Cloud Storage
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (bucketName) {
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      for (const img of order.images) {
        const filename = img.url.split('/').pop();
        if (filename) {
          try {
            await bucket.file(filename).delete();
          } catch (e) {
            console.error(`Erro ao deletar imagem ${filename} do bucket:`, e);
            // Ignoramos erro se a imagem já não existir no bucket
          }
        }
      }
    }

    // Excluir do Banco de Dados (as relations em cascade farão o resto)
    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao excluir pedido:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
