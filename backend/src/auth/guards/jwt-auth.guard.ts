// jwt-auth.guard.ts - CAMBIAR SOLO ESTA PARTE
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }
    
    try {
      const payload = this.jwtService.verify(token);
      
      // ✅ ESTA ES LA LÍNEA CLAVE - transformar payload
      request.user = {
        id_empleado: payload.sub,
        empleado: payload.nombre,  // ← "OMAR FABIAN CRISANTO RETO"
        nivel_acceso: payload.nivel_acceso
      };
      
      console.log('✅ req.user:', request.user); // DEBUG temporal
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
