import { Module } from '@nestjs/common';

import { ExcelService } from './excel.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
