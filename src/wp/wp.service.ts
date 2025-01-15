import { resolve } from 'path';

import { map } from 'lodash';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sleep from 'sleep-promise';

import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class WpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly puppeteerService: PuppeteerService,
  ) {}
  async upload() {
    const dir = await this.commonService.getDir();
    console.log('dir to upload:', dir);
    if (!dir) {
      console.warn('upload wp: 没有下载文件，无需执行');
      return;
    }
    const base = await this.configService.get('env.chrome.downloadPath');
    console.log(`base: ${base}`);
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
    console.log("===login ");
    for (const { file, wpItem } of files) {
      const itemUrl = `https://www.withcashback.com.au/wp-admin/upload.php?item=${wpItem}`;
      console.log("itemUrl >> ",itemUrl);
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
