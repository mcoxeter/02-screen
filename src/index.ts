#!/usr/bin/env node
import fs from 'fs';
const config = require('./config.json');

async function app() {
  var myArgs = process.argv.slice(2);

  if (myArgs.length === 0) {
    // When no arguments are passed then we use the evaluate.json file as a list of stocks to evaluate.
    const path = `${config.path}`;
    const evaluationList = require(`${path}/evaluate.json`);

    console.log('Evaluating stocks from evaluate.json');

    for (const evaluate of evaluationList.evaluate) {
      await evaluateStock(evaluate.Symbol);
    }
    return;
  }

  for (const symbol of myArgs) {
    await evaluateStock(symbol);
  }
}

function evaluateStock(symbol: string): void {
  console.log('Procesing stock ' + symbol);
  const path = `${config.path}/Evaluation/${symbol}`;

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
    .readdirSync(`${path}/01-data`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const stats = require(`${path}/01-data/${lastDataFile}`);

  if (!stats.data.data.financials) {
    write(`${path}/02-screen/${nowDateStr}.json`, {
      type: '02-screen',
      redFlags: ['Company not found'],
      symbol,
      date: nowDateStr,
      rating: 0
    });
    return;
  }

  const annual = stats.data.data.financials.annual;

  const longTermDebt: number[] = lastNFromArray(10, annual.lt_debt);
  const cfi_ppe_purchases: number[] = annual.cfi_ppe_purchases;
  const cash_from_operations: number[] = annual.cf_cfo;
  const cash: number[] = annual.cash_and_equiv;

  const periods: number[] = lastNFromArray<string>(10, annual.period_end_date)
    .map((x) => x.split('-')[0])
    .map((x) => Number(x));

  const total_current_assets: number[] = annual.total_current_assets
    ? lastNFromArray(10, annual.total_current_assets)
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const total_current_liabilities: number[] = annual.total_current_liabilities
    ? lastNFromArray(10, annual.total_current_liabilities)
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const roic: number[] = lastNFromArray(10, annual.roic);

  const total_equity: number[] = lastNFromArray(10, annual.total_equity);

  if (cash_from_operations.length < 10) {
    write(`${path}/02-screen/${nowDateStr}.json`, {
      type: '02-screen',
      redFlags: ['Company has not been reporting results for 10 years'],
      symbol,
      date: nowDateStr,
      rating: 0
    });
    return;
  }

  const fcf10Years = add_values(
    lastNFromArray(10, cash_from_operations),
    lastNFromArray(10, cfi_ppe_purchases)
  );

  const cashLastYear = lastNFromArray(1, cash);

  const fcfLastYear: number = add_values(
    lastNFromArray(1, cash_from_operations),
    lastNFromArray(1, cfi_ppe_purchases)
  )[0];

  const debtAnalysis = analyseDebt(
    periods,
    longTermDebt,
    fcfLastYear,
    cashLastYear[0]
  );

  const fcfAnalysis = analyseFcf(periods, fcf10Years);

  const ratioAnalysis = analyseRatio(
    periods,
    total_current_assets,
    total_current_liabilities
  );

  const equityAnalysis = analyseEquity(periods, total_equity);

  const roicAnalysis = analyseROIC(periods, roic);

  let screen = {
    type: '03-screen',
    symbol,
    references: [
      {
        displayName: 'Guide to Quickly Screen Stocks',
        url: 'https://youtu.be/j0TK40w9HhY'
      }
    ],
    date: nowDateStr,
    debtAnalysis,
    fcfAnalysis,
    ratioAnalysis,
    equityAnalysis,
    roicAnalysis,
    rating:
      debtAnalysis.score +
      fcfAnalysis.score +
      ratioAnalysis.score +
      equityAnalysis.score +
      roicAnalysis.score
  };

  write(`${path}/02-screen/${nowDateStr}.json`, screen);
}

function write(file: string, screen: any): void {
  console.log(`Writing ${file}`);
  try {
    fs.writeFileSync(file, JSON.stringify(screen, undefined, 4));
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

  const redflags =
    fcfPositiveScore < 5
      ? ['Warning Will Robinson. This has a terrible FCF']
      : [];
  const greenflags =
    fcfIncreasingScore === 10
      ? ['Increasing FCF consistantly for the last ten years. Amazing!']
      : [];

  return {
    description:
      'This looks at the free cash flow over the last ten years. It is scoring for positive and increasing values.',
    greenFlags: greenflags,
    redFlags: redflags,
    reference: [
      {
        displayName: 'Section 2; Part 11 - Understanding the business : 04:30',
        url: 'https://profitful.online/courses/introduction-to-stock-analysis'
      }
    ],
    periods,
    fcf10Years,
    fcfIncreasingScore,
    fcfPositiveScore,
    score: fcfIncreasingScore + fcfPositiveScore
  };
}

interface IReference {
  displayName: string;
  url: string;
}

interface IAnalysis {
  description: string;
  reference: IReference[];
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
    // when the total liabilites are 0, then we need to skip
    if (total_current_liabilities[i] > 0) {
      const ratio = Math.round(
        total_current_assets[i] / total_current_liabilities[i]
      );
      ratios.push(ratio);

      ratioScore += 1 * ratio; // +ve ratios give more, -ve rations give less
    } else {
      ratios.push(0);
    }
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
  currentFcf: number;
  currentCash: number;
  currentLongTermDebt: number;
  zeroDebtScore: number;
  canRepayDebtWithFCFScore: number;
}
function analyseDebt(
  periods: number[],
  annualDebt: number[],
  currentFcf: number,
  currentCash: number
): IDebtAnalysis {
  let zeroDebtScore = 0;
  for (const debt of lastNFromArray(10, annualDebt)) {
    if (debt === 0) {
      zeroDebtScore++;
    }
  }

  const currentLongTermDebt = annualDebt.slice(-1)[0];
  const canEasilyPaybackDebt =
    currentLongTermDebt < currentFcf * 3 + currentCash;
  const canRepayDebtWithFCFScore = canEasilyPaybackDebt ? 10 : -10;

  const redFlags = canEasilyPaybackDebt
    ? []
    : [
        "This company has a debt issue. It can't repay its long term debt with three years of FCF."
      ];

  const greenFlags: string[] = [];

  if (currentLongTermDebt === 0) {
    greenFlags.push('This company has no current debt! Nice:');
  }
  if (zeroDebtScore === 10) {
    greenFlags.push(
      'This company has not had any debt in the last 10 years!! Amazing:)'
    );
  }

  if (canRepayDebtWithFCFScore === 10 && annualDebt.some((x) => x > 0)) {
    greenFlags.push(
      'They are using debt sensibly. Always been able to repay it easily.'
    );
  }

  return {
    description:
      'This looks at the long term debt in the company and if they can easily repay it. It is looking at the risk of bankrupty.',
    reference: [],
    redFlags: redFlags,
    greenFlags: greenFlags,
    periods,
    annualDebt,
    currentFcf,
    currentCash,
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

  const redflags =
    equityIncreasingScore < 5
      ? ['This company looks like it is going backwards.']
      : [];
  const greenflags =
    equityIncreasingScore === 10
      ? ['Increasing equity consistantly for the last ten years. Amazing!']
      : [];

  return {
    description:
      "**Important** Equity is What's left over when you subtract all the liabilities from the assets. It's what the business owners actually own. This is an important number for share price growth. This is on the balance sheet",
    greenFlags: greenflags,
    redFlags: redflags,
    reference: [
      {
        displayName: 'Section 2; Part 11 - Understanding the business : 02:49',
        url: 'https://profitful.online/courses/introduction-to-stock-analysis'
      }
    ],
    periods,
    total_equity,
    equityIncreasingScore,
    score: equityIncreasingScore
  };
}

interface IROICAnalysis extends IAnalysis {
  periods: number[];
  roic: number[];
  roicIncreasingScore: number;
  roicOver15PercentScore: number;
}

function analyseROIC(periods: number[], roic: number[]): IROICAnalysis {
  const roicIncreasingScore = scoreIncreasing(roic);

  let roicOver15PercentScore = 0;
  for (const aRoic of roic) {
    if (aRoic > 0.15) {
      roicOver15PercentScore++;
    }
  }

  return {
    description:
      'How well the company is using is money to generate further returns. A measure of how good the management team is. Ideally this should be above 15%. We want over 15% otherwise we could do better ourselves.',
    greenFlags: [],
    redFlags: [],
    reference: [],
    periods,
    roic,
    roicIncreasingScore,
    roicOver15PercentScore,
    score: roicIncreasingScore + roicOver15PercentScore
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
