// BOM Exporter — génération CSV/Excel depuis la BOM du projet
// V8-D-13-a

import ExcelJS from 'exceljs';

export interface BomComponent {
  id: string;
  refDes?: string;
  mpn?: string;
  description?: string;
  quantity?: number;
  price?: number;
  footprint?: string;
}

export interface BomExportOptions {
  format: 'csv' | 'xlsx';
  includePricing?: boolean;
  includeFootprints?: boolean;
}

export async function generateBomFile(
  components: BomComponent[],
  options: BomExportOptions = { format: 'xlsx' },
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BOM');

  const headers = ['Reference', 'MPN', 'Description', 'Quantity'];
  if (options.includeFootprints) headers.push('Footprint');
  if (options.includePricing) headers.push('Unit Price', 'Total Price');

  worksheet.columns = headers.map((h) => ({
    header: h,
    key: h.toLowerCase().replace(/ /g, '_'),
    width: 20,
  }));

  // Données regroupées par MPN
  const grouped = new Map<
    string,
    { ref: string[]; mpn: string; desc: string; qty: number; price?: number; footprint?: string }
  >();

  components.forEach((c) => {
    const key = c.mpn || c.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        ref: [c.refDes || c.id],
        mpn: c.mpn || '',
        desc: c.description || '',
        qty: c.quantity || 1,
        price: c.price,
        footprint: c.footprint,
      });
    } else {
      const entry = grouped.get(key)!;
      entry.ref.push(c.refDes || c.id);
      entry.qty += c.quantity || 1;
    }
  });

  for (const [, entry] of grouped) {
    const row: Record<string, unknown> = {
      reference: entry.ref.join(', '),
      mpn: entry.mpn,
      description: entry.desc,
      quantity: entry.qty,
    };
    if (options.includeFootprints) row.footprint = entry.footprint ?? '';
    if (options.includePricing) {
      row.unit_price = entry.price ?? 0;
      row.total_price = (entry.price ?? 0) * entry.qty;
    }
    worksheet.addRow(row);
  }

  // Style en-tête
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9EAD3' },
  };

  if (options.format === 'csv') {
    const csvBuffer = await workbook.csv.writeBuffer();
    return Buffer.from(csvBuffer);
  }

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(xlsxBuffer);
}
