import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateEstadoDto {
  @IsNotEmpty()
  @IsEnum(['pendiente', 'en_revision', 'aprobada', 'reprobada']) // ✅ Sin 'completada'
  estado: string;
}