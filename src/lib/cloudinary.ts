import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('[CLOUDINARY-CONFIG-FINAL]', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key
    ? String(cloudinary.config().api_key).substring(0, 6)
    : undefined,
});

export { cloudinary };
