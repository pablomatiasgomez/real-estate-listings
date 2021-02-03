# Real Estate Listings

Real Estate Listings is a script that helps you keep track of real estate listing changes. In particular, it currently
supports mostly Argentinian websites, but it can easily be extended to support other websites as well.

When the script is run, it will iterate over all the provided urls, and notify you for any change that happened,
compared to the previous exported version of that website.

The currently supported websites are the following:

| Real Estate Listing Site | Single Listing | Listings Search |
| :---: | :---: | :---: |
| [ZonaProp](https://www.zonaprop.com.ar/)              | ✅ | ✅ |
| [ArgenProp](https://www.argenprop.com/)               | ✅ | ✅ |
| [MercadoLibre](https://www.mercadolibre.com.ar/)      | ✅ | ✅ |
| [CabaProp](https://cabaprop.com.ar/)                  | ✅ | ✅ |
| [EnBuenosAires](https://www.enbuenosaires.com/)       | ✅ | ✅ |
| [Properati](https://www.properati.com.ar/)            | ✅ | ✅ |
| [LaGranInmobiliaria](https://lagraninmobiliaria.com/) | ✅ | ✅ |
| [ICasas](https://www.icasas.com.ar/)                  | ✅ | ✅ |
| [LiderProp](https://liderprop.com/es-ar/)             | ✅ | ✅ |
| [MeMudoYa](https://www.memudoya.com/)                 | ✅ | ✅ |

| Real Estate Agency Specific Listing Site | Single Listing | Listings Search |
| :---: | :---: | :---: |
| [Remax](https://www.remax.com.ar/)                    | ✅ | ✅ |
| [Maluma](https://maluma.com.ar/)                      | ✅ |    |
| [SiGroup](https://www.sigroupinmobiliaria.com/)       | ✅ |    |
| [Varcasia](https://varcasiapropiedades.com.ar/)       | ✅ |    |
| [Magnacca](https://magnaccapatelli.com/)              | ✅ |    |
| [MenendezProp](http://www.menendezprop.com.ar/)       | ✅ | ✅ |

## Prerequisites

Before you begin, you need to have chrome installed in your machine, if you don't have it or you experience errors
running `npm install` when installing puppeteer, try running the following:

```
# Versions
CHROME_DRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE`

# Remove existing downloads and binaries so we can start from scratch.
sudo apt-get remove google-chrome-stable

# Install dependencies.
sudo apt-get update
sudo apt-get install -y unzip openjdk-8-jre-headless xvfb libxi6 libgconf-2-4

# Install Chrome.
sudo curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add
sudo echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
sudo apt-get -y update
sudo apt-get -y install google-chrome-stable
```

## Installation

Run

```
npm install
```

## Usage

First you need to create a `config.json` located at the root. You can start with the defaults doing:

```
cp config.default.json config.json
```

```json
{
  "urlsSource": {
    "googleSheet": {
      "enabled": false,
      "credentials": null,
      "spreadsheetId": null
    },
    "files": {
      "enabled": false,
      "files": []
    }
  },
  "telegram": {
    "token": null,
    "chatId": null
  }
}
```

Where:

* `urlsSource` - configures where to fetch the urls from:
    * `googleSheet` - Gets all the urls from all the sheets inside the spreadsheet with id `spreadsheetId`, by looking
      up all the columns that have "links" as header. Uses `credentials` to authenticate as a service account.
    * `files` - Reads each file in `files` (path relative to the project folder), line by line and ignores lines that
      start with "//" or are empty.
* `telegram` - Telegram configuration used to notify the changes:
    * `token` - bot token, provided when you create the bot
    * `chatId` - chat in which you want to receive the notifications. You can retrieve the bot's chats by getting the
      latest messages, using https://api.telegram.org/bot{TOKEN}/getUpdates

Then you can run it using `./scripts/start.sh` which will run the app in background and notify of any change.

If you want o run the app periodically, you could set up a cron like this:

```
10 7 * * * /usr/local/bin/node /path/real-estate-listings/src/export.js >> /path/real-estate-listings/logs/stdout.log 2>&1
```
