/* eslint-disable node-test/no-conditional-assertion -- Many tests here are table-driven, so the assertions sit inside a loop over the cases. The loop always runs, and every case is checked. */
import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('stringify URL without a query string', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/'}), 'https://foo.bar/');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}}), 'https://foo.bar/');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {}}), 'https://foo.bar/#top');
	assert.equal(queryString.stringifyUrl({url: '', query: {}}), '');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?', query: {}}), 'https://foo.bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=bar', query: {}}), 'https://foo.bar?foo=bar');
});

test('stringify URL with a query string', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {foo: 'bar'}}), 'https://foo.bar/?foo=bar#top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', a: 'b'}}), 'https://foo.bar?a=b&foo=bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=b', query: {foo: ['bar', 'baz']}}), 'https://foo.bar?a=b&foo=bar&foo=baz');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=baz', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
});

test('stringify URL with fragment identifier', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {top: 'foo'}, fragmentIdentifier: 'bar'}), 'https://foo.bar?top=foo#bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: ['bar', 'baz']}, fragmentIdentifier: 'top'}), 'https://foo.bar?foo=bar&foo=baz#top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'top'}), 'https://foo.bar/#top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#abc', query: {}, fragmentIdentifier: 'top'}), 'https://foo.bar/#top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {}}), 'https://foo.bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {}, fragmentIdentifier: 'foo bar'}), 'https://foo.bar#foo%20bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '/foo/bar'}), 'https://foo.bar/#/foo/bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#foo', query: {}, fragmentIdentifier: ''}), 'https://foo.bar/');
});

test('stringify relative URL with fragment identifier', () => {
	assert.equal(queryString.stringifyUrl({url: '/users', query: {page: 1}, fragmentIdentifier: 'section'}), '/users?page=1#section');
});

test('stringify relative URL from the result of `parseUrl` with fragment identifier', () => {
	const url = '/users?page=1#section';
	const parsedUrl = queryString.parseUrl(url, {parseFragmentIdentifier: true});

	assert.deepEqual(structuredClone(queryString.stringifyUrl(parsedUrl)), url);
});

test('skipEmptyString:: stringify URL with a query string', () => {
	const config = {skipEmptyString: true};

	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', baz: ''}}, config), 'https://foo.bar?foo=bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', baz: ['', 'qux']}}, config), 'https://foo.bar?baz=qux&foo=bar');
});

test('stringify URL from the result of `parseUrl` without query string', () => {
	const url = 'https://foo.bar';
	const parsedUrl = queryString.parseUrl(url);
	assert.deepEqual(structuredClone(queryString.stringifyUrl(parsedUrl)), url);
});

test('stringify URL from the result of `parseUrl` with query string', () => {
	const url = 'https://foo.bar?foo=bar&foo=baz';
	const parsedUrl = queryString.parseUrl(url);
	assert.deepEqual(structuredClone(queryString.stringifyUrl(parsedUrl)), url);
});

test('stringify URL from the result of `parseUrl` with query string that contains `=`', () => {
	const url = 'https://foo.bar?foo=bar=&foo=baz=';
	const parsedUrl = queryString.parseUrl(url);
	assert.deepEqual(structuredClone(queryString.stringifyUrl(parsedUrl, {encode: false})), url);
});

test('stringify URL without sorting existing query params', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?C=3&A=1', query: {D: 4, B: 2}}, {sort: false}), 'https://foo.bar?C=3&A=1&D=4&B=2');
});

test('stringifyUrl uses parsing options when parsing existing query from url', () => {
	const currentUrl = 'https://localhost:3000/?array[]=item1';

	const result = queryString.stringifyUrl(
		{
			url: currentUrl,
			query: {
				array: [
					'item1',
					'item2',
				],
			},
		},
		{
			arrayFormat: 'bracket',
			skipEmptyString: true,
			skipNull: true,
		},
	);

	assert.equal(result, 'https://localhost:3000/?array[]=item1&array[]=item2');
});

test('stringify URL with a fragment identifier that starts with `#`', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '#top'}), 'https://foo.bar/##top');
});

test('stringify URL from the result of `parseUrl` with a `#` in the fragment identifier', () => {
	for (const url of ['https://foo.bar/?a=1#%23top', 'https://foo.bar/?a=1##top']) {
		const parsedUrl = queryString.parseUrl(url, {parseFragmentIdentifier: true});

		assert.equal(parsedUrl.fragmentIdentifier, '#top');
		assert.equal(queryString.stringifyUrl(parsedUrl), 'https://foo.bar/?a=1##top');
		assert.equal(queryString.parseUrl(queryString.stringifyUrl(parsedUrl), {parseFragmentIdentifier: true}).fragmentIdentifier, '#top');
	}
});

test('stringify URL percent-encodes `%` in the fragment identifier', () => {
	// The fragment identifier is a decoded value, like the query values, so `%` is encoded and `parseUrl()` reads it back unchanged. A bare `%` would make `decodeURIComponent(location.hash)` throw in the browser.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '%23top'}), 'https://foo.bar/#%2523top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a%b'}), 'https://foo.bar/#a%25b');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '100%'}), 'https://foo.bar/#100%25');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '%'}), 'https://foo.bar/#%25');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '50%25'}), 'https://foo.bar/#50%2525');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a%20b'}), 'https://foo.bar/#a%2520b');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {a: '100%'}, fragmentIdentifier: '100%'}), 'https://foo.bar/?a=100%25#100%25');

	// Like the `URL` hash setter, `/`, `?`, and `#` stay as-is, so hash routes keep working.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a?b'}), 'https://foo.bar/#a?b');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '/users?id=1&x=%'}), 'https://foo.bar/#/users?id=1&x=%25');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a b"<>`'}), 'https://foo.bar/#a%20b%22%3C%3E%60');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'ståle'}), 'https://foo.bar/#st%C3%A5le');

	// `strict` only applies to the query. The fragment keeps `!'()*`, like the `URL` hash setter.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {a: '!\'()*'}, fragmentIdentifier: '!\'()*'}), 'https://foo.bar/?a=%21%27%28%29%2A#!\'()*');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '100%!\'()*'}, {strict: false}), 'https://foo.bar/#100%25!\'()*');

	// A fragment identifier already in the URL is kept as-is. Only the `fragmentIdentifier` property is a decoded value.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#a%20b%25', query: {x: 1}}), 'https://foo.bar/?x=1#a%20b%25');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/?x=1#old%20frag', query: {}, fragmentIdentifier: 'new%'}), 'https://foo.bar/?x=1#new%25');
});

test('stringify URL percent-encodes tab, newline, and carriage return in the fragment identifier', () => {
	// The `URL` parser silently strips ASCII tab and newline from its input, so they are encoded before the hash setter sees them, like `%`. The fragment identifier is a decoded value, so `parseUrl()` reads it back unchanged.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a\tb'}), 'https://foo.bar/#a%09b');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a\nb'}), 'https://foo.bar/#a%0Ab');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a\rb'}), 'https://foo.bar/#a%0Db');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a\r\nb'}), 'https://foo.bar/#a%0D%0Ab');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '\t'}), 'https://foo.bar/#%09');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '\n'}), 'https://foo.bar/#%0A');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '\t\n\r'}), 'https://foo.bar/#%09%0A%0D');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'line one\nline two'}), 'https://foo.bar/#line%20one%0Aline%20two');

	// `%` is still encoded alongside the control characters.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '100%\n'}), 'https://foo.bar/#100%25%0A');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '%09'}), 'https://foo.bar/#%2509');

	// The other C0 controls were already encoded by the hash setter and stay that way.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a\u{0}b\u{1F}c\u{7F}d'}), 'https://foo.bar/#a%00b%1Fc%7Fd');

	// The query already encodes these characters, so both parts agree.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {a: 'x\ty'}, fragmentIdentifier: 'x\ty'}), 'https://foo.bar/?a=x%09y#x%09y');

	// A fragment identifier already in the URL is kept as-is.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#a%09b', query: {x: 1}}), 'https://foo.bar/?x=1#a%09b');

	// With `encode: false`, the fragment identifier is written as-is.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a\tb'}, {encode: false}), 'https://foo.bar/#a\tb');

	for (const fragmentIdentifier of ['a\tb', 'a\nb', 'a\rb', '\t\n\r', 'x\r\ny%', ' \t ']) {
		const url = queryString.stringifyUrl({url: 'https://foo.bar/', query: {a: 1}, fragmentIdentifier});
		assert.equal(queryString.parseUrl(url, {parseFragmentIdentifier: true}).fragmentIdentifier, fragmentIdentifier, encodeURIComponent(fragmentIdentifier));
		assert.equal(queryString.stringifyUrl(queryString.parseUrl(url, {parseFragmentIdentifier: true})), url, `${encodeURIComponent(fragmentIdentifier)} stable`);
	}
});

test('stringify URL fragment identifier round-trips through `parseUrl`', () => {
	for (const fragmentIdentifier of ['100%', '%', '%zz', '%23top', '50%25', 'a%20b', 'a%2Fb', 'a b', '/foo/bar?x=1', '#top', 'ståle', 'a"b<c>`d', '=&+']) {
		const url = queryString.stringifyUrl({url: 'https://foo.bar/', query: {a: 1}, fragmentIdentifier});
		assert.equal(queryString.parseUrl(url, {parseFragmentIdentifier: true}).fragmentIdentifier, fragmentIdentifier, fragmentIdentifier);
		assert.equal(queryString.stringifyUrl(queryString.parseUrl(url, {parseFragmentIdentifier: true})), url, `${fragmentIdentifier} stable`);
	}
});

test('stringify URL with `encode: false` writes the fragment identifier as-is', () => {
	// Like the query, the fragment identifier is treated as already encoded then.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '%23top'}, {encode: false}), 'https://foo.bar/#%23top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a%20b'}, {encode: false}), 'https://foo.bar/#a%20b');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a b'}, {encode: false}), 'https://foo.bar/#a b');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '100%'}, {encode: false}), 'https://foo.bar/#100%');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '#top'}, {encode: false}), 'https://foo.bar/##top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#old', query: {}, fragmentIdentifier: ''}, {encode: false}), 'https://foo.bar/');

	// A URL parsed without decoding round-trips byte-for-byte.
	for (const url of ['https://foo.bar/?a=%20#a%20b%25', 'https://foo.bar/#%23top', 'https://foo.bar/?x=1#/route?y=2']) {
		assert.equal(queryString.stringifyUrl(queryString.parseUrl(url, {decode: false, parseFragmentIdentifier: true}), {encode: false}), url);
	}
});

test('stringify URL with a fragment identifier does not parse the URL', () => {
	assert.equal(queryString.stringifyUrl({url: 'http://foo.com:99999/p', query: {a: 1}, fragmentIdentifier: 'frag'}), 'http://foo.com:99999/p?a=1#frag');
	assert.equal(queryString.stringifyUrl({url: 'http://x.com%23/p', query: {a: 1}, fragmentIdentifier: 'frag'}), 'http://x.com%23/p?a=1#frag');
	assert.equal(queryString.stringifyUrl({url: 'http://[bad/', query: {a: 1}, fragmentIdentifier: '#frag'}), 'http://[bad/?a=1##frag');
});

test('stringify URL with sorting when sort is true', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?C=3&A=1', query: {D: 4, B: 2}}, {sort: true}), 'https://foo.bar?A=1&B=2&C=3&D=4');
});

test('stringify URL with index array format in the existing query', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo[0]=a&foo[1]=b', query: {bar: 'baz'}}, {arrayFormat: 'index'}), 'https://foo.bar?bar=baz&foo[0]=a&foo[1]=b');
});

test('stringify URL with `encode: false` keeps the existing query string as-is', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=%20&b=%2B&c=1+2', query: {d: 'x'}}, {encode: false}), 'https://foo.bar?a=%20&b=%2B&c=1+2&d=x');
});

test('stringify URL with `encode: false` lets the query override the existing query', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=%20&b=%2B', query: {a: 'x y'}}, {encode: false}), 'https://foo.bar?a=x y&b=%2B');
});

test('stringify URL with `encode: false` overrides equivalent encoded query keys', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?%61=1', query: {a: 2}}, {encode: false}), 'https://foo.bar?a=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a%20b=1', query: {'a b': 2}}, {encode: false}), 'https://foo.bar?a b=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?%61=1', query: {a: undefined}}, {encode: false}), 'https://foo.bar');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=1&%61=2&b=%26', query: {'%61': 3}}, {encode: false}), 'https://foo.bar?%61=3&b=%26');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a+b=1', query: {'a%20b': 2}}, {encode: false}), 'https://foo.bar?a%20b=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a%2Bb=1&a+b=2', query: {'a%20b': 3}}, {encode: false}), 'https://foo.bar?a%20b=3&a%2Bb=1');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?b=1&a=2', query: {b: 3}}, {encode: false, sort: false}), 'https://foo.bar?b=3&a=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?%61=1&b=2', query: {a: 3}}, {encode: false, sort: false}), 'https://foo.bar?a=3&b=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?%61=1&a=2&b=3', query: {a: 4}}, {encode: false, sort: false}), 'https://foo.bar?a=4&b=3');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=1&%61=2&b=3', query: {'%61': 4}}, {encode: false, sort: false}), 'https://foo.bar?%61=4&b=3');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a[]=1&b=%26', query: {a: [2]}}, {encode: false, arrayFormat: 'bracket'}), 'https://foo.bar?a[]=2&b=%26');
});

test('stringify URL with `encode: false` and array formats in the existing query', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a[]=%20&a[]=2', query: {b: 'x'}}, {encode: false, arrayFormat: 'bracket'}), 'https://foo.bar?a[]=%20&a[]=2&b=x');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=%2C,2', query: {b: 'x'}}, {encode: false, arrayFormat: 'comma'}), 'https://foo.bar?a=%2C,2&b=x');
});

test('stringify URL with a separator that `encodeURIComponent` leaves as-is', () => {
	// The percent-encoded separator inside an item of the existing query survives the decode and re-encode.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=a%2Db-c', query: {}}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'https://foo.bar?foo=a%2Db-c');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: ['a-b', 'c']}}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'https://foo.bar?foo=a%2Db-c');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {bar: [null]}}, {arrayFormat: 'bracket-separator', skipNull: true}), 'https://foo.bar?bar[]');
});

test('stringify URL with `encode: false` and a fragment identifier in the URL', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=%20#top%20', query: {}}, {encode: false}), 'https://foo.bar?a=%20#top%20');
});

test('stringify URL with default encoding still decodes and re-encodes the existing query', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=%20&b=1+2', query: {c: 'x'}}), 'https://foo.bar?a=%20&b=1%202&c=x');
});

test('stringify URL throws a TypeError for unsupported query value types', () => {
	assert.throws(() => queryString.stringifyUrl({url: 'https://foo.bar', query: {a: {}}}), TypeError);
});

test('stringify URL drops a query parameter named `__proto__`', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?__proto__=1&a=2', query: {b: 3}}), 'https://foo.bar?a=2&b=3');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {['__proto__']: 1}}), 'https://foo.bar');
});

test('stringify URL applies skipNull and skipEmptyString to the replacer result', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {a: 1, b: 2}}, {skipNull: true, replacer: (key, value) => key === 'b' ? null : value}), 'https://foo.bar?a=1');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?b=2', query: {a: 1}}, {skipEmptyString: true, replacer: (key, value) => key === 'b' ? '' : value}), 'https://foo.bar?a=1');
});

test('stringify URL merges a repeated key in the existing query with the comma array format', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=1&foo=2', query: {}}, {arrayFormat: 'comma'}), 'https://foo.bar?foo=1,2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=1,2&foo=3', query: {bar: 'x'}}, {arrayFormat: 'comma'}), 'https://foo.bar?bar=x&foo=1,2,3');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=1&foo=2', query: {foo: [3]}}, {arrayFormat: 'comma'}), 'https://foo.bar?foo=3');
});

test('stringifyUrl keeps a plain value that contains the separator with the comma and separator formats', () => {
	const options = {arrayFormat: 'separator', arrayFormatSeparator: '.'};
	const url = queryString.stringifyUrl({url: 'https://foo.bar', query: {version: '1.2.3', tags: ['a.b', 'c']}}, options);
	assert.equal(url, 'https://foo.bar?tags=a%2Eb.c&version=1%2E2%2E3');
	assert.deepEqual(structuredClone(queryString.parseUrl(url, options).query), {version: '1.2.3', tags: ['a.b', 'c']});

	// A plain value in the existing query string is parsed and written back unchanged.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?version=1%2E2%2E3', query: {page: 2}}, options), 'https://foo.bar?page=2&version=1%2E2%2E3');
	assert.equal(queryString.pick('https://foo.bar?version=1%2E2%2E3&page=2', ['version'], options), 'https://foo.bar?version=1%2E2%2E3');
});

test('an option that is explicitly `undefined` uses its default', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=%26', query: {bar: '='}}, {encode: undefined}), 'https://foo.bar?bar=%3D&foo=%26');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: '!'}}, {strict: undefined}), 'https://foo.bar?foo=%21');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?b=1', query: {a: 2}}, {sort: undefined}), 'https://foo.bar?a=2&b=1');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', fragmentIdentifier: '100%'}, {encode: undefined}), 'https://foo.bar#100%25');
});

test('stringify URL replaces a lone surrogate in the query with the replacement character, like in the fragment identifier', () => {
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'x\u{D800}y'}, fragmentIdentifier: 'x\u{D800}y'}), 'https://foo.bar?foo=x%EF%BF%BDy#x%EF%BF%BDy');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?a=1', query: {'\u{DC00}': 'b'}}), 'https://foo.bar?a=1&%EF%BF%BD=b');
});

test('stringify URL ignores leading and trailing whitespace in the URL, like `parseUrl()` does', () => {
	// `parse()` already trims the query, so whitespace after the query disappeared, while whitespace before the query or after the fragment identifier was kept and ended up inside the URL, like `https://foo.bar/ ?a=1`.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/ ', query: {a: 1}}), 'https://foo.bar/?a=1');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/\n', query: {}}), 'https://foo.bar/');
	assert.equal(queryString.stringifyUrl({url: ' https://foo.bar/?b=2 ', query: {a: 1}}), 'https://foo.bar/?a=1&b=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#top\n', query: {a: 1}}), 'https://foo.bar/?a=1#top');
	assert.equal(queryString.stringifyUrl({url: '\thttps://foo.bar/?a=1#top\n'}), 'https://foo.bar/?a=1#top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/ ', fragmentIdentifier: 'top'}), 'https://foo.bar/#top');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/?a=1 \n', fragmentIdentifier: ''}), 'https://foo.bar/?a=1');
	assert.equal(queryString.stringifyUrl({url: '  ', query: {a: 1}}), '?a=1');
	assert.equal(queryString.stringifyUrl({url: '  '}), '');

	// Whitespace inside the URL is kept.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/a b', query: {a: 'x y'}}), 'https://foo.bar/a b?a=x%20y');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar/#hello world\n', query: {}}), 'https://foo.bar/#hello world');

	// The same URL round-trips through `parseUrl()` either way.
	const url = ' https://foo.bar/?a=1#top\n';
	assert.equal(queryString.stringifyUrl({url}), queryString.stringifyUrl(queryString.parseUrl(url, {parseFragmentIdentifier: true})));
});

test('stringify URL does not rewrite the query parameters in the URL with `parseNumbers`, `parseBooleans`, or `types`', () => {
	// The query in the URL was parsed with every option, so a parse option passed along with the stringify options, like when the same options object is shared with `parseUrl()`, rewrote a value like `007` as `7` and `TRUE` as `true`.
	const url = 'https://foo.bar?id=007&flag=TRUE&ratio=1.50';
	const expected = 'https://foo.bar?flag=TRUE&id=007&ratio=1.50';
	assert.equal(queryString.stringifyUrl({url, query: {}}, {parseNumbers: true}), expected);
	assert.equal(queryString.stringifyUrl({url, query: {}}, {parseBooleans: true}), expected);
	assert.equal(queryString.stringifyUrl({url, query: {}}, {types: {id: 'number', flag: 'boolean', ratio: 'number'}}), expected);
	assert.equal(queryString.stringifyUrl({url, query: {}}, {types: {id: value => value.toUpperCase()}}), expected);
	assert.equal(queryString.stringifyUrl({url, query: {page: 2}}, {parseNumbers: true, parseBooleans: true, types: {id: 'number'}}), 'https://foo.bar?flag=TRUE&id=007&page=2&ratio=1.50');

	// A custom type function is not called for the query in the URL.
	let calls = 0;
	queryString.stringifyUrl({url, query: {}}, {
		types: {
			id() {
				calls++;
			},
		},
	});
	assert.equal(calls, 0);

	// Array items and a repeated key with the `string` type are kept as-is too.
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?ids=001,002'}, {arrayFormat: 'comma', types: {ids: 'number[]'}}), 'https://foo.bar?ids=001,002');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?id=1&id=2'}, {types: {id: 'string'}}), 'https://foo.bar?id=1&id=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?id=001'}, {arrayFormat: 'bracket', types: {id: 'number[]'}}), 'https://foo.bar?id=001');

	// The query passed in `query` still overrides the URL, and `pick()` and `exclude()` are unaffected.
	assert.equal(queryString.stringifyUrl({url, query: {id: 8}}, {parseNumbers: true}), 'https://foo.bar?flag=TRUE&id=8&ratio=1.50');
	assert.equal(queryString.pick(url, ['id'], {parseNumbers: true}), 'https://foo.bar?id=007');
	assert.equal(queryString.exclude(url, ['flag'], {parseBooleans: true, types: {id: 'number'}}), 'https://foo.bar?id=007&ratio=1.50');
});

test('stringify URL is the inverse of parse URL for every array format', () => {
	// `.stringifyUrl()` is documented as the inverse of `.parseUrl()`, so a URL written from the parsed result has to come back byte-for-byte. The array formats write the marker from the option instead of from the parsed key, so a value and a marker that are written back unchanged are easy to get wrong.
	const optionSets = [
		{},
		{arrayFormat: 'bracket'},
		{arrayFormat: 'index'},
		{arrayFormat: 'comma'},
		{arrayFormat: 'separator', arrayFormatSeparator: '|'},
		{arrayFormat: 'separator', arrayFormatSeparator: '.'},
		{arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'},
		{arrayFormat: 'colon-list-separator'},
		{arrayFormat: 'comma', strict: false},
		{arrayFormat: 'bracket', sort: false},
		{arrayFormat: 'separator', arrayFormatSeparator: '-', encode: false},
	];
	const objects = [
		{a: 'x'},
		{a: ['x', 'y']},
		{a: 'x,y'},
		{a: ['a,b', 'c']},
		{a: 'a-b'},
		{a: ['a-b', 'c']},
		{a: 'a.b'},
		{a: null},
		{a: ''},
		{a: ['', 'x']},
		{a: [null, 'x']},
		{a: ['x'], b: ['y']},
		{a: 1, b: 'x'},
		{a: '%'},
		{a: 'ståle'},
		{a: 'x\u{D800}y'},
		{a: 'x\ty'},
		// `z` before `a`, so the default sorting and `sort: false` write a different URL.
		{z: 'x', a: 'y'},
		// The characters that only `strict` encodes.
		{a: '!\'()*'},
	];

	for (const options of optionSets) {
		for (const object of objects) {
			const label = `${JSON.stringify(options)} with ${JSON.stringify(object)}`;
			const url = queryString.stringifyUrl({url: 'https://foo.bar', query: object, fragmentIdentifier: '100% /x?y#z'}, options);
			assert.equal(queryString.stringifyUrl(queryString.parseUrl(url, {...options, parseFragmentIdentifier: true}), options), url, label);
		}
	}
});

test('stringify URL lets a query array override an array in the URL with every array format', () => {
	// The URL's own parameter is written back in the syntax of the array format, so the override has to use that syntax too.
	const cases = [
		[{}, 'https://foo.bar?a=1&a=2', 'https://foo.bar?a=3&a=4'],
		[{arrayFormat: 'bracket'}, 'https://foo.bar?a[]=1&a[]=2', 'https://foo.bar?a[]=3&a[]=4'],
		[{arrayFormat: 'index'}, 'https://foo.bar?a[0]=1&a[1]=2', 'https://foo.bar?a[0]=3&a[1]=4'],
		[{arrayFormat: 'comma'}, 'https://foo.bar?a=1,2', 'https://foo.bar?a=3,4'],
		[{arrayFormat: 'separator', arrayFormatSeparator: '|'}, 'https://foo.bar?a=1|2', 'https://foo.bar?a=3|4'],
		[{arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'}, 'https://foo.bar?a[]=1|2', 'https://foo.bar?a[]=3|4'],
		[{arrayFormat: 'colon-list-separator'}, 'https://foo.bar?a:list=1&a:list=2', 'https://foo.bar?a:list=3&a:list=4'],
	];

	for (const [options, url, expected] of cases) {
		const label = `array format ${JSON.stringify(options)}`;
		assert.equal(queryString.stringifyUrl({url, query: {a: ['3', '4']}}, options), expected, label);
		// The result reads back as the overriding array.
		const query = queryString.extract(expected);
		assert.deepEqual(structuredClone(queryString.parse(query, options)), {a: ['3', '4']}, label);
	}
});
