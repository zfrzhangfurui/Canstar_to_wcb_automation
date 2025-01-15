import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import config from './config/';
import { AppService } from './app.service';
import { DownloadModule } from './download/download.module';
import { ExcelModule } from './excel/excel.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { WpModule } from './wp/wp.module';
import { CommonModule } from './common/common.module';
import { DataTransformationModule } from './data_transfer/data_transformation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    DownloadModule,
    ExcelModule,
    PuppeteerModule,
    WpModule,
    CommonModule,
    DataTransformationModule,
  ],
  providers: [AppService],
})
export class AppModule {}
