import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()  // ← AÑADIR ESTO: hace JwtService disponible en TODOS los módulos
@Module({
  imports: [
    JwtModule.register({
      secret: 'tu-clave-super-secreta-123456',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard,  JwtModule],  // ← Exportar guards también
})
export class AuthModule {}