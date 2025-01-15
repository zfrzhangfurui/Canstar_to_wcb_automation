import { Module } from '@nestjs/common';

import { DownloadService } from './download.service';
import { PuppeteerModule } from 'src/puppeteer/puppeteer.module';

@Module({
  imports: [PuppeteerModule],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
