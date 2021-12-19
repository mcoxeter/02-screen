#!/usr/bin/env node
import fs from 'fs';
const config = require('./config.json');

async function app() {
  var myArgs = process.argv.slice(2);
  const symbol = myArgs[0];

  const path = `${config.path}/${symbol}`;

  const requiredPaths = [path, `${path}/02-screen`];
  const nowDate = new Date();
  const padNum = (num: number) => num.toString().padStart(2, '0');

  const nowDateStr = `${nowDate.getFullYear()}.${padNum(
    nowDate.getMonth() + 1
  )}.${padNum(nowDate.getDate())}`;

  requiredPaths.forEach((p) => {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }
  });

  const lastDataFile = fs
    .readdirSync(`${path}/core`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const stats = require(`${path}/core/${lastDataFile}`);

  const longTermDebt = stats.data.data.financials.annual.lt_debt;
  const cfi_ppe_purchases: number[] =
    stats.data.data.financials.annual.cfi_ppe_purchases;
  const cash_from_operations: number[] =
    stats.data.data.financials.annual.cf_cfo;

  const periods: number[] = lastNFromArray<string>(
    10,
    stats.data.data.financials.annual.period_end_date
  )
    .map((x) => x.split('-')[0])
    .map((x) => Number(x));

  const total_current_assets: number[] = lastNFromArray(
    10,
    stats.data.data.financials.annual.total_current_assets
  );

  const total_current_liabilities: number[] = lastNFromArray(
    10,
    stats.data.data.financials.annual.total_current_liabilities
  );

  const total_equity: number[] = stats.data.data.financials.annual.total_equity;

  if (cash_from_operations.length < 10) {
    throw new Error('Company has not been reporting results for 10 years');
  }

  const fcf10Years = add_values(
    lastNFromArray(10, cash_from_operations),
    lastNFromArray(10, cfi_ppe_purchases)
  );

  const fcfLastYear: number = add_values(
    lastNFromArray(1, cash_from_operations),
    lastNFromArray(1, cfi_ppe_purchases)
  )[0];

  const debtAnalysis = analyseDebt(periods, longTermDebt, fcfLastYear);

  const fcfAnalysis = analyseFcf(periods, fcf10Years);

  const ratioAnalysis = analyseRatio(
    periods,
    total_current_assets,
    total_current_liabilities
  );

  const equityAnalysis = analyseEquity(periods, total_equity);

  // const equityIncreasingScore = scoreIncreasing(total_equity);

  let screen = {
    symbol,
    notes:
      'Free Cash Flow - Is this a money making machine. Debt - Is there a rick of bankruptcy. ',
    references: ["'https://youtu.be/j0TK40w9HhY'"],
    debtAnalysis,
    fcfAnalysis,
    ratioAnalysis,
    equityAnalysis,
    rating:
      debtAnalysis.score +
      fcfAnalysis.score +
      ratioAnalysis.score +
      equityAnalysis.score
  };

  console.log('Writing ', `${path}/02-screen/${nowDateStr}.json`);
  try {
    fs.writeFileSync(
      `${path}/02-screen/${nowDateStr}.json`,
      JSON.stringify(screen, undefined, 4)
    );
  } catch (err) {
    console.error(err);
  }
}

interface IFcfAnalysis extends IAnalysis {
  periods: number[];
  fcf10Years: number[];
  fcfIncreasingScore: number;
  fcfPositiveScore: number;
}

function analyseFcf(periods: number[], fcf10Years: number[]): IFcfAnalysis {
  const fcfIncreasingScore = scoreIncreasing(fcf10Years);
  const fcfPositiveScore = scorePositive(fcf10Years);
  return {
    description:
      'This looks at the free cash flow over the last ten years. It is scoring for positive and increasing values.',
    greenFlags: [],
    redFlags: [],
    reference: [],
    periods,
    fcf10Years,
    fcfIncreasingScore,
    fcfPositiveScore,
    score: fcfIncreasingScore + fcfPositiveScore
  };
}

interface IAnalysis {
  description: string;
  reference: string[];
  redFlags: string[];
  greenFlags: string[];

  score: number;
}

interface IRatioAnalysis extends IAnalysis {
  periods: number[];
  total_current_assets: number[];
  total_current_liabilities: number[];
  ratios: number[];
  ratioScore: number;
  ratiosIncreasingScore: number;
}
function analyseRatio(
  periods: number[],
  total_current_assets: number[],
  total_current_liabilities: number[]
): IRatioAnalysis {
  if (total_current_assets.length !== total_current_liabilities.length) {
    throw new Error('values have different lengths');
  }

  let ratios: number[] = [];

  let ratioScore = 0;
  for (let i = 0; i < total_current_assets.length; i++) {
    const ratio = Math.round(
      total_current_assets[i] / total_current_liabilities[i]
    );
    ratios.push(ratio);

    ratioScore += 1 * ratio; // +ve ratios give more, -ve rations give less
  }

  ratioScore = Math.round(ratioScore / total_current_assets.length);

  const ratiosIncreasingScore = scoreIncreasing(ratios);

  return {
    description:
      'This scores the ratio between assests and liabilities in the company. The more assests than libabilites the better.',
    reference: [],
    redFlags: [],
    greenFlags: [],
    periods,
    total_current_assets,
    total_current_liabilities,
    ratios,
    ratioScore,
    ratiosIncreasingScore,
    score: ratiosIncreasingScore + ratioScore
  };
}

interface IDebtAnalysis extends IAnalysis {
  periods: number[];
  annualDebt: number[];
  fcf: number;
  currentLongTermDebt: number;
  zeroDebtScore: number;
  canRepayDebtWithFCFScore: number;
}
function analyseDebt(
  periods: number[],
  annualDebt: number[],
  fcf: number
): IDebtAnalysis {
  let zeroDebtScore = 0;
  for (const debt of lastNFromArray(10, annualDebt)) {
    if (debt === 0) {
      zeroDebtScore++;
    }
  }

  const currentLongTermDebt = annualDebt.slice(-1)[0];
  const canRepayDebtWithFCFScore = currentLongTermDebt < fcf * 3 ? 10 : -10;

  return {
    description:
      'This looks at the long term debt in the company and is they can easily repay it. It is looking at the risk of bankrupty.',
    reference: [],
    redFlags: [],
    greenFlags: [],
    periods,
    annualDebt,
    fcf,
    currentLongTermDebt,
    zeroDebtScore,
    canRepayDebtWithFCFScore,
    score: zeroDebtScore + canRepayDebtWithFCFScore
  };
}

interface IEquityAnalysis extends IAnalysis {
  periods: number[];
  total_equity: number[];
  equityIncreasingScore: number;
}

function analyseEquity(
  periods: number[],
  total_equity: number[]
): IEquityAnalysis {
  const equityIncreasingScore = scoreIncreasing(total_equity);
  return {
    description:
      "Equity is What's left over when you subtract all the liabilities from the assets. It's what the business owners actually own. This is on the balance sheet",
    greenFlags: [],
    redFlags: [],
    reference: [],
    periods,
    total_equity,
    equityIncreasingScore,
    score: equityIncreasingScore
  };
}

function scoreIncreasing(values: number[]): number {
  const [, ...ahead] = values;

  let score = 0;

  for (let i = 0; i < ahead.length; i++) {
    const current = values[i];
    const next = ahead[i];
    if (next > current) {
      score++;
    }
  }
  return score;
}

function scoreDecreasing(values: number[]): number {
  const [, ...ahead] = values;

  let score = 0;

  for (let i = 0; i < ahead.length; i++) {
    const current = values[i];
    const next = ahead[i];
    if (next < current) {
      score++;
    }
  }
  return score;
}

function scorePositive(value: number[]): number {
  // If the next year has greater FCF than the current year, then we increase the score.
  let score = 0;
  for (const fcf of value) {
    if (fcf > 0) {
      score++;
    }
  }

  return score;
}

function lastNFromArray<T>(n: number, values: T[]): T[] {
  return values.slice(-n);
}

function add_values(values1: number[], values2: number[]): number[] {
  if (values1.length !== values2.length) {
    throw new Error('values have different lengths');
  }

  let result: number[] = [];
  for (let i = 0; i < values1.length; i++) {
    result = [...result, values1[i] + values2[i]];
  }
  return result;
}

function sub_values(values1: number[], values2: number[]): number[] {
  if (values1.length !== values2.length) {
    throw new Error('values have different lengths');
  }

  let result: number[] = [];
  for (let i = 0; i < values1.length; i++) {
    result = [...result, values1[i] - values2[i]];
  }
  return result;
}

app();
