import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ROTALOG_BOOTSTRAP');
  const app = await NestFactory.create(AppModule);

  // Habilita CORS amplo para desenvolvimento (Web Dashboard Next.js e Mobile Expo Go)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Habilita validação automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log('===========================================================');
  logger.log(` 🚀 ROTALOG Backend Operacional iniciado com sucesso!`);
  logger.log(` 📡 Servidor rodando em: http://localhost:${port}`);
  logger.log(` 🔐 Autenticação: /auth/login e atalhos em /auth/quick-users`);
  logger.log(` 🚗 Veículos e Frota: /vehicles`);
  logger.log(` 📋 Checklists Manuais: /checklists/template`);
  logger.log(` 🛣️ Operações de Rota: /usages`);
  logger.log(` ⏱️ Ponto Eletrônico CLT: /timeclock`);
  logger.log(` 🔔 Alertas e Notificações: /notifications`);
  logger.log('===========================================================');
}

bootstrap();
