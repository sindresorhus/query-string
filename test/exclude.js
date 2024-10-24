import test from 'ava';
import queryString from '../index.js';

test('excludes elements in a URL with a filter array', t => {
	t.is(queryString.exclude('http://example.com/?a=1&b=2&c=3#a', ['c']), 'http://example.com/?a=1&b=2#a');
});

test('excludes elements in a URL with a filter predicate', t => {
	t.is(queryString.exclude('http://example.com/?a=1&b=2&c=3#a', (name, value) => {
		t.is(typeof name, 'string');
		t.is(typeof value, 'number');

		return name === 'a';
	}, {
		parseNumbers: true,
	}), 'http://example.com/?b=2&c=3#a');
});

test('excludes elements in a URL without encoding fragment identifiers', t => {
	t.is(queryString.exclude('https://example.com?a=b#/home', ['a']), 'https://example.com#/home');
});
