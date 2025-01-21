import { resolve } from 'path';

import { map } from 'lodash';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sleep from 'sleep-promise';

import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { CommonService } from 'src/common/common.service';

import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class WpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly puppeteerService: PuppeteerService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}
  async upload() {
    const dir = await this.commonService.getDir();
    this.logger.info('dir to upload:', dir);
    if (!dir) {
      this.logger.warn('upload wp: 没有下载文件，无需执行');
      return;
    }
    const base = await this.configService.get('env.chrome.downloadPath');
    this.logger.info(`base: ${base}`);
    const basepath = resolve(base, dir);
    const { views, all } = await this.configService.get('downloadConfig');
    const files = [
      ...map(views, ({ destSheetName, wpItem }) => ({
        file: destSheetName,
        wpItem,
      })),
      { file: all.destSheetName, wpItem: all.wpItem },
    ];
    const browser = await this.puppeteerService.launch();
    const page = await browser.newPage();
    const { url, username, password } = await this.configService.get('env.wp');
    await page.goto(url);
    await page.waitForSelector('.input');
    await page.type('#user_login', username);
    await page.type('#user_pass', password);
    // console.log("=== username and password typed");
    await page.click('#wp-submit');
    await page.waitForNavigation({ timeout: 10000 });
    this.logger.info("===login ");
    for (const { file, wpItem } of files) {
      const itemUrl = `https://www.withcashback.com.au/wp-admin/upload.php?item=${wpItem}`;
      this.logger.info("itemUrl >> ",itemUrl);
      await sleep(5000);
      await page.goto(itemUrl);
      const uploadCss1 = 'form.compat-item a.button-secondary';
      const btn = await page.waitForSelector(uploadCss1, { timeout: 10000 });
      await sleep(5000);
      await btn.click();
      await page.waitForNavigation({ timeout: 5000 });
      const uploadCss2 = 'input#upload-file';
      const fileInput = await page.waitForSelector(uploadCss2, {
        timeout: 5000,
      });
      const filepath = resolve(basepath, `${file}.csv`);
      await sleep(5000);
      await fileInput.uploadFile(filepath);
      await page.click('input#submit');
      await sleep(5000);
    }
  }
}
