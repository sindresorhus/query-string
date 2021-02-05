import test from 'ava';
import queryString from '..';

test('picks elements in a URL with a filter array', t => {
	t.is(queryString.pick('http://example.com/?a=1&b=2&c=3#a', ['a', 'b']), 'http://example.com/?a=1&b=2#a');
});

test('picks elements in a URL with a filter predicate', t => {
	t.is(queryString.pick('http://example.com/?a=1&b=2&c=3#a', (name, value) => {
		t.is(typeof name, 'string');
		t.is(typeof value, 'number');

		return name === 'a';
	}, {
		parseNumbers: true
	}), 'http://example.com/?a=1#a');
});
