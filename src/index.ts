#!/usr/bin/env node
import fs from 'fs';

async function app() {
  var myArgs = process.argv.slice(2);
  const symbol = myArgs[0];

  const path = `C:/Users/Mike/OneDrive - Digital Sparcs/Investing/Value Investing Process/Business analysis/Evaluation/${symbol}/`;

  const requiredPaths = [path, `${path}/basics`];
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
  const ppe_net: number[] = stats.data.data.financials.annual.cfi_ppe_net;
  const cash_from_operations: number[] =
    stats.data.data.financials.annual.cf_cfo;

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
    lastNFromArray(10, ppe_net)
  );

  const fcfLastYear: number = add_values(
    lastNFromArray(1, cash_from_operations),
    lastNFromArray(1, ppe_net)
  )[0];

  const lackOfDebtScore = scoreLackOfLongTermDebt(longTermDebt, fcfLastYear);

  const fcfIncreasingScore = scoreIncreasing(fcf10Years);
  const fcfPositiveScore = scorePositive(fcf10Years);

  const assetsIncreasingScore = scoreIncreasing(total_current_assets);
  const liabilitiesDescreasingScore = scoreDecreasing(
    total_current_liabilities
  );

  const assetsVsLiabilitesScore = scoreRatio(
    total_current_assets,
    total_current_liabilities
  );

  const equityIncreasingScore = scoreIncreasing(total_equity);

  let basics = {
    symbol,
    lackOfDebtScore,
    fcfIncreasingScore,
    fcfPositiveScore,
    assetsIncreasingScore,
    liabilitiesDescreasingScore,
    assetsVsLiabilitesScore,
    equityIncreasingScore,
    rating:
      lackOfDebtScore +
      fcfIncreasingScore +
      fcfPositiveScore +
      assetsIncreasingScore +
      liabilitiesDescreasingScore +
      assetsVsLiabilitesScore +
      equityIncreasingScore
  };

  console.log('Writing ', `${path}basics/${nowDateStr}.json`);
  try {
    fs.writeFileSync(
      `${path}/basics/${nowDateStr}.json`,
      JSON.stringify(basics, undefined, 4)
    );
  } catch (err) {
    console.error(err);
  }
}

function scoreRatio(values1: number[], values2: number[]): number {
  if (values1.length !== values2.length) {
    throw new Error('values have different lengths');
  }

  let score = 0;
  for (let i = 0; i < values1.length; i++) {
    const ratio = values1[i] / values2[i];

    score += 1 * ratio; // +ve ratios give more, -ve rations give less
  }

  return Math.round(score / values1.length);
}

function scoreLackOfLongTermDebt(annualDebt: number[], fcf: number): number {
  // Does the managment like using debt?
  // Can the current debt be paid off with 3 years of fcf?

  let managementScore = 0;
  for (const debt of lastNFromArray(10, annualDebt)) {
    if (debt === 0) {
      managementScore++;
    }
  }

  const currentLongTermDebt = annualDebt.slice(-1)[0];

  if (currentLongTermDebt < fcf * 3) {
    managementScore += 10;
  } else {
    managementScore -= 10;
  }

  return managementScore;
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

function lastNFromArray(n: number, values: number[]): number[] {
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
