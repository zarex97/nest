// src/common/dto/file-upload.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class FileUploadDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Archivo a subir",
  })
  file: Express.Multer.File;
}

export class MultipleFileUploadDto {
  @ApiProperty({
    type: "array",
    items: { type: "string", format: "binary" },
    description: "Archivos a subir (máximo 5)",
  })
  files: Express.Multer.File[];
}
