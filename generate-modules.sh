#!/bin/bash

# Script para generar la estructura de módulos base del sistema de sublimación

echo "Generando estructura de módulos base..."

# Crear directorios principales
mkdir -p src/productos/{dtos,entities,guards}
mkdir -p src/pedidos/{dtos,entities,enums}
mkdir -p src/carrito/{dtos,entities}
mkdir -p src/chat/{dtos,entities,gateways}
mkdir -p src/personalizacion/{dtos,entities}
mkdir -p src/facturacion/{dtos,entities}
mkdir -p src/promociones/{dtos,entities}
mkdir -p src/favoritos/{dtos,entities}

# Productos Module
cat > src/productos/productos.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { ProductoRopa } from './entities/producto-ropa.entity';
import { CategoriaRopa } from './entities/categoria-ropa.entity';
import { MaterialTextil } from './entities/material-textil.entity';
import { StockProducto } from './entities/stock-producto.entity';
import { Talla } from './entities/talla.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductoRopa,
      CategoriaRopa, 
      MaterialTextil,
      StockProducto,
      Talla
    ])
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService]
})
export class ProductosModule {}
EOF

# Pedidos Module
cat > src/pedidos/pedidos.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { Pedido } from './entities/pedido.entity';
import { DetallePedido } from './entities/detalle-pedido.entity';
import { Transaccion } from './entities/transaccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      DetallePedido,
      Transaccion
    ])
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService]
})
export class PedidosModule {}
EOF

# Carrito Module
cat > src/carrito/carrito.module.ts << 'EOF'
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
EOF

# Chat Module
cat > src/chat/chat.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatConversacion } from './entities/chat-conversacion.entity';
import { ChatMensaje } from './entities/chat-mensaje.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatConversacion,
      ChatMensaje
    ])
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService]
})
export class ChatModule {}
EOF

# Personalizacion Module
cat > src/personalizacion/personalizacion.module.ts << 'EOF'
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
EOF

# Favoritos Module
cat > src/favoritos/favoritos.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritosController } from './favoritos.controller';
import { FavoritosService } from './favoritos.service';
import { Favorito } from './entities/favorito.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorito])
  ],
  controllers: [FavoritosController],
  providers: [FavoritosService],
  exports: [FavoritosService]
})
export class FavoritosModule {}
EOF

# Promociones Module  
cat > src/promociones/promociones.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromocionesController } from './promociones.controller';
import { PromocionesService } from './promociones.service';
import { Promocion } from './entities/promocion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promocion])
  ],
  controllers: [PromocionesController],
  providers: [PromocionesService],
  exports: [PromocionesService]
})
export class PromocionesModule {}
EOF

# Facturacion Module
cat > src/facturacion/facturacion.module.ts << 'EOF'
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
EOF

echo "Estructura de módulos base creada exitosamente!"
echo ""
echo "Directorios creados:"
echo "- src/productos/"
echo "- src/pedidos/"
echo "- src/carrito/"
echo "- src/chat/"
echo "- src/personalizacion/"
echo "- src/facturacion/"
echo "- src/promociones/"
echo "- src/favoritos/"
echo ""
echo "Archivos .module.ts generados para cada módulo."
echo "Recuerda agregar estos módulos al app.module.ts"