// src/common/services/file.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

@Injectable()
export class FileService {
  constructor(private configService: ConfigService) {}

  async processProductImage(file: Express.Multer.File): Promise<string> {
    if (!this.isImageFile(file)) {
      throw new BadRequestException("El archivo debe ser una imagen");
    }

    try {
      // Redimensionar y optimizar imagen
      const outputPath = file.path.replace(
        path.extname(file.path),
        "_optimized.jpg"
      );

      await sharp(file.path)
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      // Eliminar archivo original
      fs.unlinkSync(file.path);

      // Retornar URL relativa
      return outputPath.replace("./uploads/", "/uploads/");
    } catch (error) {
      throw new BadRequestException("Error al procesar la imagen");
    }
  }

  async processDesignFile(file: Express.Multer.File): Promise<string> {
    // Validar que es un archivo de diseño válido
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".svg", ".pdf"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException("Formato de archivo de diseño no válido");
    }

    // Para archivos SVG o PDF, no necesitamos procesamiento adicional
    if (fileExtension === ".svg" || fileExtension === ".pdf") {
      return file.path.replace("./uploads/", "/uploads/");
    }

    // Para imágenes, optimizar pero mantener calidad alta
    try {
      const outputPath = file.path.replace(
        path.extname(file.path),
        "_design.png"
      );

      await sharp(file.path)
        .resize(2000, 2000, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ quality: 95 })
        .toFile(outputPath);

      fs.unlinkSync(file.path);
      return outputPath.replace("./uploads/", "/uploads/");
    } catch (error) {
      throw new BadRequestException("Error al procesar el archivo de diseño");
    }
  }

  deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(
        "./uploads/",
        filePath.replace("/uploads/", "")
      );
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private isImageFile(file: Express.Multer.File): boolean {
    return file.mimetype.startsWith("image/");
  }

  getFileUrl(relativePath: string): string {
    const baseUrl =
      this.configService.get<string>("app.baseUrl") || "http://localhost:3000";
    return `${baseUrl}${relativePath}`;
  }
}
