import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class CommonService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) { }

  orderReccentFiles = (dir: string) => {
    return readdirSync(dir)
      .filter((file) => lstatSync(join(dir, file)).isDirectory())
      .map((file) => ({ file, mtime: lstatSync(join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  };

  async getDir() {
    const base = await this.configService.get('env.chrome.downloadPath');
    const dir = this.orderReccentFiles(base);
    this.logger.info(dir);
    return dir.length ? dir[0].file : undefined;
  }
}
