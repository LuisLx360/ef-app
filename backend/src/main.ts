import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// 🔹 Cargar variables de entorno ANTES de cualquier import
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔹 CORS para tu frontend Vite/React
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  // 🔹 Validación global (recomendado)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 🔹 Prefijo global para APIs
  app.setGlobalPrefix('api', {
    exclude: ['health', 'swagger', 'auth/login']
  });

  // 🔹 Swagger para desarrollo (FIX COMPLETO)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('EF App API')
      .setDescription('API para digitalización de formularios de evaluación')
      .setVersion('1.0')
      .addBearerAuth(  // ✅ CONFIGURACIÓN COMPLETA
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Pega tu token: Bearer eyJhbGciOiJIUzI1NiIs...',
          in: 'header',
        },
        'JWT-auth'  // ✅ NOMBRE ESPECÍFICO
      )
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
  console.log(`✅ Supabase conectado: ${!!process.env.DATABASE_URL ? 'Sí' : 'No'}`);
}

bootstrap().catch(err => {
  console.error('❌ Error al iniciar servidor:', err);
  process.exit(1);
});
