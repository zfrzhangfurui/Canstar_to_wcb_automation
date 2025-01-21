import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-core';

import {Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class PuppeteerService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}
  async launch() {
    const { executablePath, headless } = await this.configService.get(
      'env.chrome',
    );
    // const headless = true;
    // const executablePath = 'google-chrome-stable';
    this.logger.info(`=====executablePath: ${executablePath}`);
    this.logger.info(`=====headless, ${headless}, ${typeof headless}`);
    const browser = await puppeteer.launch({
      headless,
      executablePath,
      ignoreDefaultArgs: ['--enable-automation','--disable-extensions'],
      defaultViewport: null,
    });
    return browser;
  }
}
