import { cpSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { formatInTimeZone } from 'date-fns-tz';

import { CommonService } from 'src/common/common.service';
import { DataTransformationService } from 'src/data_transfer/data_transformation.service';

@Injectable()
export class ExcelService {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly dataTransformationService: DataTransformationService,
  ) { }

  async handle() {
    const dir = await this.commonService.getDir();
    console.log('dir to parse and export:', dir);
    if (!dir) {
      console.warn('parse excel: 没有下载文件，无需执行');
      return;
    }
    const base = await this.configService.get('env.chrome.downloadPath');
    const basepath = resolve(base, dir);
    const views = await this.configService.get('downloadConfig.views');

    let data_arr:Array<{destSheetName: String, data:any[]}> = [];
    for (const { as, destSheetName } of views) {
      console.log(`===> parsing sheet ${as}`);
      const file = readFileSync(resolve(basepath, as), 'utf16le');
      let data: WCBOOCanstar[] = parse(file, {
        encoding: 'utf16le',
        bom: true,
        columns: (header) => {
          return header.map(col => col.replace(/ /g, '_').replace(/[^\w]/g, '').toLowerCase());
        },
        delimiter: '\t',
        trim: true
      },);

      //to proform data filter 
      data = data.filter((val)=>parseInt(val.rate.toString()) < 10);
      
      // console.log(`wcb canstar: ${data[0].maximum_lvr}`);
      let edited_data_arr = data.map(val => {
        let wcb = new WCBTemplate(val, as);
        return Object.values(wcb)
      });

      console.log(`WCB temple: ${edited_data_arr[0]}`);
      data_arr.push({
        destSheetName,
        data: edited_data_arr
      })      
    }

    const all = <{destSheetName:String, wpItem: String}>await this.configService.get('downloadConfig.all');
    console.log(`===> parsing sheet ${all.destSheetName}`);
    data_arr.push({
      destSheetName: all.destSheetName,
      data: data_arr.reduce((acc,cur) =>acc.concat(JSON.parse(JSON.stringify(cur.data))), [])
    })

    for (const {destSheetName, data} of  data_arr) {
      console.log(`===> generating sheet ${destSheetName}, number of rows: ${data.length}`);
      data.unshift(['Lender', 'Product', 'Rate', 'Comp', 'Property Type', 'Loan type', 'Repayment', 'LVR', 'Apply', 'Offset',
        'Upfront fees', 'Ongoing fees', 'Discharge', 'Minimum loan', 'Family guarantee', 'Construction', 'Split options'
      ]);

      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(data), destSheetName.toString());
      XLSX.writeFile(book, resolve(basepath, `${destSheetName}.csv`), {
        type: 'file',
        bookType: 'csv',
        sheet:destSheetName.toString()
      })
    }
  }
}

interface WCBOOCanstar {
  institution: String,
  rank_of_sort_order: String,
  product_name: String,
  rate: String,
  aapr_for_150k_over_25_years: String,
  fixed_or_variable_rate: String,
  principalintint_only_or_both: String,
  min_loan_amount: String,
  max_loan_amount: String,
  max_term_of_loan_years: String,
  discharge_fee: String,
  application_fee: String,
  valuation_charge: String,
  documentation_charge: String,
  legal_fee: String,
  securitization_fee: String,
  settlement_fee: String,
  ongoing_annual_fee: String,
  ongoing_monthly_fee: String,
  ongoing_semiannual_fee: String,
  ongoing_quarterly_fee: String,
  family_guarantee_is_available: String,
  construction_loan_available: String,
  split_option_available: String,
  mortgage_portable: String,
  mortgage_offset_account_available: String,
  additional_regular_repayments_allowed: String,
  interest_in_advance_facility: String,
  maximum_lvr: String,
}



class WCBTemplate {
  lender: String;
  product: String;
  rate: String;
  comp: String;
  loan_type: String;
  repayment: string;
  lvr: String;
  apply: string;
  offset: String;
  upfront_fees: string;
  ongoing_fees: string;
  discharge: String;
  minimum_loan: String;
  family_guarantee: String;
  construction: String;
  split_options: String;
  property_type: String;

  constructor(canstar: WCBOOCanstar, as: String) {
    this.lender = canstar.institution;
    this.product = canstar.product_name ? canstar.product_name : "";
    this.rate = canstar.rate ? canstar.rate : "";
    this.comp = canstar.aapr_for_150k_over_25_years ? canstar.aapr_for_150k_over_25_years : "";
    this.property_type = this.property_type_cal(as);
    this.loan_type = canstar.fixed_or_variable_rate ? canstar.fixed_or_variable_rate : "";
    this.repayment = canstar.principalintint_only_or_both ? this.repayment_cal(canstar.principalintint_only_or_both) : "";
    this.lvr = canstar.maximum_lvr ? `${canstar.maximum_lvr}%` : "";
    this.apply = canstar.institution ? `/quick-application/?lender=${this.lender}&rate=${this.rate} p.a&product=${this.product}&type=${this.property_type}||Get Started` : "";
    this.offset = canstar.mortgage_offset_account_available ? canstar.mortgage_offset_account_available : "";
    this.upfront_fees = canstar.institution ? (Number(canstar.application_fee) + Number(canstar.valuation_charge) + Number(canstar.documentation_charge) + Number(canstar.legal_fee) + Number(canstar.securitization_fee) + Number(canstar.settlement_fee)).toString() : "";
    this.ongoing_fees = canstar.institution ? this.ongoing_fee_cal(canstar.ongoing_annual_fee, canstar.ongoing_monthly_fee, canstar.ongoing_quarterly_fee, canstar.ongoing_semiannual_fee) : "";
    this.discharge = canstar.institution ? Number(canstar.discharge_fee).toString() : "";
    this.minimum_loan = canstar.institution ? canstar.min_loan_amount : "";
    this.family_guarantee = canstar.institution ? canstar.family_guarantee_is_available : "";
    this.construction = canstar.institution ? canstar.construction_loan_available : "";
    this.split_options = canstar.institution ? canstar.split_option_available : "";
  }

  property_type_cal(as: String) {
    switch (as) {
      case "Report-OO.csv": return "Owner Occupied";
      case "Report-INV.csv": return "Investment";
      case "Report-SMSF.csv": return "SMSF";
      default: return "";
    }
  }

  repayment_cal(repayment: String) {
    if (repayment === "Both") return "Both";
    if (repayment === "P+I") return "P & I";
    return "Interest Only";
  }

  ongoing_fee_cal(annual: String, monthly: String, quarterly: String, semiannual: String) {
    let total = Number(annual) + Number(monthly) * 12 + Number(semiannual) * 2 + Number(quarterly) * 4;
    return total.toString();
  }
}
