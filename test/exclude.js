/* eslint-disable node-test/no-conditional-assertion -- Many tests here are table-driven, so the assertions sit inside a loop over the cases. The loop always runs, and every case is checked. */
import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('excludes elements in a URL with a filter array', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1&b=2&c=3#a', ['c']), 'https://example.com/?a=1&b=2#a');
});

test('excludes elements in a URL with a filter predicate', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1&b=2&c=3#a', (name, value) => {
		assert.equal(typeof name, 'string');
		assert.equal(typeof value, 'number');

		return name === 'a';
	}, {
		parseNumbers: true,
	}), 'https://example.com/?b=2&c=3#a');
});

test('excludes elements in a URL without encoding fragment identifiers', () => {
	assert.equal(queryString.exclude('https://example.com?a=b#/home', ['a']), 'https://example.com#/home');
});

test('handles empty filter array', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1&b=2&c=3', []), 'https://example.com/?a=1&b=2&c=3');
});

test('handles large exclusion arrays without quadratic slowdown', () => {
	// The additive term below is a ceiling for garbage collection, not for the
	// parsing. These inputs are megabytes long, so collecting them costs a few
	// hundred milliseconds however the code is written. The factor is what
	// catches a quadratic slowdown, which on an input this size takes seconds.
	const count = 20_000;
	const query = Array.from({length: count}, (_, index) => `a${index}=1`).join('&');
	const url = `https://example.com/?${query}`;
	const filter = Array.from({length: count}, (_, index) => `b${index}`);
	const filterSet = new Set(filter);

	const predicateStartTime = performance.now();
	queryString.exclude(url, key => filterSet.has(key));
	const predicateElapsedTime = performance.now() - predicateStartTime;

	const arrayStartTime = performance.now();
	const result = queryString.exclude(url, filter);
	const arrayElapsedTime = performance.now() - arrayStartTime;

	assert.ok(result.startsWith('https://example.com/?a0=1&a1=1'));
	assert.ok(
		arrayElapsedTime < (predicateElapsedTime * 5) + 1000,
		`Expected exclusion array filtering to stay near the Set predicate baseline. Array: ${arrayElapsedTime}ms. Predicate: ${predicateElapsedTime}ms.`,
	);
});

test('handles excluding non-existent parameters', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1&b=2', ['c', 'd']), 'https://example.com/?a=1&b=2');
});

test('handles multiple values for same parameter', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1&a=2&b=3', ['b']), 'https://example.com/?a=1&a=2');
});

test('handles special characters in parameter names', () => {
	assert.equal(queryString.exclude('https://example.com/?foo%5Bbar%5D=1&normal=2', ['foo[bar]']), 'https://example.com/?normal=2');
});

test('handles URL without query parameters', () => {
	assert.equal(queryString.exclude('https://example.com/', ['a']), 'https://example.com/');
	assert.equal(queryString.exclude('https://example.com/#hash', ['a']), 'https://example.com/#hash');
});

test('excludes all parameters when filter matches everything', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1&b=2&c=3', ['a', 'b', 'c']), 'https://example.com/');
});

test('preserves URL path when excluding parameters', () => {
	assert.equal(queryString.exclude('https://example.com/path/to/page?a=1&b=2', ['a']), 'https://example.com/path/to/page?b=2');
});

test('handles empty string values', () => {
	assert.equal(queryString.exclude('https://example.com/?a=&b=2&c=', ['b']), 'https://example.com/?a=&c=');
});

test('handles parameters without values', () => {
	assert.equal(queryString.exclude('https://example.com/?a&b=2&c', ['b']), 'https://example.com/?a&c');
});

test('filter predicate receives correct arguments for array values', () => {
	const url = 'https://example.com/?a=1&a=2&b=3';
	const result = queryString.exclude(url, (name, value) => {
		if (name === 'a') {
			assert.ok(Array.isArray(value));
			assert.deepEqual(structuredClone(value), ['1', '2']);
			return true;
		}

		return false;
	});
	assert.equal(result, 'https://example.com/?b=3');
});

test('handles relative URLs', () => {
	assert.equal(queryString.exclude('/path?a=1&b=2', ['a']), '/path?b=2');
	assert.equal(queryString.exclude('?a=1&b=2', ['b']), '?a=1');
});

test('handles relative URLs with fragment identifiers', () => {
	assert.equal(queryString.exclude('/users?page=1&sort=name#section', ['sort']), '/users?page=1#section');
});

test('handles fragments with special characters', () => {
	assert.equal(queryString.exclude('https://example.com/?a=1#section/subsection', ['a']), 'https://example.com/#section/subsection');
});

test('handles complex nested parameter names', () => {
	const result = queryString.exclude('https://example.com/?user[name]=John&user[age]=30&id=1', ['user[name]']);
	assert.ok(result === 'https://example.com/?user%5Bage%5D=30&id=1' || result === 'https://example.com/?id=1&user%5Bage%5D=30');
});

test('handles a URL with a fragment identifier that the WHATWG parser rejects', () => {
	assert.equal(queryString.exclude('http://foo.com:99999/p?a=1&b=2#frag', ['b']), 'http://foo.com:99999/p?a=1#frag');
});

test('handles a fragment identifier that starts with `#`', () => {
	assert.equal(queryString.exclude('https://foo.bar/?a=1&b=2#%23top', ['b']), 'https://foo.bar/?a=1#%23top');
});

test('excludes elements in a URL with index array format', () => {
	assert.equal(queryString.exclude('https://foo.bar?foo[1]=b&foo[0]=a&bar=x', ['bar'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=a&foo[1]=b');
});

test('excludes elements in a URL with a percent-encoded fragment identifier', () => {
	assert.equal(queryString.exclude('https://foo.bar?foo=1&bar=2#hello%20world', ['foo']), 'https://foo.bar?bar=2#hello%20world');
});

test('excludes elements in a URL and keeps the fragment identifier as-is', () => {
	assert.equal(queryString.exclude('https://foo.bar?a=1&b=2#a%2Fb/c:d', ['a']), 'https://foo.bar?b=2#a%2Fb/c:d');
	assert.equal(queryString.exclude('https://foo.bar?a=1&b=2#', ['a']), 'https://foo.bar?b=2#');
	assert.equal(queryString.exclude('https://foo.bar?a=1&b=2#hello%20world', (name, value) => value === '1'), 'https://foo.bar?b=2#hello%20world');
	assert.equal(queryString.exclude('https://foo.bar?a=1#section?x=1', ['a']), 'https://foo.bar#section?x=1');
});

test('excludes elements in a URL with `encode: false` and keeps the values as-is', () => {
	assert.equal(queryString.exclude('https://foo.bar?a=%20&b=1+2&c=3', ['c'], {encode: false}), 'https://foo.bar?a=%20&b=1+2');
});

test('excludes elements in a URL with `encode: false` and array formats', () => {
	assert.equal(queryString.exclude('https://foo.bar?a[]=%20&a[]=2&b=1', ['b'], {encode: false, arrayFormat: 'bracket'}), 'https://foo.bar?a[]=%20&a[]=2');
	assert.equal(queryString.exclude('https://foo.bar?a=%2C,2&b=1', ['b'], {encode: false, arrayFormat: 'comma'}), 'https://foo.bar?a=%2C,2');
});

test('excludes elements in a URL with default encoding and re-encodes the values', () => {
	assert.equal(queryString.exclude('https://foo.bar?a=%20&b=1+2&c=3', ['c']), 'https://foo.bar?a=%20&b=1%202');
});

test('drops a query parameter named `__proto__` even when it is not excluded', () => {
	assert.equal(queryString.exclude('https://foo.bar?__proto__=1&a=2', ['a']), 'https://foo.bar');
	assert.equal(queryString.exclude('https://foo.bar?__proto__=1&a=2', ['__proto__']), 'https://foo.bar?a=2');
});

test('sorts the query parameters by default and keeps their order with sort false', () => {
	assert.equal(queryString.exclude('https://example.com/?c=3&b=2&a=1', ['b']), 'https://example.com/?a=1&c=3');
	assert.equal(queryString.exclude('https://example.com/?c=3&b=2&a=1', ['b'], {sort: false}), 'https://example.com/?c=3&a=1');
	assert.equal(queryString.exclude('https://example.com/?c=3&b=2&a=1#hash', [], {sort: false}), 'https://example.com/?c=3&b=2&a=1#hash');
	assert.equal(queryString.exclude('https://example.com/?c=3&b=2&a=1', (key, value) => value === '2', {sort: false}), 'https://example.com/?c=3&a=1');
	assert.equal(queryString.exclude('https://example.com/?c=3&b=2&a=1', ['b'], {sort: (left, right) => right.localeCompare(left)}), 'https://example.com/?c=3&a=1');
	assert.equal(queryString.exclude('https://example.com/?c[]=3&a[]=1&c[]=4', ['b'], {arrayFormat: 'bracket', sort: false}), 'https://example.com/?c[]=3&c[]=4&a[]=1');
});

test('parse options that change a value only apply to the value the filter receives', () => {
	// `parseNumbers`, `parseBooleans`, and `types` type the `value` the predicate gets. The URL is written back from the plain values, so a value like `007` or `1.00` is kept as-is instead of being rewritten.
	assert.equal(queryString.exclude('https://foo.bar?id=007&price=1.00&name=bond', ['name'], {parseNumbers: true}), 'https://foo.bar?id=007&price=1.00');
	assert.equal(queryString.exclude('https://foo.bar?id=007&name=bond', (key, value) => value === 'bond', {parseNumbers: true}), 'https://foo.bar?id=007');
	assert.equal(queryString.exclude('https://foo.bar?flag=TRUE&other=x', (key, value) => value === 'x', {parseBooleans: true}), 'https://foo.bar?flag=TRUE');
	assert.equal(queryString.exclude('https://foo.bar?f=1&age=020&other=x', (key, value) => value === 'x', {types: {f: 'boolean', age: 'number'}}), 'https://foo.bar?age=020&f=1');
	assert.equal(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=x', (key, value) => value === 'x', {types: {foo: 'string'}}), 'https://foo.bar?foo=1&foo=2');
});

test('the query is decoded exactly when it is encoded again, and the `decode` option is ignored', () => {
	assert.equal(queryString.exclude('https://foo.bar?foo=a%20b&bar=1', ['bar'], {decode: false}), 'https://foo.bar?foo=a%20b');
	assert.equal(queryString.exclude('https://foo.bar?foo=a%26b&bar=1', (key, value) => value === '1', {decode: false}), 'https://foo.bar?foo=a%26b');
	assert.equal(queryString.exclude('https://foo.bar?a=%20&b=1', (name, value) => value === '1', {encode: false, decode: true}), 'https://foo.bar?a=%20');
	// The filter receives the value decoded like the key. Decoding only one of them made a percent-encoded key, or a `+` in a key, look up a value that did not exist, so the filter received `undefined` and kept the parameter.
	assert.equal(queryString.exclude('https://foo.bar?a%20b=x%20y&c=1', (key, value) => value === 'x y', {decode: false}), 'https://foo.bar?c=1');
	assert.equal(queryString.exclude('https://foo.bar?first+name=John&c=1', (key, value) => value === 'John', {decode: false}), 'https://foo.bar?c=1');
	assert.equal(queryString.exclude('https://foo.bar?a%20b=%20&c=1', (key, value) => value === '%20', {encode: false, decode: true}), 'https://foo.bar?c=1');
	assert.equal(queryString.exclude('https://foo.bar?foo%5B%5D=1&foo%5B%5D=2&c=1', (key, value) => Array.isArray(value), {decode: false, arrayFormat: 'bracket'}), 'https://foo.bar?c=1');
	assert.equal(queryString.exclude('https://foo.bar?a%20b=7&c=1', (key, value) => value === 7, {decode: false, types: {'a b': 'number'}}), 'https://foo.bar?c=1');
	assert.equal(queryString.exclude('https://foo.bar?foo=a%26b&bar=1', (key, value) => value === 'a&b', {decode: false}), 'https://foo.bar?bar=1');
});
