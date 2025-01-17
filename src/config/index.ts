import { Console } from "console";
import fs from 'fs';

export default () => {
  const pick_sys_path = ([path_to_windows, path_to_linux]) => {

    if (process.platform === 'win32') {
      return `${process.cwd()}${path_to_windows}`;
    };
    if (process.platform === 'linux') {
      return `${process.cwd()}${path_to_linux}`;
    };
    console.error("system environment is not supported by application");
    return process.exit(1);
  };


  const env = {
    projectionRulePath: process.env.EXCEL_PROJECTIOIN_RULE_PATH || pick_sys_path(['\\projection-rule.json\\', '/projection-rule.json']),
    chrome: {
      executablePath: process.env.CHROME_EXECUTABLE_PATH || pick_sys_path(['\\chrome\\chrome-win\\', '/chrome/chrome-linux/chrome']),
      downloadPath: pick_sys_path([`\\download\\`, '/download/']),
      headless: !!process.env.CHROME_RUNTIME_HEADLESS || false,
    },
    canstar: {
      url: 'https://www.canstarview.com.au/',
      username: process.env.CANSTAR_USERNAME,
      password: process.env.CANSTAR_PASSWORD,
    },
    wp: {
      url: 'https://www.withcashback.com.au/freelend3000/',
      username: process.env.WP_USERNAME,
      password: process.env.WP_PASSWORD,
    },
  };
  const views = [
    {
      viewName: 'WCB 00',
      as: 'Report-OO.csv',
      destSheetName: 'WCB-OO',
      wpItem: '3024',
    },
    {
      viewName: 'WCB INV',
      as: 'Report-INV.csv',
      destSheetName: 'WCB-INV',
      wpItem: '1210',
    },
    {
      viewName: 'WCB SMSF',
      as: 'Report-SMSF.csv',
      destSheetName: 'WCB-SMSF',
      wpItem: '1213',
    },
  ];
  const downloadConfig = {
    views,
    all: {
      destSheetName: 'WCB-ALL',
      wpItem: '1189',
    },
  };
  return { env, downloadConfig };
};
