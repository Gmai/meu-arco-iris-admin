"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClickableImage } from "@/components/ClickableImage";

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  // Estado para os itens em modo de edição
  const [comparison, setComparison] = useState<{name: string, invQtd: number, detQtd: number}[]>([]);

  // Generate previews
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Por favor, envie pelo menos uma foto para a validação.");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro no processamento.');
      }

      const { parsedData } = data;
      const allItemNames = Array.from(new Set([
        ...(parsedData.invoiceItems || []).map((i: any) => i.name),
        ...(parsedData.detectedItems || []).map((i: any) => i.name)
      ]));

      const initialComparison = allItemNames.map(name => {
        const inv = (parsedData.invoiceItems || []).find((i: any) => i.name === name);
        const det = (parsedData.detectedItems || []).find((i: any) => i.name === name);
        return { name, invQtd: inv?.quantity || 0, detQtd: det?.quantity || 0 };
      });

      setComparison(initialComparison as {name: string, invQtd: number, detQtd: number}[]);
      setReviewData(data); // { parsedData, savedImages }
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateItem = (index: number, field: 'invQtd' | 'detQtd', value: number) => {
    const newComp = [...comparison];
    newComp[index][field] = value;
    setComparison(newComp);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      // Reconstroi os dados com base na tabela editada
      const finalInvoiceItems = comparison.filter(c => c.invQtd > 0).map(c => ({ name: c.name, quantity: c.invQtd }));
      const finalDetectedItems = comparison.filter(c => c.detQtd > 0).map(c => ({ name: c.name, quantity: c.detQtd }));
      
      let finalStatus = 'VALID';
      let hasDiscrepancy = false;
      for (const item of comparison) {
        if (item.invQtd !== item.detQtd) {
          finalStatus = 'DIVERGENT';
          hasDiscrepancy = true;
          break;
        }
      }

      const editedParsedData = {
        ...reviewData.parsedData,
        status: finalStatus,
        discrepancies: hasDiscrepancy ? (reviewData.parsedData.discrepancies || "Divergência detectada após revisão humana.") : null,
        invoiceItems: finalInvoiceItems,
        detectedItems: finalDetectedItems
      };

      // Mandar llmOriginalData para auditoria
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedData: editedParsedData,
          savedImages: reviewData.savedImages,
          llmOriginalData: reviewData.parsedData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar o pedido.');
      }

      alert("Pedido salvo com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      alert("Erro: " + error.message);
      setIsSaving(false);
    }
  };

  if (reviewData) {
    const { parsedData } = reviewData;
    return (
      <main className="container">
        <header style={styles.header}>
          <h1 style={styles.title}>Revisar Extração</h1>
          <p style={styles.subtitle}>Confira e <b>edite</b> os dados que a IA extraiu antes de salvar.</p>
        </header>

        <section className="glass-panel" style={styles.card} aria-label="Revisão dos Dados">
          <div style={styles.reviewSection}>
            <strong>Número do Pedido:</strong> {parsedData.orderNumber}
          </div>
          <div style={styles.reviewSection}>
            <strong>Cliente:</strong> {parsedData.customerName}
          </div>

          {parsedData.discrepancies && (
            <div style={{...styles.alertCard, marginTop: 'var(--spacing-md)'}}>
              <h3 style={styles.alertTitle}>Sugestão da IA (Original)</h3>
              <p style={{color: 'var(--danger)', margin: 0}}>{parsedData.discrepancies}</p>
            </div>
          )}

          <div style={{marginTop: 'var(--spacing-2xl)'}}>
            <h3 style={styles.sectionTitle}>Tabela de Comparação (Editável)</h3>
            <div style={{ width: '100%', overflowX: 'auto', display: 'block' }}>
              <table className="responsive-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produto</th>
                  <th style={styles.th}>Faturado (Nota)</th>
                  <th style={styles.th}>Detectado (Foto)</th>
                  <th style={styles.th}>Status Atual</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((item, idx) => {
                  let status = 'ok';
                  if (item.invQtd > item.detQtd) status = 'faltando';
                  else if (item.invQtd < item.detQtd) status = 'sobrando';

                  return (
                    <tr key={idx} style={styles.tr}>
                      <td data-label="Produto" style={styles.tdItem}>{item.name}</td>
                      <td data-label="Faturado (Nota)" style={styles.tdItem}>
                        <div style={styles.inputWrapper}>
                          <input 
                            type="number" 
                            style={styles.numberInput} 
                            value={item.invQtd} 
                            onChange={(e) => updateItem(idx, 'invQtd', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            min={0}
                            title="Editar quantidade na nota"
                          />
                        </div>
                      </td>
                      <td data-label="Detectado (Foto)" style={styles.tdItem}>
                        <div style={styles.inputWrapper}>
                          <input 
                            type="number" 
                            style={styles.numberInput} 
                            value={item.detQtd} 
                            onChange={(e) => updateItem(idx, 'detQtd', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            min={0}
                            title="Editar quantidade detectada"
                          />
                        </div>
                      </td>
                      <td data-label="Status Atual" style={styles.tdItem}>
                        {status === 'ok' && <span style={styles.statusOk}>✅ OK</span>}
                        {status === 'faltando' && <span style={styles.statusAlert}>❌ Faltando ({item.invQtd - item.detQtd})</span>}
                        {status === 'sobrando' && <span style={styles.statusWarn}>⚠️ Sobrando ({item.detQtd - item.invQtd})</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>

          <div style={{marginTop: 'var(--spacing-2xl)'}}>
            <h3 style={styles.sectionTitle}>Fotos Enviadas (Clique para Zoom)</h3>
            <div style={styles.previewGrid}>
              {previews.map((src, i) => (
                <ClickableImage key={i} src={src} alt="Foto enviada" style={styles.previewImage} />
              ))}
            </div>
          </div>

          <div style={styles.actions}>
            <button onClick={() => setReviewData(null)} style={styles.cancelButton} disabled={isSaving}>
              Cancelar e Refazer
            </button>
            <button onClick={handleConfirmSave} style={{...styles.submitButton, ...(isSaving ? styles.submitButtonDisabled : {})}} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Confirmar e Salvar"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <header style={styles.header}>
        <h1 style={styles.title}>Novo Pedido</h1>
        <p style={styles.subtitle}>Valide os itens de um novo pedido usando a nossa IA.</p>
      </header>

      <section className="glass-panel" style={styles.card} aria-label="Formulário de Upload">
        <form onSubmit={handleAnalyze} style={styles.form}>
          
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Fotos do Pedido</h2>
            <p style={styles.sectionDesc}>Faça upload das imagens da nota fiscal e dos produtos juntos.</p>
            <div style={styles.uploadArea}>
              <input type="file" accept="image/*" onChange={handleUpload} style={styles.fileInput} multiple />
              <div style={styles.uploadText}>
                {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : "Clique para selecionar ou arraste as fotos aqui"}
              </div>
            </div>
            {previews.length > 0 && (
              <div style={styles.previewGrid}>
                {previews.map((src, i) => (
                  <ClickableImage key={i} src={src} alt="Preview" style={styles.previewImage} />
                ))}
              </div>
            )}
          </div>

          <div style={styles.actions}>
            <button type="submit" style={{...styles.submitButton, ...(isUploading ? styles.submitButtonDisabled : {})}} disabled={isUploading}>
              {isUploading ? "Analisando fotos com IA (isso pode levar alguns segundos)..." : "Validar Pedido"}
            </button>
          </div>

        </form>
      </section>

      {isUploading && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            {/* Trocado o spinner por Skeletons, conforme skill de microinterações */}
            <div style={{width: '100%', height: '120px', display: 'flex', gap: '1rem', flexDirection: 'column'}}>
               <div className="skeleton" style={{width: '60%', height: '24px'}} />
               <div className="skeleton" style={{width: '100%', height: '16px'}} />
               <div className="skeleton" style={{width: '80%', height: '16px'}} />
               <div className="skeleton" style={{width: '90%', height: '16px'}} />
            </div>
            <h2 style={styles.overlayTitle}>Analisando seu Pedido</h2>
            <p style={styles.overlayText}>A inteligência artificial está extraindo os dados. Por favor, aguarde...</p>
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  header: { marginBottom: 'var(--spacing-2xl)' },
  title: { fontSize: '2rem', fontWeight: '700', color: 'var(--foreground)' },
  subtitle: { color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' },
  badge: { padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
  card: { borderRadius: '12px', padding: 'var(--spacing-2xl)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--spacing-2xl)' },
  section: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--spacing-sm)' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '600', color: 'var(--foreground)' },
  sectionDesc: { color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' },
  uploadArea: { position: 'relative' as const, border: '2px dashed var(--border)', borderRadius: '8px', padding: 'var(--spacing-3xl) var(--spacing-2xl)', textAlign: 'center' as const, backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'pointer' },
  fileInput: { position: 'absolute' as const, top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
  uploadText: { color: 'var(--slate-600)', fontWeight: '500' },
  previewGrid: { display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' as const, marginTop: 'var(--spacing-md)' },
  previewImage: { width: '100px', height: '100px', objectFit: 'cover' as const, borderRadius: '8px', border: '1px solid var(--border)' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-2xl)', marginTop: 'var(--spacing-md)' },
  cancelButton: { backgroundColor: 'transparent', color: 'var(--text-muted)', padding: 'var(--spacing-md) var(--spacing-xl)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  submitButton: { backgroundColor: 'var(--primary)', color: 'white', padding: 'var(--spacing-md) var(--spacing-xl)', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  submitButtonDisabled: { opacity: 0.7, cursor: 'not-allowed' },
  
  reviewSection: { marginBottom: 'var(--spacing-md)', fontSize: '1.125rem', color: 'var(--foreground)' },
  alertCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 'var(--spacing-md)', borderRadius: '8px' },
  alertTitle: { fontWeight: '700', margin: '0 0 var(--spacing-xs) 0', color: 'var(--danger)', fontSize: '1rem' },
  
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: 'var(--spacing-md)', backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' },
  tr: { borderBottom: '1px solid var(--border)' },
  tdItem: { padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--foreground)', verticalAlign: 'middle' },
  inputWrapper: { display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--primary)', borderRadius: '6px', transition: 'box-shadow 0.2s' },
  numberInput: { width: '80px', padding: 'var(--spacing-sm)', border: 'none', borderRadius: '6px', textAlign: 'center' as const, backgroundColor: 'transparent', color: '#ffffff', fontWeight: '600', fontSize: '1rem', outline: 'none' },
  statusOk: { color: 'var(--success)', fontWeight: '600' },
  statusAlert: { color: 'var(--danger)', fontWeight: '600' },
  statusWarn: { color: 'var(--warning)', fontWeight: '600' },

  overlay: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  overlayContent: { backgroundColor: 'var(--card-bg)', padding: 'var(--spacing-3xl)', borderRadius: '16px', textAlign: 'center' as const, maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 'var(--spacing-md)' },
  overlayTitle: { fontSize: '1.25rem', fontWeight: '700', color: 'var(--foreground)', margin: 0 },
  overlayText: { color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }
};
