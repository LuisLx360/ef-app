import { 
  IsArray, 
  IsInt, 
  IsBoolean, 
  IsOptional, 
  Min, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRespuestaDto {
  @IsInt()
  @Min(1)
  idPregunta: number;

  @IsBoolean()
  respuesta: boolean;

  @IsOptional()  // ✅ NUEVO - opcional para mantener valor actual
  @IsBoolean()
  noAplica?: boolean;
}

export class UpdateRespuestasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRespuestaDto)
  respuestas: UpdateRespuestaDto[];
}
