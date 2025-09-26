// src/common/guards/file-validation.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from "@nestjs/common";

@Injectable()
export class FileValidationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const file = request.file;
    const files = request.files;

    // Validar archivo único
    if (file) {
      this.validateFile(file);
    }

    // Validar múltiples archivos
    if (files && Array.isArray(files)) {
      if (files.length > 5) {
        throw new BadRequestException(
          "No se pueden subir más de 5 archivos a la vez"
        );
      }

      files.forEach((f) => this.validateFile(f));
    }

    return true;
  }

  private validateFile(file: Express.Multer.File): void {
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("El archivo no puede ser mayor a 5MB");
    }

    // Validar tipo de archivo
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException("Tipo de archivo no permitido");
    }
  }
}
