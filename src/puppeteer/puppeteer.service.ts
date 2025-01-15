import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-core';

@Injectable()
export class PuppeteerService {
  constructor(private readonly configService: ConfigService) {}
  async launch() {
    const { executablePath, headless } = await this.configService.get(
      'env.chrome',
    );
    // const headless = true;
    // const executablePath = 'google-chrome-stable';
    console.log('=====executablePath', executablePath);
    console.log('=====headless', headless, typeof headless);
    const browser = await puppeteer.launch({
      headless,
      executablePath,
      ignoreDefaultArgs: ['--enable-automation','--disable-extensions'],
      defaultViewport: null,
    });
    return browser;
  }
}
