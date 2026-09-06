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

test('picks elements in a URL with `encode: false` and keeps the values as-is', t => {
	t.is(queryString.pick('https://foo.bar?a=%20&b=1+2&c=3', ['a', 'b'], {encode: false}), 'https://foo.bar?a=%20&b=1+2');
});

test('picks elements in a URL with `encode: false` and an explicit `decode: true`', t => {
	t.is(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === ' ', {encode: false, decode: true}), 'https://foo.bar?a= ');
});

test('picks elements in a URL with `encode: false` and a filter predicate that sees the raw values', t => {
	t.is(queryString.pick('https://foo.bar?a=%20&b=1', (name, value) => value === '%20', {encode: false}), 'https://foo.bar?a=%20');
});
