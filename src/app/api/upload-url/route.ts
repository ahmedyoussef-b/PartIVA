import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEBUG_PREFIX = '[DEBUG-API-UPLOAD-URL]';

export async function POST(request: NextRequest) {
  console.log(`${DEBUG_PREFIX} === DEMANDE D'URL PRÉSIGNÉE REÇUE ===`);

  try {
    const body = await request.json();
    const fileName = body.fileName || 'unknown.jpg';

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'partiva/requests';

    const params = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    console.log(`${DEBUG_PREFIX} ✅ Signature générée pour: ${fileName}`);

    return NextResponse.json({
      signedUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      signature,
      timestamp,
      apiKey,
      folder,
    });
  } catch (error) {
    console.error(`${DEBUG_PREFIX} 💥 ERREUR GÉNÉRATION SIGNATURE:`, error);
    return NextResponse.json({ error: "Impossible de générer l'url upload" }, { status: 500 });
  }
}
