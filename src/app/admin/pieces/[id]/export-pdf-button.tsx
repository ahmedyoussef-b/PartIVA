'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { downloadPartPdf } from '@/lib/utils/pdf-export';

interface ExportPdfButtonProps {
  name: string;
  reference: string;
  description?: string | null;
}

export function ExportPdfButton({ name, reference, description }: ExportPdfButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => downloadPartPdf({ name, reference, description })}
      data-testid="export-pdf-button"
      className="gap-2"
    >
      <FileText className="h-4 w-4" />
      Exporter PDF
    </Button>
  );
}
