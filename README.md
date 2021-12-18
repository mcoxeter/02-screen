# 02-screen

This program will score the fundamental numbers for a business. This score will dermine if it is a candidate for further analysis.

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

### Outpur folder structure

_path_/_stock-name_/02-screen/_date_.json

e.g.
C:/Business analysis/Evaluation/FB/02-screen/2021.12.18.json

## What does it do?

It performs analysis on

1. Debt (Risk)
2. Free Cash Flow (Positive and increasing)
3. Assest vs Liabilities (Lots more assets than liabilites)
4. Equity (Positive and increasing)

The output file contains a scoring and a breakdown of the score.
