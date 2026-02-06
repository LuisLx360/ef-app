import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService,
  ) {}

  async login(id_empleado: string) {
    // Buscar empleado por ID
    const empleado = await this.db.getEmpleadoById(id_empleado);
    
    if (!empleado) {
      throw new UnauthorizedException('Empleado no encontrado');
    }

    // Generar JWT con rol
    const payload = {
      sub: empleado.id_empleado,
      nombre: empleado.empleado,
      nivel_acceso: empleado.nivel_acceso,  // "OPERADOR", "SUPERVISOR", etc.
      area: empleado.area,
    };

    return {
      access_token: this.jwtService.sign(payload),
      empleado: {
        id_empleado: empleado.id_empleado,
        nombre: empleado.empleado,
        nivel_acceso: empleado.nivel_acceso,
        area: empleado.area,
      },
    };
  }
}