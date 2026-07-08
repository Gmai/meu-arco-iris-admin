import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DeleteOrderButton } from "@/components/DeleteOrderButton";
import { DeleteImageButton } from "@/components/DeleteImageButton";
import { ClickableImage } from "@/components/ClickableImage";

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || '';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || {};
  const canDeleteOrders = role === 'ADMIN' || permissions.canDeleteOrders;
  const canDeletePhotos = role === 'ADMIN' || permissions.canDeletePhotos;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      invoiceItems: true,
      detectedItems: true,
      images: true,
    }
  });

  if (!order) {
    notFound();
  }

  // Função para gerar URL Assinada temporária (válida por 15 minutos)
  const getSignedUrl = async (publicUrl: string) => {
    if (!bucketName) return publicUrl; // Fallback se não configurado
    
    // Extrai apenas o nome do arquivo da URL pública gerada no upload
    const filename = publicUrl.split('/').pop();
    if (!filename) return publicUrl;

    try {
      const [url] = await storage
        .bucket(bucketName)
        .file(filename)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutos
        });
      return url;
    } catch (e) {
      console.error("Erro ao gerar signed URL", e);
      return publicUrl;
    }
  };

  // Resolvemos as URLs assinadas de forma assíncrona
  const resolvedImages = await Promise.all(
    order.images.map(async (img) => ({
      ...img,
      signedUrl: await getSignedUrl(img.url)
    }))
  );

  const invoiceImages = resolvedImages.filter(i => i.type === 'INVOICE');
  const productImages = resolvedImages.filter(i => i.type === 'PRODUCT');

  // Mesclar itens para tabela comparativa
  const allItemNames = Array.from(new Set([
    ...order.invoiceItems.map(i => i.name),
    ...order.detectedItems.map(i => i.name)
  ]));

  const comparison = allItemNames.map(name => {
    const inv = order.invoiceItems.find(i => i.name === name);
    const det = order.detectedItems.find(i => i.name === name);
    const invQtd = inv?.quantity || 0;
    const detQtd = det?.quantity || 0;
    
    let status = 'ok';
    if (invQtd > detQtd) status = 'faltando';
    else if (invQtd < detQtd) status = 'sobrando';

    return { name, invQtd, detQtd, status };
  });

  return (
    <main className="container">
      <header style={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <Link href="/dashboard" style={styles.backLink}>← Voltar para o Painel</Link>
            <h1 style={styles.title}>Pedido: {order.orderNumber || 'Desconhecido'}</h1>
            <p style={styles.subtitle}>Cliente: {order.customerName}</p>
            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 'var(--spacing-xs)'}}>Data de Registro/Entrada: {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
            
            <div style={{marginTop: 'var(--spacing-md)'}}>
              <span style={{
                ...styles.badge, 
                backgroundColor: order.status === 'VALID' ? 'rgba(34, 197, 94, 0.1)' : order.status === 'DIVERGENT' ? 'rgba(239, 68, 68, 0.1)' : 'var(--slate-100)',
                color: order.status === 'VALID' ? 'var(--success)' : order.status === 'DIVERGENT' ? 'var(--danger)' : 'var(--slate-700)'
              }}>
                Status: {order.status === 'VALID' ? 'VÁLIDO' : order.status === 'DIVERGENT' ? 'DIVERGENTE' : order.status}
              </span>
            </div>
          </div>

          {canDeleteOrders && (
            <div>
              <DeleteOrderButton orderId={order.id} />
            </div>
          )}
        </div>
      </header>

      {order.discrepancies && (
        <section style={styles.alertCard} aria-label="Aviso de divergência">
          <h3 style={styles.alertTitle}>Divergência Encontrada pela IA</h3>
          <p style={{color: 'var(--danger)'}}>{order.discrepancies}</p>
        </section>
      )}

      <section className="glass-panel" style={styles.card} aria-label="Comparação de Itens">
        <h2 style={styles.sectionTitle}>Comparação de Itens</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Faturado (Nota)</th>
              <th style={styles.th}>Detectado (Foto)</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((item, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={styles.tdItem}>{item.name}</td>
                <td style={styles.tdItem}>{item.invQtd}</td>
                <td style={styles.tdItem}>{item.detQtd}</td>
                <td style={styles.tdItem}>
                  {item.status === 'ok' && <span style={styles.statusOk}>✅ OK</span>}
                  {item.status === 'faltando' && <span style={styles.statusAlert}>❌ Faltando ({item.invQtd - item.detQtd})</span>}
                  {item.status === 'sobrando' && <span style={styles.statusWarn}>⚠️ Sobrando ({item.detQtd - item.invQtd})</span>}
                </td>
              </tr>
            ))}
            {comparison.length === 0 && (
              <tr><td colSpan={4} style={styles.textMuted}>Nenhum item extraído.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <div style={{...styles.grid, marginTop: 'var(--spacing-2xl)'}}>
        {/* Imagens Originais */}
        <section style={styles.column} aria-label="Fotos das Notas">
          <div className="glass-panel" style={styles.card}>
            <h2 style={styles.sectionTitle}>Fotos das Notas Fiscais</h2>
            <div style={styles.imageGrid}>
              {invoiceImages.map(img => (
                <div key={img.id} style={{...styles.imageContainer, position: 'relative'}}>
                  <ClickableImage src={img.signedUrl} alt="Nota Fiscal" style={styles.image} />
                  {canDeletePhotos && <DeleteImageButton imageId={img.id} />}
                </div>
              ))}
              {invoiceImages.length === 0 && <p style={styles.textMuted}>Nenhuma foto encontrada.</p>}
            </div>
          </div>
        </section>
        <section style={styles.column} aria-label="Fotos dos Produtos">
          <div className="glass-panel" style={styles.card}>
            <h2 style={styles.sectionTitle}>Fotos dos Produtos</h2>
            <div style={styles.imageGrid}>
              {productImages.map(img => (
                <div key={img.id} style={{...styles.imageContainer, position: 'relative'}}>
                  <ClickableImage src={img.signedUrl} alt="Produto" style={styles.image} />
                  {canDeletePhotos && <DeleteImageButton imageId={img.id} />}
                </div>
              ))}
              {productImages.length === 0 && <p style={styles.textMuted}>Nenhuma foto encontrada.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  header: { marginBottom: 'var(--spacing-2xl)' },
  backLink: { color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: 'var(--spacing-md)' },
  title: { fontSize: '2rem', fontWeight: '700', color: 'var(--foreground)' },
  subtitle: { color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)', fontSize: '1.125rem' },
  badge: { padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' },
  
  alertCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 'var(--spacing-lg)', borderRadius: '12px', marginBottom: 'var(--spacing-2xl)' },
  alertTitle: { fontWeight: '700', marginBottom: 'var(--spacing-sm)', color: 'var(--danger)' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-2xl)' },
  column: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--spacing-2xl)' },
  
  card: { borderRadius: '12px', padding: 'var(--spacing-lg)' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-sm)', color: 'var(--foreground)' },
  
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: 'var(--spacing-md)', backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' },
  tr: { borderBottom: '1px solid var(--border)' },
  tdItem: { padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--foreground)' },
  
  statusOk: { color: 'var(--success)', fontWeight: '600' },
  statusAlert: { color: 'var(--danger)', fontWeight: '600' },
  statusWarn: { color: 'var(--warning)', fontWeight: '600' },
  
  textMuted: { color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--spacing-md)' },
  
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' },
  imageContainer: { width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' },
  image: { width: '100%', height: '100%', objectFit: 'cover' as const }
};
