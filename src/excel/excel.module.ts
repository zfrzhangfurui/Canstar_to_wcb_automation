import { Module } from '@nestjs/common';

import { ExcelService } from './excel.service';
import { CommonModule } from 'src/common/common.module';
import { DataTransformationModule } from 'src/data_transfer/data_transformation.module';

@Module({
  imports: [CommonModule, DataTransformationModule],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
