# n8n-nodes-browser

[![npm version](https://badge.fury.io/js/n8n-nodes-browser.svg)](https://badge.fury.io/js/n8n-nodes-browser)

This is an n8n community node to control a headless browser using the [Puppeteer](https://pptr.dev) library.

![logo](./docs/puppeteer.svg)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)  
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

__WARNING__: During the `npm`-based installation of this plugin, `puppeteer` will attempt to install a working version of `chrome` or `chromium` on the machine. It's quite possible that it will either be unable to find a suitable one, or it won't work on your particular platform due to missing system dependencies. You can refer to the [troubleshooting](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md) document for instructions on how to fix this.

The following steps have been known to work:

### On Docker

#### For `alpine`-based images

For `alpine`-based images (e.g. `n8nio/n8n:latest`), the following command will install the latest `chromium`:

```sh
apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont
```

Once installed, you would then have to instruct `puppeteer` to use that version instead of the embedded one, by setting these env variables:

- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`

#### For `debian`-based images

For `debian`-based images (e.g. `n8nio/n8n:latest-debian`), the following command will install the latest `chrome-browser`, including all dependencies, which should enable the embedded puppeteer version to also work:

```sh
apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
```

#### Cache folder

In any case, you may need to set the following env variable to instruct `puppeteer` where to store its embedded chrome browser binaries, since the default location may be wiped if not properly persisted in your container in a durable volume:

- `PUPPETEER_CACHE_DIR=/root/.n8n/.cache/puppeteer`

## Operations

- Page:
  - Take Screenshot
  - Save as PDF
  - Get HTML

## Credentials

No credentials for this node

## Compatibility

Tested against n8n v0.196.0

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Browserless](https://browserless.js.org)
- [Puppeteer](https://pptr.dev)

## Version history

### 0.1.0

First Release!
