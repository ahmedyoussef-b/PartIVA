import type { EngineResult } from '@/core/ai-engine/engine';

export function exportWorkspaceToPdf(result: EngineResult, canvasDataUrl?: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(16);
  doc.text("PartIVA — Rapport d'analyse", 10, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Date : ${new Date().toLocaleString()}`, 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text('1. Ingestion', 10, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Type : ${result.ingest.inputType}`, 10, y);
  y += 5;
  doc.text(`Statut : ${result.ingest.analysisStatus}`, 10, y);
  y += 5;
  if (result.ingest.warnings?.length) {
    doc.text(`Avertissements : ${result.ingest.warnings.join(', ')}`, 10, y);
    y += 5;
  }
  y += 4;

  doc.setFontSize(12);
  doc.text('2. Résultats de recherche', 10, y);
  y += 6;
  doc.setFontSize(10);
  const candidates = result.search?.candidates ?? [];
  if (candidates.length) {
    candidates.forEach((c, i) => {
      doc.text(`${i + 1}. ${c.name} — score ${c.score} (${c.source})`, 10, y);
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
  } else {
    doc.text(`Statut : ${result.search?.searchStatus}`, 10, y);
    y += 5;
  }
  y += 4;

  doc.setFontSize(12);
  doc.text('3. Reconstruction', 10, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Statut : ${result.reconstruct?.reconstructStatus}`, 10, y);
  y += 5;
  if (result.reconstruct?.candidates?.length) {
    doc.text(`Fichier : ${result.reconstruct.candidates[0]?.fileUrl ?? ''}`, 10, y);
    y += 5;
  }
  y += 4;

  doc.setFontSize(12);
  doc.text('4. Archivage', 10, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Statut : ${result.archive?.archiveStatus}`, 10, y);
  y += 5;
  if (result.archive?.archivedPartId) {
    doc.text(`ID pièce : ${result.archive.archivedPartId}`, 10, y);
    y += 5;
  }
  y += 4;

  if (canvasDataUrl) {
    if (y > 200) {
      doc.addPage();
      y = 10;
    }
    doc.setFontSize(12);
    doc.text('5. Capture 3D', 10, y);
    y += 6;
    try {
      doc.addImage(canvasDataUrl, 'PNG', 10, y, 180, 100);
      y += 105;
    } catch {
      doc.text('Capture indisponible', 10, y);
      y += 5;
    }
  }

  doc.setFontSize(8);
  doc.text(`Généré par PartIVA — ${new Date().toLocaleString()}`, 10, 290);

  doc.save('partiva-rapport.pdf');
}
