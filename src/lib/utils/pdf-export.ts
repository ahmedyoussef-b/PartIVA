import { jsPDF } from 'jspdf';

export interface PartPdfData {
  name: string;
  reference: string;
  description?: string | null;
  manufacturer?: string | null;
  specifications?: Array<{ key: string; value: string }>;
}

export async function exportPartToPdf(part: PartPdfData): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175);
  doc.text('PartIVA — Fiche Pièce', 20, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 20, 28);

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 32, 190, 32);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(part.name, 20, 45);

  doc.setFontSize(11);
  doc.text(`Référence : ${part.reference}`, 20, 55);

  if (part.manufacturer) {
    doc.text(`Fabricant : ${part.manufacturer}`, 20, 62);
  }

  if (part.description) {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(part.description, 170);
    doc.text(lines, 20, 75);
  }

  if (part.specifications && part.specifications.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text('Spécifications', 20, 95);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    let y = 103;
    for (const spec of part.specifications) {
      doc.text(`${spec.key} : ${spec.value}`, 22, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Document généré par PartIVA — Atelier Pièces Industrielles', 20, 285);

  return doc.output('blob');
}

export function downloadPartPdf(part: PartPdfData): void {
  exportPartToPdf(part).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partiva-${part.reference.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
