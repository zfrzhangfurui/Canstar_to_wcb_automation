import { lstatSync, readdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { resolve } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { createId } from '@paralleldrive/cuid2';

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

  orderOldestFiles = (dir: string) => {
    return readdirSync(dir)
      .filter((file) => lstatSync(join(dir, file)).isDirectory())
      .map((file) => ({ file, mtime: lstatSync(join(dir, file)).mtime }))
      .sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
  };

  async getDir() {
    const base = await this.configService.get('env.chrome.downloadPath');
    const dir = this.orderReccentFiles(base);
    this.logger.info(dir);
    return dir.length ? dir[0].file : undefined;
  }

  async agingFiles() {
    this.logger.info("===> check for aging ");
    const base = await this.configService.get('env.chrome.downloadPath');
    const max_file_count = await this.configService.get('env.aging.maxFileCount');
    const dir = this.orderOldestFiles(base);
    let length = dir.length;
    while (length > max_file_count) {
      let dir_to_remove =dir.shift();
      this.logger.info(`===> remove file, name: ${dir_to_remove.file}, create time: ${dir_to_remove.mtime}`);
      rmdirSync(resolve(base, dir_to_remove.file),{ recursive: true });
      length = dir.length;
    }
    this.logger.info("===> aging done");
  }
}
