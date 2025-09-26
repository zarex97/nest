// productos.module.ts - ACTUALIZADO
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductosController } from "./productos.controller";
import { ProductosService } from "./productos.service";
import { ProductoRopa } from "./entities/producto-ropa.entity";
import { CategoriaRopa } from "./entities/categoria-ropa.entity";
import { MaterialTextil } from "./entities/material-textil.entity";
import { StockProducto } from "./entities/stock-producto.entity";
import { Talla } from "./entities/talla.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductoRopa,
      CategoriaRopa,
      MaterialTextil,
      StockProducto,
      Talla,
    ]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService, TypeOrmModule],
})
export class ProductosModule {}
