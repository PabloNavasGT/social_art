const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

class MediaService {
  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME;
    this.publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  }

  async uploadFile(file) {
    if (!file || !file.buffer) {
      throw { statusCode: 400, message: 'Archivo inválido o vacío' };
    }

    const tipo = file.mimetype.startsWith('video/') ? 'video' : 'image';
    const ext = path.extname(file.originalname) || (tipo === 'video' ? '.mp4' : '.jpg');
    const uniqueName = `${tipo}s/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueName,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await this.s3.send(command);

    return {
      url: `${this.publicUrl}/${uniqueName}`,
      tipo
    };
  }

  async uploadMultipleFiles(files = []) {
    return await Promise.all(files.map(file => this.uploadFile(file)));
  }
}

module.exports = new MediaService();