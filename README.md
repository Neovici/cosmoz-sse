[![Build Status](https://github.com/Neovici/cosmoz-sse/workflows/Github%20CI/badge.svg)](https://github.com/Neovici/cosmoz-sse/actions?workflow=Github+CI)
[![Code Climate](https://codeclimate.com/github/codeclimate/codeclimate/badges/gpa.svg)](https://codeclimate.com/github/Neovici/cosmoz-sse)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/Neovici/cosmoz-sse)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

# &lt;cosmoz-sse&gt;

`<cosmoz-sse>` is an element that allows subscribing to server-sent events.

## Install

`npm install`

## Custom event transport

Call `setEventSourceFactory` before mounting subscribers to use a transport that
supports authentication headers or another runtime. The browser's `EventSource`
remains the default. The factory receives the URL and `EventSourceInit` options,
and returns an object with `addEventListener`, `removeEventListener`, and `close`.
The component closes it and removes listeners when disconnected.

```js
import { setEventSourceFactory } from '@neovici/cosmoz-sse/cosmoz-sse.js';

const reset = setEventSourceFactory((url, options) =>
	createAuthenticatedSource(url, options),
);
// Mount subscribers after configuring the transport.
// Call reset() before mounting new subscribers to restore the prior factory.
```

## Viewing Your Element

Start a web server @ port `8080` providing an event source at `/events`, then:

```
$ npm start
```

## Running Tests

```
$ npm test
```
