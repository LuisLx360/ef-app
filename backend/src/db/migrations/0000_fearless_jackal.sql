CREATE TABLE "categorias" (
	"id_categoria" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"nivel" varchar(10) NOT NULL,
	"area" varchar(20) NOT NULL,
	"descripcion" text,
	CONSTRAINT "categorias_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "empleados" (
	"id_empleado" varchar(10) PRIMARY KEY NOT NULL,
	"nivel_acceso" varchar(25) NOT NULL,
	"empleado" varchar(150) NOT NULL,
	"jefe_inmediato" varchar(150) NOT NULL,
	"area" varchar(20) NOT NULL,
	"equipo_autonomo" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "evaluaciones" (
	"id_evaluacion" serial PRIMARY KEY NOT NULL,
	"id_empleado" varchar(10),
	"id_categoria" integer NOT NULL,
	"fecha_evaluacion" timestamp DEFAULT now(),
	"evaluador" varchar(150),
	"observaciones" text,
	"estado" varchar(20) DEFAULT 'pendiente',
	"porcentaje_original" numeric(5, 2) DEFAULT 0.00
);
--> statement-breakpoint
CREATE TABLE "historial_evaluaciones" (
	"id_historial" serial PRIMARY KEY NOT NULL,
	"id_evaluacion" integer NOT NULL,
	"porcentaje" numeric(5, 2) NOT NULL,
	"fecha_modificacion" timestamp DEFAULT now(),
	"modificado_por" varchar(150),
	"observaciones_modificacion" text,
	"es_original" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "preguntas" (
	"id_pregunta" serial PRIMARY KEY NOT NULL,
	"id_categoria" integer NOT NULL,
	"id_proceso" integer,
	"titulo" text NOT NULL,
	"descripcion" text,
	"peso" numeric(3, 2) DEFAULT '1.00',
	"orden" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "procesos" (
	"id_proceso" serial PRIMARY KEY NOT NULL,
	"id_categoria" integer NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"orden" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "respuestas" (
	"id_respuesta" serial PRIMARY KEY NOT NULL,
	"id_evaluacion" integer,
	"id_pregunta" integer,
	"respuesta" boolean NOT NULL,
	"no_aplica" boolean DEFAULT false,
	"comentarios" text,
	CONSTRAINT "respuestas_id_evaluacion_id_pregunta_unique" UNIQUE("id_evaluacion","id_pregunta")
);
--> statement-breakpoint
ALTER TABLE "historial_evaluaciones" ADD CONSTRAINT "historial_evaluaciones_id_evaluacion_evaluaciones_id_evaluacion_fk" FOREIGN KEY ("id_evaluacion") REFERENCES "public"."evaluaciones"("id_evaluacion") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_id_evaluacion_evaluaciones_id_evaluacion_fk" FOREIGN KEY ("id_evaluacion") REFERENCES "public"."evaluaciones"("id_evaluacion") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_id_pregunta_preguntas_id_pregunta_fk" FOREIGN KEY ("id_pregunta") REFERENCES "public"."preguntas"("id_pregunta") ON DELETE no action ON UPDATE no action;