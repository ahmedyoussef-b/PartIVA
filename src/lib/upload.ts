import { cloudinary } from '@/lib/cloudinary';

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

  const publicId = `${folder}/${crypto.randomUUID()}`;

  const upload = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: publicId,
        folder,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result as Record<string, unknown>);
      },
    );
    stream.end(file);
  });

  return {
    url: String(upload.secure_url ?? upload.url),
    publicId: String(upload.public_id),
    format: String(upload.format ?? ''),
    size: Number(upload.bytes ?? file.byteLength),
  };
}
