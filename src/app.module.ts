import { Module } from '@nestjs/common';
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
const { combine, timestamp, align, printf, errors } = format;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    DownloadModule,
    ExcelModule,
    PuppeteerModule,
    WpModule,
    CommonModule,
    WinstonModule.forRoot({
      format: combine(
        errors({ stack: true }),
        timestamp({ format: new Date().toLocaleTimeString('en-AU',{
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
          timeZone: "Australia/Melbourne"
        })}),
        align(),
        printf((info) => { 
          console.log(info);
          if(info.stack){
            return `[${info.timestamp}] [${info.level}]: ${info.message} (${info.stack})`;
          }
          return `[${info.timestamp}] [${info.level}]: ${info.message}`;}),
      ),
      transports: [
        new transports.Console(),
        new transports.DailyRotateFile(
          {
            dirname: process.env.LOG_PATH,
            filename: 'withCashBack-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '5m',
            maxFiles: '180d',
          }
        )],
        // exceptionHandlers: [
        //   new transports.File({ filename: 'exceptions.log' })
        // ]
    }),
  ],
  providers: [AppService],
})
export class AppModule { }