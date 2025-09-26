import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalizacionController } from './personalizacion.controller';
import { PersonalizacionService } from './personalizacion.service';
import { PersonalizacionPrenda } from './entities/personalizacion-prenda.entity';
import { DisenoRopa } from './entities/diseno-ropa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PersonalizacionPrenda,
      DisenoRopa
    ])
  ],
  controllers: [PersonalizacionController],
  providers: [PersonalizacionService],
  exports: [PersonalizacionService]
})
export class PersonalizacionModule {}
