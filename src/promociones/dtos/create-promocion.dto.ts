// create-promocion.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { TipoPromocion } from "../entities/promocion.entity";

export class CreatePromocionDto {
  @ApiProperty({
    description: "Nombre de la promoción",
    example: "Descuento Verano 2024",
  })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({
    description: "Descripción de la promoción",
    example: "20% de descuento en todas las camisetas",
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: "Tipo de promoción",
    enum: TipoPromocion,
    example: TipoPromocion.PorcentajeDescuento,
  })
  @IsEnum(TipoPromocion)
  tipo: TipoPromocion;

  @ApiProperty({
    description: "Valor del descuento (fijo o porcentaje)",
    example: 20,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @ApiProperty({
    description: "Fecha de inicio de la promoción",
    example: "2024-01-01T00:00:00Z",
  })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({
    description: "Fecha de fin de la promoción",
    example: "2024-01-31T23:59:59Z",
  })
  @IsDateString()
  fechaFin: string;

  @ApiProperty({
    description: "IDs de productos aplicables (null = todos)",
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productosAplicables?: number[];

  @ApiProperty({
    description: "IDs de categorías aplicables",
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoriasAplicables?: number[];

  @ApiProperty({
    description: "Cantidad mínima de productos",
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidadMinima?: number;

  @ApiProperty({
    description: "Monto mínimo de compra",
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoMinimo?: number;

  @ApiProperty({
    description: "Límite total de usos",
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limiteUsos?: number;

  @ApiProperty({
    description: "Solo para clientes mayoristas",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  soloMayoristas?: boolean;
}
