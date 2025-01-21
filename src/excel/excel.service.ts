import { readFileSync } from 'fs';
import { resolve } from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { CommonService } from 'src/common/common.service';

import {Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ExcelService {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) { }

  async handle() {
    const dir = await this.commonService.getDir();
    this.logger.info('dir to parse and export:', dir);
    if (!dir) {
      this.logger.warn('parse excel');
      return;
    }
    const base = await this.configService.get('env.chrome.downloadPath');
    const basepath = resolve(base, dir);
    const views = await this.configService.get('downloadConfig.views');

    const projection_rule = JSON.parse(readFileSync(await this.configService.get('env.projectionRulePath'), 'utf-8'));


    let data_arr: Array<{ destSheetName: String, data: WCBTemplate[] }> = [];
    for (const { as, destSheetName } of views) {
      this.logger.info(`===> parsing sheet ${as}`);
      let book = XLSX.readFile(resolve(basepath, as), { type: 'file', dense: true });
      let data = book.Sheets[book.SheetNames[0]]['!data'];
      // console.log(data);
      //delete titles
      data.shift();

      //flat value
      let preprocessed_data = data.map(val => val.map(val => val.v));
      // console.log(preprocessed_data);
      //proform data transfer and data filter
      let processed_data = preprocessed_data.map(val => new WCBTemplate(as, projection_rule, val)).filter(val => parseInt(val.rate.toString()) < 10);

      data_arr.push({
        destSheetName,
        data: processed_data
      })
    }

    const all = <{ destSheetName: String, wpItem: String }>await this.configService.get('downloadConfig.all');
    this.logger.info(`===> parsing sheet ${all.destSheetName}`);
    data_arr.push({
      destSheetName: all.destSheetName,
      data: data_arr.reduce((acc, cur) => {
       const data:WCBTemplate[] =  JSON.parse(JSON.stringify(cur.data));
       return acc.concat(data);
      }, [])
    })

    for (const { destSheetName, data } of data_arr) {
      this.logger.info(`===> generating sheet ${destSheetName}, number of rows: ${data.length}`);
  
      let sheet = XLSX.utils.json_to_sheet(data);

      XLSX.utils.sheet_add_aoa(sheet,[['Lender', 'Product', 'Rate', 'Comp', 'Property Type', 'Loan type', 'Repayment', 'LVR', 'Apply', 'Offset',
        'Upfront fees', 'Ongoing fees', 'Discharge', 'Minimum loan', 'Family guarantee', 'Construction', 'Split options'
      ]],{origin:"A1"});
 

      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book,sheet, destSheetName.toString());

      XLSX.writeFile(book, resolve(basepath, `${destSheetName}.csv`), {
        type: 'file',
        bookType: 'csv',
        sheet:destSheetName.toString()
      })
    }
  }
}

class WCBTemplate {
  lender: String;
  product: String;
  rate: String;
  comp: String;
  property_type: String;
  loan_type: String;
  repayment: String;
  lvr: String;
  apply: String;
  offset: String;
  upfront_fees: String;
  ongoing_fees: String;
  discharge: String;
  minimum_loan: String;
  family_guarantee: String;
  construction: String;
  split_options: String;


  constructor(as: String, projection_rule: Object, data: Array<string | number | boolean | Date>) {
    this.lender = this.invoke_func<String>(as, projection_rule['lender'], data);
    this.product = this.invoke_func<String>(as, projection_rule['product'], data);
    this.rate = this.invoke_func<String>(as, projection_rule['rate'], data);
    this.comp = this.invoke_func<String>(as, projection_rule['comp'], data);
    this.property_type = this.invoke_func<String>(as, projection_rule['property_type'], data);
    this.loan_type = this.invoke_func<String>(as, projection_rule['loan_type'], data);
    this.repayment = this.invoke_func<String>(as, projection_rule['repayment'], data);
    this.lvr = this.invoke_func<String>(as, projection_rule['lvr'], data);
    this.apply = this.invoke_func<String>(as, projection_rule['apply'], data);
    this.offset = this.invoke_func<String>(as, projection_rule['offset'], data);
    this.upfront_fees = this.invoke_func<String>(as, projection_rule['upfront_fees'], data);
    this.ongoing_fees = this.invoke_func<String>(as, projection_rule['ongoing_fees'], data);
    this.discharge = this.invoke_func<String>(as, projection_rule['discharge'], data);
    this.minimum_loan = this.invoke_func<String>(as, projection_rule['minimum_loan'], data);
    this.family_guarantee = this.invoke_func<String>(as, projection_rule['family_guarantee'], data);
    this.construction = this.invoke_func<String>(as, projection_rule['construction'], data);
    this.split_options = this.invoke_func<String>(as, projection_rule['split_options'], data);
  }

  invoke_func<S>(as: String, rule: { func: string }, data: Array<string | number | boolean | Date>): S {
    const parsed_func = new Function('as', 'data', rule.func);
    const val = parsed_func.call({}, as, data);
    return val
  }
}
