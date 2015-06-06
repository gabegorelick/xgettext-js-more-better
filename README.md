# xgettext-js-more-better

> Extract gettext strings from Javascript source code, but more better than existing extractors

## Install

Install with [npm](https://npmjs.com/xgettext-js-more-better).

```sh
npm install --save xgettext-js-more-better
```

## Example

```js
var xgettext = require('xgettext-js-more-better');

xgettext('gettext("Hi")', {/* gettext options */}, {/* acorn options */});
```

## API

`xgettext-js-more-better` exports a single function, `extract`, that takes
the following parameters:

### `source`

A string of Javascript containing translatable to extract

### `gettextOptions`

Optional object containing options used by `xgettext-js-more-better`.
These options are passed to [gettext-catalog](https://github.com/gabegorelick/gettext-catalog).

The most important option passed here is `filename`, which is used for
generating [references](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html).
For example,

```js
xgettext('gettext("Hi")', {filename: 'foo.js'});
```

### `acornOptions`

Optional object containing options passed to [acorn](https://github.com/marijnh/acorn)
(by way of [falafel](https://github.com/substack/node-falafel)). Use this to
customize Javascript parsing behavior. For example, to extract strings from ES6
code:

```js
xgettext('let foo = gettext("Hi")', {}, {ecmaVersion: 6});
```

## License
MIT
