import test from 'ava';
import queryString from '../index.js';

test('picks elements in a URL with a filter array', t => {
	t.is(queryString.pick('http://example.com/?a=1&b=2&c=3#a', ['a', 'b']), 'http://example.com/?a=1&b=2#a');
});

test('picks elements in a URL with a filter predicate', t => {
	t.is(queryString.pick('http://example.com/?a=1&b=2&c=3#a', (name, value) => {
		t.is(typeof name, 'string');
		t.is(typeof value, 'number');

		return name === 'a';
	}, {
		parseNumbers: true,
	}), 'http://example.com/?a=1#a');
});

test('picks elements in a URL without encoding fragment identifiers', t => {
	t.is(queryString.pick('https://example.com?a=b#/home', []), 'https://example.com#/home');
});

test('picks elements in a relative URL with a fragment identifier', t => {
	t.is(queryString.pick('/users?page=1&sort=name#section', ['page']), '/users?page=1#section');
});

test('picks elements in a URL with a fragment identifier that the WHATWG parser rejects', t => {
	t.is(queryString.pick('http://foo.com:99999/p?a=1&b=2#frag', ['a']), 'http://foo.com:99999/p?a=1#frag');
	t.is(queryString.pick('http://[bad/?a=1&b=2#frag', ['a']), 'http://[bad/?a=1#frag');
});

test('picks elements in a URL with a fragment identifier that starts with `#`', t => {
	t.is(queryString.pick('https://foo.bar/?a=1&b=2#%23top', ['a']), 'https://foo.bar/?a=1#%23top');
});

test('sorts the query parameters by default and keeps their order with sort false', t => {
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', ['c', 'a']), 'http://example.com/?a=1&c=3');
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: false}), 'http://example.com/?c=3&a=1');
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1#hash', ['c', 'b', 'a'], {sort: false}), 'http://example.com/?c=3&b=2&a=1#hash');
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', (key, value) => value !== '2', {sort: false}), 'http://example.com/?c=3&a=1');
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: (left, right) => right.localeCompare(left)}), 'http://example.com/?c=3&a=1');
	t.is(queryString.pick('http://example.com/?c[]=3&a[]=1&c[]=4', ['c', 'a'], {arrayFormat: 'bracket', sort: false}), 'http://example.com/?c[]=3&c[]=4&a[]=1');
});

test('picks elements in a URL when sort is true', t => {
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: true}), 'http://example.com/?a=1&c=3');
});

test('picks elements in a URL with index array format', t => {
	t.is(queryString.pick('https://foo.bar?foo[1]=b&foo[0]=a&bar=x', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=a&foo[1]=b');
});

test('picks elements in a URL with a percent-encoded fragment identifier', t => {
	t.is(queryString.pick('https://foo.bar?foo=1&bar=2#hello%20world', ['foo']), 'https://foo.bar?foo=1#hello%20world');
});

test('picks elements in a URL and keeps the fragment identifier as-is', t => {
	t.is(queryString.pick('https://foo.bar?a=1&b=2#a%2Fb/c:d', ['a']), 'https://foo.bar?a=1#a%2Fb/c:d');
	t.is(queryString.pick('https://foo.bar?a=1&b=2#', ['a']), 'https://foo.bar?a=1#');
	t.is(queryString.pick('https://foo.bar?a=1&b=2#hello%20world', ['a'], {decode: false}), 'https://foo.bar?a=1#hello%20world');
	t.is(queryString.pick('https://foo.bar?a=1&b=2', ['a']), 'https://foo.bar?a=1');
});

test('picks elements in a URL with a fragment identifier that contains a question mark', t => {
	t.is(queryString.pick('https://foo.bar?a=1&b=2#section?x=1', ['a']), 'https://foo.bar?a=1#section?x=1');
	t.is(queryString.pick('https://foo.bar#section?x=1', ['x']), 'https://foo.bar#section?x=1');
});

test('picks elements in a URL with a separator that `encodeURIComponent` leaves as-is', t => {
	// The percent-encoded separator inside an item survives the decode and re-encode.
	t.is(queryString.pick('https://foo.bar?foo=a%2Db-c&bar=1', ['foo'], {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'https://foo.bar?foo=a%2Db-c');
	t.is(queryString.pick('https://foo.bar?foo[]=a%2Eb.c&bar=1', ['foo'], {arrayFormat: 'bracket-separator', arrayFormatSeparator: '.'}), 'https://foo.bar?foo[]=a%2Eb.c');
	t.is(queryString.exclude('https://foo.bar?foo=a%2Db-c&bar=1', ['bar'], {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'https://foo.bar?foo=a%2Db-c');
});

test('picks elements in a URL with `encode: false` and keeps the values as-is', t => {
	t.is(queryString.pick('https://foo.bar?a=%20&b=1+2&c=3', ['a', 'b'], {encode: false}), 'https://foo.bar?a=%20&b=1+2');
});

test('picks elements in a URL with `encode: false` and an explicit `decode: true`', t => {
	t.is(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === ' ', {encode: false, decode: true}), 'https://foo.bar?a= ');
});

test('picks elements in a URL with `encode: false` and a filter predicate that sees the raw values', t => {
	t.is(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === '%20', {encode: false}), 'https://foo.bar?a=%20');
});

test('drops a query parameter named `__proto__`', t => {
	t.is(queryString.pick('https://foo.bar?__proto__=1&a=2', ['__proto__']), 'https://foo.bar');
	t.is(queryString.pick('https://foo.bar?__proto__=1&a=2', (name, value) => value === '1'), 'https://foo.bar');
});

test('picks elements in a URL with index array format when a scalar precedes the indexed entries', t => {
	t.is(queryString.pick('https://foo.bar?foo=1&foo[0]=2&bar=x', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
});

test('keeps the order of the URL with sort false, not the order of the keys array', t => {
	// The keys array is a filter, not an order. With `sort: false` the query parameters keep the parsed object's key order, like the docs say.
	t.is(queryString.pick('http://example.com/?b=1&a=2&c=3', ['a', 'c', 'b'], {sort: false}), 'http://example.com/?b=1&a=2&c=3');
	t.is(queryString.pick('http://example.com/?b=1&a=2&c=3', ['c', 'a'], {sort: false}), 'http://example.com/?a=2&c=3');
	t.is(queryString.pick('http://example.com/?b=1&a=2&c=3', ['c', 'b'], {sort: false}), 'http://example.com/?b=1&c=3');
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', ['a', 'b', 'c'], {sort: false}), 'http://example.com/?c=3&b=2&a=1');
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1#hash', ['a', 'c'], {sort: false}), 'http://example.com/?c=3&a=1#hash');
	t.is(queryString.pick('/path?z=1&y=2&x=3', ['x', 'y', 'z'], {sort: false}), '/path?z=1&y=2&x=3');
	t.is(queryString.pick('?b=1&a=2', ['a', 'b'], {sort: false}), '?b=1&a=2');

	// Keys that are not in the URL, and repeated keys, do not change the order.
	t.is(queryString.pick('http://example.com/?b=1&a=2', ['x', 'a', 'y', 'b'], {sort: false}), 'http://example.com/?b=1&a=2');
	t.is(queryString.pick('http://example.com/?b=1&a=2', ['a', 'b', 'a'], {sort: false}), 'http://example.com/?b=1&a=2');

	// Array values and the other options keep the order too.
	t.is(queryString.pick('http://example.com/?b=1&a=2&b=3', ['a', 'b'], {sort: false}), 'http://example.com/?b=1&b=3&a=2');
	t.is(queryString.pick('http://example.com/?b[]=1&a[]=2', ['a', 'b'], {arrayFormat: 'bracket', sort: false}), 'http://example.com/?b[]=1&a[]=2');
	t.is(queryString.pick('http://example.com/?b[0]=1&a[0]=2', ['a', 'b'], {arrayFormat: 'index', sort: false}), 'http://example.com/?b[0]=1&a[0]=2');
	t.is(queryString.pick('http://example.com/?b=1,2&a=3', ['a', 'b'], {arrayFormat: 'comma', sort: false}), 'http://example.com/?b=1,2&a=3');
	t.is(queryString.pick('http://example.com/?b=1&a=2', ['a', 'b'], {sort: false, parseNumbers: true}), 'http://example.com/?b=1&a=2');
	t.is(queryString.pick('http://example.com/?b=a%20b&a=2', ['a', 'b'], {sort: false, encode: false}), 'http://example.com/?b=a%20b&a=2');
	t.is(queryString.pick('http://example.com/?b&a=2', ['a', 'b'], {sort: false}), 'http://example.com/?b&a=2');

	// Integer-index keys are enumerated first in numeric order, even when sorting is disabled.
	t.is(queryString.pick('https://foo.bar?x=c&2=b&1=a', ['x', '2', '1'], {sort: false}), 'https://foo.bar?1=a&2=b&x=c');
	t.is(queryString.exclude('https://foo.bar?x=c&2=b&1=a', [], {sort: false}), 'https://foo.bar?1=a&2=b&x=c');

	// The default and a custom sort still apply.
	t.is(queryString.pick('http://example.com/?b=1&a=2&c=3', ['c', 'b', 'a']), 'http://example.com/?a=2&b=1&c=3');
	t.is(queryString.pick('http://example.com/?b=1&a=2&c=3', ['a', 'b', 'c'], {sort: (left, right) => right.localeCompare(left)}), 'http://example.com/?c=3&b=1&a=2');
});

test('keeps the fragment identifier when the URL has no query string', t => {
	t.is(queryString.pick('https://foo.bar#hello', ['foo']), 'https://foo.bar#hello');
	t.is(queryString.pick('https://foo.bar#/path?not=a-query', ['not']), 'https://foo.bar#/path?not=a-query');
	t.is(queryString.exclude('https://foo.bar#/path?not=a-query', ['not']), 'https://foo.bar#/path?not=a-query');
	t.is(queryString.pick('https://foo.bar?foo=1#hello', []), 'https://foo.bar#hello');
});
