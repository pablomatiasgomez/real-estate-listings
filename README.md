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
| [GrupoMega](https://www.grupomega.com.ar/index.php)   | ✅ | ✅ |
| [Mudafy](https://mudafy.com.ar/)                      |    | ✅ |
| [Morselli](https://morselli.com.ar/)                  | ✅ |    |

## Prerequisites

* Node.js 22.12 or newer (required by puppeteer).

## Installation

Run

```
npm install
```

Puppeteer's `postinstall` script downloads the Chrome version it needs into `~/.cache/puppeteer`.
If Chrome is still missing (e.g. it was installed with `--ignore-scripts`), install it manually:

```
npx puppeteer browsers install chrome
```

On a fresh Linux server, Chrome may also need some system libraries. Running the same command as root with
`--install-deps` installs them as well:

```
npx puppeteer browsers install chrome --install-deps
```

## Usage

First you need to create a `config.json` located at the root. You can start with the defaults doing:

```
cp config.default.json config.json
```

Where:

* `urlsSource` - configures where to fetch the urls from:
    * `googleSheet` - Gets all the urls from all the sheets inside the spreadsheet with id `spreadsheetId`, by looking
      up all the columns that have "links" as header. Uses `credentials` to authenticate as a service account.
    * `files` - Reads each file in `files` (path relative to the project folder), line by line and ignores lines that
      start with "//" or are empty.
* `runOnStartUp` - configures a process to be run on startup and killed at the end. Useful to start proxy connections.
* `browser` - configures how the browser will run and fetch the pages:
    * `proxy` - proxy to be used when launching browser, if any.
    * `xintelApiKey` - apiKey to use when fetching xintel pages.
    * `timeBetweenPageFetchesMs` - Time to wait between each page fetch.
* `telegram` - Telegram configuration used to notify the changes:
    * `token` - bot token, provided when you create the bot.
    * `chatId` - chat in which you want to receive the notifications. You can retrieve the bot's chats by getting the
      latest messages, using https://api.telegram.org/bot{TOKEN}/getUpdates

### Running in background

Then you can run it using `./scripts/start.sh` which will run the app in background and notify of any change.

### Running in foreground

Simply run `./src/main.js diff-check -c config.json`

### Run the app periodically

If you want to run the app periodically, you could set up a cron like this:

```
10 7 * * * /usr/local/bin/node /path/real-estate-listings/src/main.js diff-check -c /path/real-estate-listings/config.json >> /path/real-estate-listings/logs/stdout.log 2>&1
```

## TODO list

* Standardize (create a schema) the output of listing and listings browsers
* Better handling of new export versions to avoid loosing notifications
* Allow ignoring some ids from the listings search