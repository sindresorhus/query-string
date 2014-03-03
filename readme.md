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


## Example

```js
console.log(location.search);
// ?foo=bar

var parsed = queryString.parse(location.search);
console.log(parsed);
// {foo: 'bar'}

parsed.foo = 'unicorn';
parsed.ilike = 'pizza';
location.search = queryString.stringify(parsed);

console.log(location.search);
// ?foo=unicorn&ilike=pizza
```


## API

### queryString.parse(*string*)

Parse a query string into an object.

### queryString.stringify(*object*)

Stringify an object into a query string.


## Nesting

This module intentionally doesn't support nesting as it's not specced and varies between implementations, which causes a lot of [edge cases](https://github.com/visionmedia/node-querystring/issues).

You're much better off just converting the object to a JSON string:

```js
queryString.stringify({
  foo: 'bar',
  nested: JSON.stringify({
    unicorn: 'cake'
  })
});
// foo=bar&nested=%7B%22unicorn%22%3A%22cake%22%7D
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
