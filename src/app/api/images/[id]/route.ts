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

    if (role !== 'ADMIN' && !permissions.canDeletePhotos) {
      return NextResponse.json({ error: 'Você não tem permissão para remover fotos.' }, { status: 403 });
    }

    const { id } = await params;

    const image = await prisma.image.findUnique({ where: { id } });

    if (!image) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    // Excluir do Cloud Storage
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (bucketName) {
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const filename = image.url.split('/').pop();
      if (filename) {
        try {
          await bucket.file(filename).delete();
        } catch (e) {
          console.error(`Erro ao deletar imagem ${filename} do bucket:`, e);
        }
      }
    }

    // Excluir do Banco de Dados
    await prisma.image.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao excluir imagem:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
