/* eslint-disable node-test/no-conditional-assertion -- Many tests here are table-driven, so the assertions sit inside a loop over the cases. The loop always runs, and every case is checked. */
import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('picks elements in a URL with a filter array', () => {
	assert.equal(queryString.pick('https://example.com/?a=1&b=2&c=3#a', ['a', 'b']), 'https://example.com/?a=1&b=2#a');
});

test('picks elements in a URL with a filter predicate', () => {
	assert.equal(queryString.pick('https://example.com/?a=1&b=2&c=3#a', (name, value) => {
		assert.equal(typeof name, 'string');
		assert.equal(typeof value, 'number');

		return name === 'a';
	}, {
		parseNumbers: true,
	}), 'https://example.com/?a=1#a');
});

test('picks elements in a URL without encoding fragment identifiers', () => {
	assert.equal(queryString.pick('https://example.com?a=b#/home', []), 'https://example.com#/home');
});

test('picks elements in a relative URL with a fragment identifier', () => {
	assert.equal(queryString.pick('/users?page=1&sort=name#section', ['page']), '/users?page=1#section');
});

test('picks elements in a URL with a fragment identifier that the WHATWG parser rejects', () => {
	assert.equal(queryString.pick('http://foo.com:99999/p?a=1&b=2#frag', ['a']), 'http://foo.com:99999/p?a=1#frag');
	assert.equal(queryString.pick('http://[bad/?a=1&b=2#frag', ['a']), 'http://[bad/?a=1#frag');
});

test('picks elements in a URL with a fragment identifier that starts with `#`', () => {
	assert.equal(queryString.pick('https://foo.bar/?a=1&b=2#%23top', ['a']), 'https://foo.bar/?a=1#%23top');
});

test('sorts the query parameters by default and keeps their order with sort false', () => {
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1', ['c', 'a']), 'https://example.com/?a=1&c=3');
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: false}), 'https://example.com/?c=3&a=1');
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1#hash', ['c', 'b', 'a'], {sort: false}), 'https://example.com/?c=3&b=2&a=1#hash');
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1', (key, value) => value !== '2', {sort: false}), 'https://example.com/?c=3&a=1');
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: (left, right) => right.localeCompare(left)}), 'https://example.com/?c=3&a=1');
	assert.equal(queryString.pick('https://example.com/?c[]=3&a[]=1&c[]=4', ['c', 'a'], {arrayFormat: 'bracket', sort: false}), 'https://example.com/?c[]=3&c[]=4&a[]=1');
});

test('picks elements in a URL when sort is true', () => {
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: true}), 'https://example.com/?a=1&c=3');
});

test('picks elements in a URL with index array format', () => {
	assert.equal(queryString.pick('https://foo.bar?foo[1]=b&foo[0]=a&bar=x', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=a&foo[1]=b');
});

test('picks elements in a URL with a percent-encoded fragment identifier', () => {
	assert.equal(queryString.pick('https://foo.bar?foo=1&bar=2#hello%20world', ['foo']), 'https://foo.bar?foo=1#hello%20world');
});

test('picks elements in a URL and keeps the fragment identifier as-is', () => {
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#a%2Fb/c:d', ['a']), 'https://foo.bar?a=1#a%2Fb/c:d');
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#', ['a']), 'https://foo.bar?a=1#');
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#hello%20world', ['a'], {decode: false}), 'https://foo.bar?a=1#hello%20world');
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2', ['a']), 'https://foo.bar?a=1');
});

test('picks elements in a URL with a fragment identifier that contains a question mark', () => {
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#section?x=1', ['a']), 'https://foo.bar?a=1#section?x=1');
	assert.equal(queryString.pick('https://foo.bar#section?x=1', ['x']), 'https://foo.bar#section?x=1');
});

test('picks elements in a URL with a separator that `encodeURIComponent` leaves as-is', () => {
	// The percent-encoded separator inside an item survives the decode and re-encode.
	assert.equal(queryString.pick('https://foo.bar?foo=a%2Db-c&bar=1', ['foo'], {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'https://foo.bar?foo=a%2Db-c');
	assert.equal(queryString.pick('https://foo.bar?foo[]=a%2Eb.c&bar=1', ['foo'], {arrayFormat: 'bracket-separator', arrayFormatSeparator: '.'}), 'https://foo.bar?foo[]=a%2Eb.c');
	assert.equal(queryString.exclude('https://foo.bar?foo=a%2Db-c&bar=1', ['bar'], {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'https://foo.bar?foo=a%2Db-c');
});

test('picks elements in a URL with `encode: false` and keeps the values as-is', () => {
	assert.equal(queryString.pick('https://foo.bar?a=%20&b=1+2&c=3', ['a', 'b'], {encode: false}), 'https://foo.bar?a=%20&b=1+2');
});

test('picks elements in a URL with `encode: false` and an explicit `decode: true`', () => {
	// With `encode: false`, the query is not decoded, so the filter receives the raw value. The `decode` option is ignored.
	assert.equal(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === '%20', {encode: false, decode: true}), 'https://foo.bar?a=%20');
	assert.equal(queryString.pick('https://foo.bar?a=%20&b=1', ['a'], {encode: false, decode: true}), 'https://foo.bar?a=%20');
});

test('an `encode` that is not a boolean turns encoding off, like `stringify()` reads it', () => {
	// The query is decoded exactly when it is encoded again, so decoding it and then writing it back unencoded puts a decoded `&` or `#` into the URL. Every other consumer of `encode` reads it for its truthiness, where `null` is off, so `null` has to be off here too.
	for (const encode of [null, 0, '', NaN]) {
		assert.equal(queryString.pick('https://foo.bar?a=x%26y&b=1', ['a'], {encode}), 'https://foo.bar?a=x%26y', `encode: ${String(encode)}`);
		assert.equal(queryString.pick('https://foo.bar?a=x%23y&b=1', ['a'], {encode}), 'https://foo.bar?a=x%23y', `encode: ${String(encode)}`);
		assert.equal(queryString.exclude('https://foo.bar?a=x%26y&b=1', ['b'], {encode}), 'https://foo.bar?a=x%26y', `encode: ${String(encode)}`);
	}

	// A truthy value still encodes, and leaving the option out still encodes.
	for (const encode of [true, 1, 'yes']) {
		assert.equal(queryString.pick('https://foo.bar?a=x%26y&b=1', ['a'], {encode}), 'https://foo.bar?a=x%26y', `encode: ${String(encode)}`);
	}

	assert.equal(queryString.pick('https://foo.bar?a=x%26y&b=1', ['a']), 'https://foo.bar?a=x%26y');
	assert.equal(queryString.pick('https://foo.bar?a=x%26y&b=1', ['a'], {encode: undefined}), 'https://foo.bar?a=x%26y');
});

test('picks elements in a URL with `encode: false` and a filter predicate that sees the raw values', () => {
	assert.equal(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === '%20', {encode: false}), 'https://foo.bar?a=%20');
});

test('drops a query parameter named `__proto__`', () => {
	assert.equal(queryString.pick('https://foo.bar?__proto__=1&a=2', ['__proto__']), 'https://foo.bar');
	assert.equal(queryString.pick('https://foo.bar?__proto__=1&a=2', (name, value) => value === '1'), 'https://foo.bar');
});

test('picks elements in a URL with index array format when a scalar precedes the indexed entries', () => {
	assert.equal(queryString.pick('https://foo.bar?foo=1&foo[0]=2&bar=x', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
});

test('keeps the order of the URL with sort false, not the order of the keys array', () => {
	// The keys array is a filter, not an order. With `sort: false` the query parameters keep the parsed object's key order, like the docs say.
	assert.equal(queryString.pick('https://example.com/?b=1&a=2&c=3', ['a', 'c', 'b'], {sort: false}), 'https://example.com/?b=1&a=2&c=3');
	assert.equal(queryString.pick('https://example.com/?b=1&a=2&c=3', ['c', 'a'], {sort: false}), 'https://example.com/?a=2&c=3');
	assert.equal(queryString.pick('https://example.com/?b=1&a=2&c=3', ['c', 'b'], {sort: false}), 'https://example.com/?b=1&c=3');
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1', ['a', 'b', 'c'], {sort: false}), 'https://example.com/?c=3&b=2&a=1');
	assert.equal(queryString.pick('https://example.com/?c=3&b=2&a=1#hash', ['a', 'c'], {sort: false}), 'https://example.com/?c=3&a=1#hash');
	assert.equal(queryString.pick('/path?z=1&y=2&x=3', ['x', 'y', 'z'], {sort: false}), '/path?z=1&y=2&x=3');
	assert.equal(queryString.pick('?b=1&a=2', ['a', 'b'], {sort: false}), '?b=1&a=2');

	// Keys that are not in the URL, and repeated keys, do not change the order.
	assert.equal(queryString.pick('https://example.com/?b=1&a=2', ['x', 'a', 'y', 'b'], {sort: false}), 'https://example.com/?b=1&a=2');
	assert.equal(queryString.pick('https://example.com/?b=1&a=2', ['a', 'b', 'a'], {sort: false}), 'https://example.com/?b=1&a=2');

	// Array values and the other options keep the order too.
	assert.equal(queryString.pick('https://example.com/?b=1&a=2&b=3', ['a', 'b'], {sort: false}), 'https://example.com/?b=1&b=3&a=2');
	assert.equal(queryString.pick('https://example.com/?b[]=1&a[]=2', ['a', 'b'], {arrayFormat: 'bracket', sort: false}), 'https://example.com/?b[]=1&a[]=2');
	assert.equal(queryString.pick('https://example.com/?b[0]=1&a[0]=2', ['a', 'b'], {arrayFormat: 'index', sort: false}), 'https://example.com/?b[0]=1&a[0]=2');
	assert.equal(queryString.pick('https://example.com/?b=1,2&a=3', ['a', 'b'], {arrayFormat: 'comma', sort: false}), 'https://example.com/?b=1,2&a=3');
	assert.equal(queryString.pick('https://example.com/?b=1&a=2', ['a', 'b'], {sort: false, parseNumbers: true}), 'https://example.com/?b=1&a=2');
	assert.equal(queryString.pick('https://example.com/?b=a%20b&a=2', ['a', 'b'], {sort: false, encode: false}), 'https://example.com/?b=a%20b&a=2');
	assert.equal(queryString.pick('https://example.com/?b&a=2', ['a', 'b'], {sort: false}), 'https://example.com/?b&a=2');

	// Integer-index keys are enumerated first in numeric order, even when sorting is disabled.
	assert.equal(queryString.pick('https://foo.bar?x=c&2=b&1=a', ['x', '2', '1'], {sort: false}), 'https://foo.bar?1=a&2=b&x=c');
	assert.equal(queryString.exclude('https://foo.bar?x=c&2=b&1=a', [], {sort: false}), 'https://foo.bar?1=a&2=b&x=c');

	// The default and a custom sort still apply.
	assert.equal(queryString.pick('https://example.com/?b=1&a=2&c=3', ['c', 'b', 'a']), 'https://example.com/?a=2&b=1&c=3');
	assert.equal(queryString.pick('https://example.com/?b=1&a=2&c=3', ['a', 'b', 'c'], {sort: (left, right) => right.localeCompare(left)}), 'https://example.com/?c=3&b=1&a=2');
});

test('keeps the fragment identifier when the URL has no query string', () => {
	assert.equal(queryString.pick('https://foo.bar#hello', ['foo']), 'https://foo.bar#hello');
	assert.equal(queryString.pick('https://foo.bar#/path?not=a-query', ['not']), 'https://foo.bar#/path?not=a-query');
	assert.equal(queryString.exclude('https://foo.bar#/path?not=a-query', ['not']), 'https://foo.bar#/path?not=a-query');
	assert.equal(queryString.pick('https://foo.bar?foo=1#hello', []), 'https://foo.bar#hello');
});

test('an option that is explicitly `undefined` uses its default', () => {
	// The input is decoded and the output is encoded, so a value with a reserved character is written back unchanged instead of corrupting the URL.
	assert.equal(queryString.pick('https://foo.bar?foo=%26&bar=2', ['foo'], {encode: undefined}), 'https://foo.bar?foo=%26');
	assert.equal(queryString.pick('https://foo.bar?foo=%26&bar=2', ['foo'], {decode: undefined}), 'https://foo.bar?foo=%26');
	assert.equal(queryString.exclude('https://foo.bar?foo=%26&bar=2', ['bar'], {encode: undefined}), 'https://foo.bar?foo=%26');
	assert.equal(queryString.pick('https://foo.bar?b=1&a=2', ['a', 'b'], {sort: undefined}), 'https://foo.bar?a=2&b=1');
	assert.equal(queryString.pick('https://foo.bar?foo=1,2', ['foo'], {arrayFormat: 'comma', arrayFormatSeparator: undefined}), 'https://foo.bar?foo=1,2');
});

test('parse options that change a value only apply to the value the filter receives', () => {
	// `parseNumbers`, `parseBooleans`, and `types` type the `value` the predicate gets. The URL is written back from the plain values, so a value like `007` or `1.00` is kept as-is instead of being rewritten.
	assert.equal(queryString.pick('https://foo.bar?id=007&price=1.00&n=1e2', ['id', 'price', 'n'], {parseNumbers: true}), 'https://foo.bar?id=007&n=1e2&price=1.00');
	assert.equal(queryString.pick('https://foo.bar?id=007&name=bond', (key, value) => value === 7, {parseNumbers: true}), 'https://foo.bar?id=007');
	assert.equal(queryString.pick('https://foo.bar?flag=TRUE&other=x', (key, value) => value === true, {parseBooleans: true}), 'https://foo.bar?flag=TRUE');
	assert.equal(queryString.pick('https://foo.bar?f=1&age=020', (key, value) => value === true || value === 20, {types: {f: 'boolean', age: 'number'}}), 'https://foo.bar?age=020&f=1');
	assert.equal(queryString.pick('https://foo.bar?foo=1&foo=2', (key, value) => value === '1,2', {types: {foo: 'string'}}), 'https://foo.bar?foo=1&foo=2');
	assert.equal(queryString.pick('https://foo.bar?ids=007,1&n=007', (key, value) => Array.isArray(value), {arrayFormat: 'comma', types: {ids: 'number[]'}, parseNumbers: true}), 'https://foo.bar?ids=007,1');
	assert.equal(queryString.pick('https://foo.bar?flag&other=x', (key, value) => value === true, {types: {flag: 'boolean'}}), 'https://foo.bar?flag');
	// With `encode: false`, the input is not decoded, and the typed value is still only for the filter.
	assert.equal(queryString.pick('https://foo.bar?a=%26&b=007', (key, value) => value === 7, {encode: false, parseNumbers: true}), 'https://foo.bar?b=007');
	// A custom type can return a value that `stringify()` cannot write, since it is only passed to the filter.
	assert.equal(queryString.pick('https://foo.bar?date=2024-01-02&other=x', (key, value) => value instanceof Date, {types: {date: value => new Date(value)}}), 'https://foo.bar?date=2024-01-02');
});

test('the query is decoded exactly when it is encoded again, and the `decode` option is ignored', () => {
	// The URL is written back from the values decoded when `encode` is `true`, or kept as-is when it is `false`, so `decode: false` does not percent-encode the query a second time.
	assert.equal(queryString.pick('https://foo.bar?foo=a%20b&bar=1', ['foo'], {decode: false}), 'https://foo.bar?foo=a%20b');
	assert.equal(queryString.pick('https://foo.bar?foo=a%20b&bar=1', (key, value) => value === 'a%20b', {decode: false, encode: false}), 'https://foo.bar?foo=a%20b');
	// The filter receives the value decoded like the key. Decoding only one of them made a percent-encoded key, or a `+` in a key, look up a value that did not exist, so the filter received `undefined` and dropped the parameter.
	assert.equal(queryString.pick('https://foo.bar?a%20b=x%20y&c=1', (key, value) => value === 'x y', {decode: false}), 'https://foo.bar?a%20b=x%20y');
	assert.equal(queryString.pick('https://foo.bar?first+name=John&c=1', (key, value) => value === 'John', {decode: false}), 'https://foo.bar?first%20name=John');
	assert.equal(queryString.pick('https://foo.bar?a%20b=%20&c=1', (key, value) => value === '%20', {encode: false, decode: true}), 'https://foo.bar?a%20b=%20');
	assert.equal(queryString.pick('https://foo.bar?foo%5B%5D=1&foo%5B%5D=2&c=1', (key, value) => Array.isArray(value), {decode: false, arrayFormat: 'bracket'}), 'https://foo.bar?foo[]=1&foo[]=2');
	assert.equal(queryString.pick('https://foo.bar?a%20b=7&c=1', (key, value) => value === 7, {decode: false, types: {'a b': 'number'}}), 'https://foo.bar?a%20b=7');
	// The filter always receives the key and the value from the same decoding.
	const seen = [];
	queryString.pick('https://foo.bar?a%20b=x%20y&c+d=1', (key, value) => {
		seen.push([key, value]);
		return true;
	}, {decode: false});
	assert.deepEqual(structuredClone(seen), [['a b', 'x y'], ['c d', '1']]);
	const seenRaw = [];
	queryString.pick('https://foo.bar?a%20b=x%20y&c+d=1', (key, value) => {
		seenRaw.push([key, value]);
		return true;
	}, {encode: false, decode: true});
	assert.deepEqual(structuredClone(seenRaw), [['a%20b', 'x%20y'], ['c+d', '1']]);
	// The values are decoded before `parseNumbers` and the array format split them, like with `parse()`.
	assert.equal(queryString.pick('https://foo.bar?foo=a%26b&bar=1', (key, value) => value === 'a&b', {decode: false}), 'https://foo.bar?foo=a%26b');
	assert.equal(queryString.pick('https://foo.bar?foo=1%2B2&bar=1', (key, value) => value === '1+2', {decode: false, parseNumbers: true}), 'https://foo.bar?foo=1%2B2');
	assert.equal(queryString.pick('https://foo.bar?foo=a%2Cb,c&bar=1', (key, value) => Array.isArray(value) && value[0] === 'a,b', {decode: false, arrayFormat: 'comma'}), 'https://foo.bar?foo=a%2Cb,c');
	assert.equal(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === '%20', {encode: false, decode: true}), 'https://foo.bar?a=%20');
	assert.equal(queryString.pick('https://foo.bar?a=%20&b=1#x%20y', (name, value) => value === '%20', {encode: false, decode: true}), 'https://foo.bar?a=%20#x%20y');
});

test('ignores leading and trailing whitespace, like `parseUrl()` does', () => {
	// The URL and the query were already trimmed by `parseUrl()`, but the fragment identifier was taken from the untrimmed input, so a newline from pasted input ended up after it in the output.
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#hello\n', ['a']), 'https://foo.bar?a=1#hello');
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#hello ', ['a']), 'https://foo.bar?a=1#hello');
	assert.equal(queryString.pick(' https://foo.bar?a=1&b=2#hello ', ['a']), 'https://foo.bar?a=1#hello');
	assert.equal(queryString.pick('\thttps://foo.bar?a=1&b=2\t', ['a']), 'https://foo.bar?a=1');
	assert.equal(queryString.pick('https://foo.bar#hello\n', ['a']), 'https://foo.bar#hello');
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#hello\n', (key, value) => value === '1'), 'https://foo.bar?a=1#hello');
	assert.equal(queryString.exclude('https://foo.bar?a=1&b=2#hello\n', ['a']), 'https://foo.bar?b=2#hello');
	assert.equal(queryString.exclude(' https://foo.bar?a=1&b=2#hello ', (key, value) => value === '1'), 'https://foo.bar?b=2#hello');
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#hello\n', ['a'], {encode: false}), 'https://foo.bar?a=1#hello');
	// Whitespace inside the fragment identifier is kept.
	assert.equal(queryString.pick('https://foo.bar?a=1&b=2#hello world\n', ['a']), 'https://foo.bar?a=1#hello world');
	assert.equal(queryString.pick(' ', ['a']), '');
});

test('applies the stringify options to the output, so `skipNull` and `skipEmptyString` also drop a kept parameter', () => {
	// A valueless key parses to `null` and an empty value to `''`. The options are shared with `stringify()`, so they look at the plain values that are written back, and they drop a parameter that the keys array or the filter kept.
	assert.equal(queryString.pick('https://foo.bar?a&b=1', ['a', 'b']), 'https://foo.bar?a&b=1');
	assert.equal(queryString.pick('https://foo.bar?a&b=1', ['a', 'b'], {skipNull: true}), 'https://foo.bar?b=1');
	assert.equal(queryString.pick('https://foo.bar?a=&b=1', ['a', 'b'], {skipEmptyString: true}), 'https://foo.bar?b=1');
	assert.equal(queryString.pick('https://foo.bar?a&b=1', ['a'], {skipNull: true}), 'https://foo.bar');
	assert.equal(queryString.exclude('https://foo.bar?a&b=1', ['b'], {skipNull: true}), 'https://foo.bar');
});

test('pick and exclude are idempotent', () => {
	// The query is decoded exactly when it is encoded again, so filtering a URL that was already filtered has to be a no-op. A value that is percent-encoded a second time, or decoded without being encoded again, changes on every pass, which is how the `encode` and `decode` bugs showed up. With `encode: false` the input is kept as-is, so it is a no-op too.
	const optionSets = [
		{},
		{sort: false},
		{arrayFormat: 'bracket'},
		{arrayFormat: 'index'},
		{arrayFormat: 'comma'},
		{arrayFormat: 'separator', arrayFormatSeparator: '-'},
		{arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'},
		{arrayFormat: 'colon-list-separator'},
		{encode: false},
		{decode: false},
		{encode: false, decode: true},
		{parseNumbers: true, parseBooleans: true},
		{strict: false},
		{types: {a: 'string'}},
		{skipNull: true},
		{skipEmptyString: true},
	];
	const queries = [
		'a=1&b=2',
		'a=%20&b=1+2',
		'a=%26&b=%3D',
		'a=1,2&b=3',
		'a=a%2Cb,c&b=3',
		'a[]=1&a[]=2&b=3',
		'a[0]=1&a[1]=2&b=3',
		'a:list=1&a:list=2&b=3',
		'a&b',
		'a=&b=1',
		'a=100%25&b=%2C',
		'a=1&a=2&a=3&b=4',
		'x=c&2=b&1=a',
		'a=%2Da-b&b=3',
	];

	for (const options of optionSets) {
		for (const query of queries) {
			const label = `${JSON.stringify(options)} with ${JSON.stringify(query)}`;
			const url = `https://foo.bar/?${query}#frag%20x`;
			const picked = queryString.pick(url, ['a', 'b'], options);
			assert.equal(queryString.pick(picked, ['a', 'b'], options), picked, `pick: ${label}`);
			const excluded = queryString.exclude(url, ['b'], options);
			assert.equal(queryString.exclude(excluded, ['b'], options), excluded, `exclude: ${label}`);
		}
	}
});
