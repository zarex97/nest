import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsPositive,
} from "class-validator";
import { EstadoProducto, Temporada } from "../entities/producto-ropa.entity";

export class UpdateProductoDto {
  @ApiProperty({
    description: "Nombre del producto",
    example: "Camiseta Básica Cotton",
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiProperty({
    description: "Descripción detallada del producto",
    example: "Camiseta de algodón 100% ideal para sublimación",
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: "Precio unitario del producto",
    example: 25.99,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio?: number;

  @ApiProperty({
    description: "Precio para ventas mayoristas",
    example: 22.99,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precioMayorista?: number;

  @ApiProperty({
    description: "ID de la categoría",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  categoriaId?: number;

  @ApiProperty({
    description: "ID del material textil",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  materialId?: number;

  @ApiProperty({
    description: "URL de la imagen principal",
    example: "/uploads/productos/camiseta-basica.jpg",
    required: false,
  })
  @IsOptional()
  @IsString()
  imagenPrincipal?: string;

  @ApiProperty({
    description: "URLs de imágenes adicionales",
    example: ["/uploads/productos/camiseta-basica-2.jpg"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenesAdicionales?: string[];

  @ApiProperty({
    description: "Estado del producto",
    enum: EstadoProducto,
    example: EstadoProducto.Activo,
    required: false,
  })
  @IsOptional()
  @IsEnum(EstadoProducto)
  estado?: EstadoProducto;

  @ApiProperty({
    description: "Peso del producto en gramos",
    example: 150,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  peso?: number;

  @ApiProperty({
    description: "Tiempo de producción en días",
    example: 3,
    minimum: 1,
    maximum: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  tiempoProduccion?: number;

  @ApiProperty({
    description: "Si es producto de temporada",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  esTemporada?: boolean;

  @ApiProperty({
    description: "Temporada del producto",
    enum: Temporada,
    example: Temporada.TodoElAno,
    required: false,
  })
  @IsOptional()
  @IsEnum(Temporada)
  temporada?: Temporada;
}
