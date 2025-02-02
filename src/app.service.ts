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
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { Browser } from 'puppeteer-core';
import { match } from 'assert';

type taskFunction = {
  description: string,
  fn: (browser: Browser) => Promise<void>;
}

@Injectable()
export class AppService {
  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly downloadService: DownloadService,
    private readonly excelService: ExcelService,
    private readonly wpService: WpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
  ) { }

  async init() {
    await this.scheduler();
  }

  async scheduler() {
    let { retryTime: _retryTime, interval: _interval } = this.configService.get('env.scheduler');
    const retryTime = parseInt(_retryTime);
    const interval = parseInt(_interval);
    this.logger.info(`===> retry time: ${retryTime}`);
    this.logger.info(`===> interval: ${interval}`);
    let last_timestamp = new Date().getTime() - interval - 1;

    while (true) {
      const current_timestamp = new Date().getTime();
      if (current_timestamp - last_timestamp > interval) {
          await this.run_task_group(retryTime);
          last_timestamp = current_timestamp;
      } else {
        this.logger.info("===> Waiting for the next task to be scheduled.");
        await sleep(1000);
      }
    }
  }

  async run_task_group(retryTime: number) {
    try {
      this.commonService.agingFiles();
      const download = await this.downloadService.download();
      if (!await this.run_task({ description: "run download function", fn: download }, retryTime)){
        return;
      }
      await this.excelService.handle();
      const upload = await this.wpService.upload();
      if (!await this.run_task({ description: "run upload function", fn: upload }, retryTime)){
        return;
      }
    }catch (err){
      this.logger.error(`global catch err: `, err);
    }
  }

  async run_task(taskFun: taskFunction, retryTime: number): Promise<boolean> {
    let browser: Browser;
    for (let i = 0; i < retryTime; i++) {
      browser = await this.puppeteerService.launch();
      try {
        await taskFun.fn(browser);
        let inner_logger = this.logger;
        await browser.close().catch((err) => {
          return inner_logger.error(`browser close error: `, err);
        });
        this.logger.info("browser closed");
        return true;
      } catch (err) {
        this.logger.error(`run_task catch err: `, err);
        this.logger.info(`=======job ${taskFun.description} failed, retry automation task, remaining times: ${retryTime - i + 1} ========`);
        let inner_logger = this.logger;
        await browser.close().catch((err) => {
          return inner_logger.error(`browser close error: `, err);
        });
        this.logger.info("browser closed");
      }
    }
    return false;
  }
}
