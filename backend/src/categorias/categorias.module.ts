import { Module } from '@nestjs/common';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { DbModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';  // ← Añadir esto

@Module({
  imports: [DbModule, AuthModule],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}
