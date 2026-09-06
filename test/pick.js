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
	t.is(queryString.pick('https://foo.bar/?a=1&b=2#%23top', ['a']), 'https://foo.bar/?a=1##top');
});

test('picks elements in a URL when sort is true', t => {
	t.is(queryString.pick('http://example.com/?c=3&b=2&a=1', ['c', 'a'], {sort: true}), 'http://example.com/?a=1&c=3');
});

test('picks elements in a URL with index array format', t => {
	t.is(queryString.pick('https://foo.bar?foo[1]=b&foo[0]=a&bar=x', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=a&foo[1]=b');
});
