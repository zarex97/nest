import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturacionController } from './facturacion.controller';
import { FacturacionService } from './facturacion.service';
import { Factura } from './entities/factura.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Factura])
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService],
  exports: [FacturacionService]
})
export class FacturacionModule {}
