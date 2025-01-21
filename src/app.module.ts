import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config/';
import { AppService } from './app.service';
import { DownloadModule } from './download/download.module';
import { ExcelModule } from './excel/excel.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { WpModule } from './wp/wp.module';
import { CommonModule } from './common/common.module';
import { WinstonModule } from 'nest-winston';
import 'winston-daily-rotate-file';
import { format, transports } from "winston";
const { combine, timestamp, align, printf } = format;

@Module({
  imports: [
    WinstonModule.forRoot({
        format: combine(
          timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
          align(),
          printf((info) => `[${info.timestamp}] [${info.level}]: ${info.message}`)
        ),
        transports: [
          new transports.Console(),
          new transports.DailyRotateFile(
            {
              dirname: process.env.LOG_PATH,
              filename: 'withCashBack-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              maxFiles: '180d',
            }
          )]
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    DownloadModule,
    ExcelModule,
    PuppeteerModule,
    WpModule,
    CommonModule,
  ],
  providers: [AppService],
})
export class AppModule {}
