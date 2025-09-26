import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PedidosController } from "./pedidos.controller";
import { PedidosService } from "./pedidos.service";
import { Pedido } from "./entities/pedido.entity";
import { DetallePedido } from "./entities/detalle-pedido.entity";
import { Transaccion } from "./entities/transaccion.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, DetallePedido, Transaccion])],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
