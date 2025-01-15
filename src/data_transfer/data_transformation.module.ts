import { Module } from '@nestjs/common';
import { DataTransformationService } from 'src/data_transfer/data_transformation.service';


@Module({
  imports: [],
  providers: [DataTransformationService],
  exports: [DataTransformationService],
})
export class DataTransformationModule {}
