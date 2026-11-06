export interface StlExportOptions {
  url: string;
  filename: string;
}

export function downloadStl({ url, filename }: StlExportOptions): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.stl') ? filename : `${filename}.stl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
