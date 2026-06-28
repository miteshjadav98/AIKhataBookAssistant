import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DecimalToNumberInterceptor } from './common/decimal.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';

  // Restrict CORS to known frontend origins in production.
  // Set CORS_ORIGINS as a comma-separated list, e.g.
  //   CORS_ORIGINS=https://app.miteklabs.tech,https://ai.miteklabs.tech
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: isProduction ? (corsOrigins.length > 0 ? corsOrigins : false) : true,
    credentials: true,
  });

  // Serialize Prisma Decimal (money) values as JSON numbers across all responses.
  app.useGlobalInterceptors(new DecimalToNumberInterceptor());

  // Swagger is disabled in production to avoid exposing the full API surface publicly.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('KhataBook CRM API')
      .setDescription('API for managing shop credit, customers, and transactions')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`\n🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger docs at http://localhost:${process.env.PORT ?? 3000}/api\n`);
}
bootstrap();
