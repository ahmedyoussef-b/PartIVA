import { createHash } from 'crypto';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const ALLOWED_RAW_MIME_TYPES = [
  'application/pdf',
  'application/step',
  'model/stl',
  'application/obj',
] as const;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export class UploadError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_MIME' | 'TOO_LARGE' | 'UPLOAD_FAILED',
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

function assertAllowedMime(mimeType: string, resourceType: 'image' | 'raw'): void {
  const allowed = resourceType === 'image' ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_RAW_MIME_TYPES;
  if (!(allowed as readonly string[]).includes(mimeType)) {
    throw new UploadError(
      `Type MIME non autorisé pour ${resourceType} : ${mimeType}. Autorisés : ${allowed.join(', ')}`,
      'INVALID_MIME',
    );
  }
}

export async function uploadToCloudinary(
  file: Buffer,
  folder: string,
  resourceType: 'image' | 'raw',
  mimeType: string,
): Promise<CloudinaryUploadResult> {
  assertAllowedMime(mimeType, resourceType);

  if (file.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `Fichier trop volumineux (max ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo)`,
      'TOO_LARGE',
    );
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new UploadError('Configuration Cloudinary manquante', 'UPLOAD_FAILED');
  }

  const publicId = `${folder}/${crypto.randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Construire la chaîne à signer avec TOUS les paramètres (triés alpha)
  const paramsToSign = [`folder=${folder}`, `public_id=${publicId}`, `timestamp=${timestamp}`]
    .sort()
    .join('&');

  const signature = createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  console.log('[UPLOAD-CLOUDINARY-REST-SIGN]', {
    paramsToSign: paramsToSign.substring(0, 80) + '...',
  });

  console.log('[UPLOAD-CLOUDINARY-REST]', {
    resourceType,
    folder,
    publicId,
    fileSize: file.byteLength,
    mimeType,
  });

  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(file)], { type: mimeType }));
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('public_id', publicId);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[UPLOAD-CLOUDINARY-REST-ERROR]', { status: response.status, body: errorText });
    throw new UploadError(`Upload Cloudinary échoué (${response.status})`, 'UPLOAD_FAILED');
  }

  const result = await response.json();
  console.log('[UPLOAD-CLOUDINARY-REST-SUCCESS]', {
    public_id: result.public_id,
    secure_url: result.secure_url,
  });

  return {
    url: String(result.secure_url ?? result.url),
    publicId: String(result.public_id),
    format: String(result.format ?? ''),
    size: Number(result.bytes ?? file.byteLength),
  };
}
