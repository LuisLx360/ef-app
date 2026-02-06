import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ CORS habilitado para Vite (React)
  app.enableCors({
    origin: 'http://localhost:5173',  // ← Tu frontend Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Backend corriendo en http://localhost:3000');
}
bootstrap();