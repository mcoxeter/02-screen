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

### Outpur folder structure

_path_/_stock-name_/02-screen/_date_.json

e.g.
C:/Business analysis/Evaluation/FB/02-screen/2021.12.18.json
