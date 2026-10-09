import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    'KO — CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET manquant(s) dans .env',
  );
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

// PNG 1x1 transparent (~70 octets)
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function main() {
  const publicId = `partiva-test/${Date.now()}`;

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: publicId, folder: 'partiva-test' },
      (error, res) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(res);
      },
    );
    stream.end(TINY_PNG);
  });

  const url = String(result.secure_url ?? result.url);
  if (!url.startsWith('https://res.cloudinary.com/')) {
    throw new Error(`URL Cloudinary inattendue : ${url}`);
  }

  console.log('OK — upload Cloudinary réussi');
  console.log('  public_id :', result.public_id);
  console.log('  url       :', url);
  console.log('  format    :', result.format);
  console.log('  bytes     :', result.bytes);

  await new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(String(result.public_id), (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  console.log('  cleanup   : fichier supprimé');
}

main()
  .catch((e) => {
    console.error('KO — échec validation Cloudinary :', e.message ?? e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
