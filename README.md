# Real Estate Listings

Real Estate Listings is a bot that will help you keep track of real estate listing changes, in particular in for Argentinian websites.

Currently, supports the following websites:

| Site |  Single Listing | Listings Search |
| :---: | :---: | :---: |
| [ZonaProp](https://www.zonaprop.com.ar/)              | ✅ | ✅ |
| [ArgenProp](https://www.argenprop.com/)               | ✅ | ✅ |
| [MercadoLibre](https://www.mercadolibre.com.ar/)      | ✅ | ✅ |
| [Properati](https://www.properati.com.ar/)            | ✅ |    |
| [EnBuenosAires](https://www.enbuenosaires.com/)       | ✅ |    |
| [Remax](https://www.remax.com.ar/)                    | ✅ |    |
| [LaGranInmobiliaria](https://lagraninmobiliaria.com/) | ✅ |    |
| [Maluma](https://maluma.com.ar/)                      | ✅ |    |
| [ICasas](https://www.icasas.com.ar/)                  | ✅ |    |
| [SiGroup](https://www.sigroupinmobiliaria.com/)       | ✅ |    |
| [CabaProp](https://cabaprop.com.ar/)                  | ✅ | ✅ |
| [Varcasia](https://varcasiapropiedades.com.ar/)       | ✅ |    |

## Prerequisites

Before you begin, you need to have chrome installed in your machine, if you don't have it or you experience errors running `npm install` when installing puppeteer, try running the following:
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

First you need to create a `config.json`, with the following:


```json
{
    "urlsSource": {
        "googleSheet": {
            // Gets all the urls from all the sheets inside this spreadsheet
            // by looking up all the columns that have "links" as header.
            "enabled": false,
            "credentials": null,
            "spreadsheetId": null
        },
        "files": {
            // Reads the file line by line and ignores lines that start with "//" or are empty.
            "enabled": false,
            "files": []
        }
    },
    "telegram": {
        "token": null,
        // Can be retrieved using https://api.telegram.org/bot{TOKEN}/getUpdates
        "chatId": null
    }
}
```

Then you can run it using `./scripts/start.sh` which will run the app in background and notify of any change.

If you want o run the app periodically, you could set up a cron like this:

```
10 7 * * * /usr/local/bin/node /path/real-estate-listings/src/export.js >> /path/real-estate-listings/logs/stdout.log 2>&1
```
