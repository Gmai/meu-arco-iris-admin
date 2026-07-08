import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { parsedData, savedImages, llmOriginalData } = body;

    if (!parsedData || !savedImages) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderNumber: parsedData.orderNumber || 'Desconhecido',
        customerName: parsedData.customerName || 'Desconhecido',
        date: parsedData.date ? new Date(parsedData.date) : new Date(),
        status: parsedData.status === 'VALID' ? 'VALID' : 'DIVERGENT',
        discrepancies: parsedData.discrepancies || null,
        llmOriginalData: llmOriginalData || null,
        invoiceItems: {
          create: parsedData.invoiceItems || []
        },
        detectedItems: {
          create: parsedData.detectedItems || []
        },
        images: {
          create: savedImages.map((img: any) => ({
            url: img.url,
            type: img.type
          }))
        }
      }
    });

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    console.error("Erro ao salvar pedido:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
