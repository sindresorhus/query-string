# query-string [![Build Status](https://secure.travis-ci.org/sindresorhus/query-string.png?branch=master)](http://travis-ci.org/sindresorhus/query-string)

> Parse and stringify URL [query strings](http://en.wikipedia.org/wiki/Query_string)


## Install

Download [manually](https://github.com/sindresorhus/query-string/releases) or with a package-manager.

#### [npm](https://npmjs.org/package/query-string)

```
npm install --save query-string
```

#### [Bower](http://bower.io)

```
bower install --save query-string
```

#### [Component](https://github.com/component/component)

```
component install sindresorhus/query-string
```


## Example using Node.js

```js
var queryString = require('query-string');

var url = 'http://sindresorhus.com?foo=bar'.split('?');
var parsed = queryString.parse(url[1]);
console.log(parsed);
// {foo: 'bar'}

parsed.foo = 'unicorn';
parsed.ilike = 'pizza';
console.log(url[0] + '?' + queryString.stringify(parsed));
// http://sindresorhus.com?foo=unicorn&ilike=pizza
```


## API

### queryString.parse()

Parse a query string into an object.

### queryString.stringify()

Stringify an object into a query string.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
