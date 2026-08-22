import { Response } from 'express';
import { AuthRequest } from '../middlewares/authGuard';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

// Configurar Cloudinary usando variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha proporcionado ningún archivo de imagen' });
  }

  // Verificar si las credenciales de Cloudinary están presentes
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      message: 'Falta configurar las credenciales de Cloudinary en el archivo .env del servidor (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)',
    });
  }

  try {
    const uploadStream = () => {
      return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'jotabarber',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });
    };

    const result = await uploadStream();

    return res.json({
      message: 'Imagen subida a Cloudinary con éxito',
      url: result.secure_url,
    });
  } catch (error: any) {
    console.error('Error al subir a Cloudinary:', error);
    return res.status(500).json({ message: 'Error al subir la imagen a Cloudinary', error: error.message });
  }
};
