import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppService } from './app.service';


async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();
  const service = app.get(AppService);
  await service.init();
  await app.close();
  process.exit(0);
}
bootstrap();
