import { Injectable } from '@nestjs/common';

import { DownloadService } from './download/download.service';
import { ExcelService } from './excel/excel.service';
import { WpService } from './wp/wp.service';
@Injectable()
export class AppService {
  constructor(
    private readonly downloadService: DownloadService,
    private readonly excelService: ExcelService,
    private readonly wpService: WpService,
  ) { }

  async init() {
    try {
      await this.downloadService.download();
      await this.excelService.handle();
      await this.wpService.upload();
    } catch (err) {
      console.log('==========global catch err', err);
    }
    console.log('=======app service done========');
  }
}
