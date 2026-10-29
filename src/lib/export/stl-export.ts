export async function downloadStl(fileUrl: string, filename: string): Promise<void> {
  let blob: Blob;
  if (fileUrl.startsWith('data:')) {
    const res = await fetch(fileUrl);
    blob = await res.blob();
  } else {
    const res = await fetch(fileUrl);
    blob = await res.blob();
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
