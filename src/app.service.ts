import { Injectable } from '@nestjs/common';

import { DownloadService } from './download/download.service';
import { ExcelService } from './excel/excel.service';
import { WpService } from './wp/wp.service';

import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as sleep from 'sleep-promise';
import { CommonService } from './common/common.service';


@Injectable()
export class AppService {
  constructor(
    private readonly downloadService: DownloadService,
    private readonly excelService: ExcelService,
    private readonly wpService: WpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly commonService : CommonService,
  ) { }


  async scheduler(){
    let { retryTime:_retryTime, interval:_interval } = this.configService.get('env.scheduler');
    const retryTime = parseInt(_retryTime);
    const interval = parseInt(_interval); 
    this.logger.info(`===> retry time: ${retryTime}`);
    this.logger.info(`===> interval: ${interval}`);
    let last_timestamp = new Date().getTime() - interval -1;
    
    while(true){
      const current_timestamp = new Date().getTime();
      if (current_timestamp - last_timestamp > interval) {
         await this.task(retryTime);
        last_timestamp = current_timestamp;
      }else {
        this.logger.info("===> Waiting for the next task to be scheduled.");
         await sleep(1000);
      }

    }
  }

  async task( retryTime: number) {
    for (let i = 1; i < retryTime; i++) {
      try {
        await this.commonService.agingFiles();
        await this.downloadService.download();
        await this.excelService.handle();
        await this.wpService.upload();   
        this.logger.info('=======all jobs done========');
        break;
      } catch (err) {
        this.logger.error(`global catch err: `, err);
        this.logger.info(`=======job failed, retry automation task, remaining times: ${retryTime - i } ========`);
      }
    };
  }

  async init() {
    await this.scheduler();
  }
}
