// src/common/filters/multer-config.ts
import { diskStorage } from "multer";
import { extname } from "path";
import { BadRequestException } from "@nestjs/common";

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Determinar carpeta basada en el tipo de archivo
      let folder = "./uploads/";

      if (req.url.includes("/productos/")) {
        folder += "productos/";
      } else if (req.url.includes("/personalizacion/")) {
        folder += "diseños/";
      } else {
        folder += "general/";
      }

      cb(null, folder);
    },
    filename: (req, file, cb) => {
      // Generar nombre único para el archivo
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf", // Para diseños
      "image/svg+xml", // Para logos SVG
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException("Tipo de archivo no permitido"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
};

// src/config/app.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  name: process.env.APP_NAME || "Sublimación API",
  baseUrl: process.env.APP_URL || "http://localhost:3000",
  port: parseInt(process.env.PORT) || 3000,
  apiPrefix: process.env.API_PREFIX || "api",
  fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || "es",
  headerLanguage: process.env.APP_HEADER_LANGUAGE || "x-custom-lang",

  // Configuración de archivos
  uploadPath: process.env.UPLOAD_PATH || "./uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
  ],
}));
