import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


// Cargar .env solo en local
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌍 CORS seguro para Railway + local
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // 🛡️ Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🌐 Prefijo global API
  app.setGlobalPrefix('api', {
    exclude: ['health', 'swagger'],
  });

  // 📘 Swagger solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('EF App API')
      .setDescription('API para digitalización de formularios de evaluación')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 🚀 Puerto Railway (con fallback local)
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  console.log(`🚀 Backend iniciado en el puerto ${port}`);
  console.log(`🌍 CORS permitido para:`, allowedOrigins);
  console.log(`🗄️ DATABASE_URL presente: ${!!process.env.DATABASE_URL}`);
}


bootstrap().catch((err) => {
  console.error('❌ Error al iniciar servidor:', err);
  process.exit(1);
});
