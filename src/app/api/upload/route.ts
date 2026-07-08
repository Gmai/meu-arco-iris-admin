import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Storage } from '@google-cloud/storage';

// Configuração do Gemini e Cloud Storage
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || '';

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

    const formData = await request.formData();
    const invoiceFiles = formData.getAll('invoices') as File[];
    const productFiles = formData.getAll('products') as File[];

    if (invoiceFiles.length === 0 && productFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!bucketName) {
      return NextResponse.json({ error: 'Nome do bucket (GCS_BUCKET_NAME) não configurado no .env' }, { status: 500 });
    }

    const savedImages: { type: string; url: string; base64: string; mimeType: string }[] = [];
    const bucket = storage.bucket(bucketName);
    
    // Função auxiliar para salvar no Cloud Storage
    const processFile = async (file: File, type: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      
      const fileRef = bucket.file(filename);
      await fileRef.save(buffer, {
        metadata: { contentType: file.type },
        resumable: false
      });
      
      // Assume que o bucket está configurado com leitura pública ou que vamos acessar via console
      // Para acessos estritos, uma URL assinada (Signed URL) seria recomendada.
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
      
      savedImages.push({
        type,
        url: publicUrl,
        base64: buffer.toString('base64'),
        mimeType: file.type
      });
    };

    for (const file of invoiceFiles) await processFile(file, 'INVOICE');
    for (const file of productFiles) await processFile(file, 'PRODUCT');

    // Integração com Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chave do Gemini não configurada no .env' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
    Você é um validador de pedidos de um sistema logístico.
    Analise as imagens enviadas. Elas contêm a foto de uma Nota Fiscal e (opcionalmente) fotos dos produtos físicos.
    
    Regra de Nomenclatura: Ao listar os itens na nota e os itens físicos, padronize os nomes para que façam "match" perfeito.
    Exemplo: Se a nota diz "Micanga Flor Translucida com Miolo - 25 pcs" e a foto contém "Micanga Flor Translucida com Miolo", extraia ambos apenas como "Micanga Flor Translucida com Miolo". Ignore sufixos de quantidade no nome da peça a não ser que claramente dê para perceber na foto que a quantidade de peças não bate com a embalagem.

    Extraia as seguintes informações e retorne EXCLUSIVAMENTE em formato JSON, sem marcação markdown:
    {
      "orderNumber": "número do pedido ou nota se encontrar",
      "customerName": "nome do cliente/destinatário",
      "date": "data de emissão (YYYY-MM-DD)",
      "invoiceItems": [{"name": "nome do produto", "quantity": 1}],
      "detectedItems": [{"name": "nome do produto detectado fisicamente na foto", "quantity": 1}],
      "discrepancies": "Descreva se há alguma divergência (ex: faltando item). Deixe em branco se estiver tudo certo.",
      "status": "VALID" (se bater tudo) ou "DIVERGENT" (se faltar algo)
    }
    `;

    const imageParts = savedImages.map(img => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(responseText);

    // Retorna os dados extraídos e as imagens salvas (não salva no banco ainda)
    return NextResponse.json({ 
      success: true, 
      parsedData,
      savedImages 
    });

  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
