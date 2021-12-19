# 02-screen

This program will score the fundamental numbers for a business. This score will dermine if it is a candidate for further analysis.<br>

<p>The analysis examins the following areas:</p>

**Free Cash Flow (FCF)**

> The cash a company generates after taking into consideration cash outflows that support its operations and maintain its capital assets.<br>

**Long term debt**

> High debt is a bankruptcy risk. Can it pay back its debt easily with the FCF?<br>

**Assest and Liabilities**

> Is there a good ratio between the assests and liabilites? This is also a way to evaluate the risk of the company.<br>

**Equity**

> What's left over when you subtract all the liabilities from the assets. It's what the business owners actually own. Is this increasing?<br>

**ROIC**

> How well the company is using it's money to generate further returns. A measure of how good the management team is.<br>

## Setup

you need to create a config.json file. This will configure the program.
There is one parameter you need to add.

1. path - This is a folder path to where your output files will be stored on your harddisk.

This is an example of a config.json file:

```json
{
  "path": "C:/Business analysis/Evaluation"
}
```

## Usage

> Before you run this program, you will need to have run the `01-data` program first on the stock.

In this example the program will score the fundamental data on Facebook

`npm start -- FB`

## Output

The output of this program is scoring data in json form. It will be outputted into a sub folder of your path in the config file.

### Output folder structure

_path_/_stock-name_/02-screen/_date_.json

e.g.
C:/Business analysis/Evaluation/FB/02-screen/2021.12.18.json

### Example output

```
{
  "symbol": "FB",
  "references": ["'https://youtu.be/j0TK40w9HhY'"],
  "debtAnalysis": {
    "description": "This looks at the long term debt in the company and if they can easily repay it. It is looking at the risk of bankrupty.",
    "reference": [],
    "redFlags": [],
    "greenFlags": ["This company has no current debt! Nice:"],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "annualDebt": [0, 1500000000, 0, 0, 0, 0, 0, 0, 0, 0],
    "currentFcf": 23632000000,
    "currentLongTermDebt": 0,
    "zeroDebtScore": 9,
    "canRepayDebtWithFCFScore": 10,
    "score": 19
  },
  "fcfAnalysis": {
    "description": "This looks at the free cash flow over the last ten years. It is scoring for positive and increasing values.",
    "greenFlags": [],
    "redFlags": [],
    "reference": [],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "fcf10Years": [
      943000000, 377000000, 2860000000, 5495000000, 7797000000, 11617000000,
      17483000000, 15359000000, 21212000000, 23632000000
    ],
    "fcfIncreasingScore": 7,
    "fcfPositiveScore": 10,
    "score": 17
  },
  "ratioAnalysis": {
    "description": "This scores the ratio between assests and liabilities in the company. The more assests than libabilites the better.",
    "reference": [],
    "redFlags": [],
    "greenFlags": [],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "total_current_assets": [
      4604000000, 11267000000, 13070000000, 13390000000, 21652000000,
      34401000000, 48563000000, 50480000000, 66225000000, 75670000000
    ],
    "total_current_liabilities": [
      899000000, 1052000000, 1100000000, 1424000000, 1925000000, 2875000000,
      3760000000, 7017000000, 15053000000, 14981000000
    ],
    "ratios": [5, 11, 12, 9, 11, 12, 13, 7, 4, 5],
    "ratioScore": 9,
    "ratiosIncreasingScore": 6,
    "score": 15
  },
  "equityAnalysis": {
    "description": "Equity is What's left over when you subtract all the liabilities from the assets. It's what the business owners actually own. This is on the balance sheet",
    "greenFlags": [
      "Increasing equity consistantly for the last ten years. Amazing!"
    ],
    "redFlags": [],
    "reference": [],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "total_equity": [
      2162000000, 4899000000, 11755000000, 15470000000, 36096000000,
      44218000000, 59194000000, 74347000000, 84127000000, 101054000000,
      128290000000
    ],
    "equityIncreasingScore": 10,
    "score": 10
  },
  "roicAnalysis": {
    "description": "How well the company is using is money to generate further returns. A measure of how good the management team is. Ideally this should be above 15%. We want over 15% otherwise we could do better ourselves.",
    "greenFlags": [],
    "redFlags": [],
    "reference": [],
    "periods": [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    "roic": [
      0.2555, 0.0055, 0.1018, 0.1132, 0.0913, 0.197, 0.2386, 0.2781, 0.1891,
      0.2343
    ],
    "roicIncreasingScore": 6,
    "roicOver15PercentScore": 6,
    "score": 12
  },
  "rating": 73
}
```
