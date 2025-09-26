import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarritoController } from './carrito.controller';
import { CarritoService } from './carrito.service';
import { Carrito } from './entities/carrito.entity';
import { DetalleCarrito } from './entities/detalle-carrito.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Carrito,
      DetalleCarrito
    ])
  ],
  controllers: [CarritoController],
  providers: [CarritoService],
  exports: [CarritoService]
})
export class CarritoModule {}
