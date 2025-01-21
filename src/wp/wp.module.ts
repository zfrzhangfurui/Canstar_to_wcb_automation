import { Logger, Module } from '@nestjs/common';

import { WpService } from './wp.service';
import { PuppeteerModule } from 'src/puppeteer/puppeteer.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [PuppeteerModule, CommonModule,],
  providers: [WpService,Logger],
  exports: [WpService],
})
export class WpModule {}
