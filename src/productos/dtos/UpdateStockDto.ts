import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, Min } from "class-validator";

export class UpdateStockDto {
  @ApiProperty({
    description: "Nueva cantidad de stock",
    example: 50,
  })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiProperty({
    description: "Stock mínimo antes de alertar",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimo?: number;

  @ApiProperty({
    description: "Precio adicional por esta talla",
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioAdicional?: number;
}
