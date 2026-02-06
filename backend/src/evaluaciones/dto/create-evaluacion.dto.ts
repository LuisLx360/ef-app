import { IsString, IsInt, Min, IsBoolean, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class RespuestaDto {
  @IsInt()
  @Min(1)
  idPregunta: number;

  @IsBoolean()
  respuesta: boolean;

  @IsOptional()
  @IsString()
  comentarios?: string;
}

export class CreateEvaluacionDto {
  @IsString()
  idEmpleado: string;

  @IsInt()
  @Min(1)
  idCategoria: number;

  @IsOptional()
  @IsString()
  evaluador?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaDto)
  @IsNotEmpty()
  respuestas: RespuestaDto[];
}