
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
            resource_type: 'auto'
        }, (err, result) => {
            if (err) {
                console.error('Cloudinary upload error:', err);
                reject(err);
            }
            resolve(result);
        }).end(buffer);
    });

    return NextResponse.json({ result });
  } catch (error)
  {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
