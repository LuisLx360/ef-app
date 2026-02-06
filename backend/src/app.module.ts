import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { CategoriasModule } from './categorias/categorias.module';
import { AuthModule } from './auth/auth.module';  // ← Solo importar, no JwtModule
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';

@Module({
  imports: [
    DbModule,
    CategoriasModule,
    AuthModule,
    EvaluacionesModule,  // ← AuthModule ya tiene todo lo necesario (es @Global)
  ],
})
export class AppModule {}