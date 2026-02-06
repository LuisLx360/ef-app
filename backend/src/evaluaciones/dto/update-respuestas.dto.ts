import { 
  IsArray, 
  IsInt, 
  IsBoolean, 
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
}

export class UpdateRespuestasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRespuestaDto)
  respuestas: UpdateRespuestaDto[];
}