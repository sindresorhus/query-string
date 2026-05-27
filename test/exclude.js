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

test('handles empty filter array', t => {
	t.is(queryString.exclude('http://example.com/?a=1&b=2&c=3', []), 'http://example.com/?a=1&b=2&c=3');
});

test('handles large exclusion arrays without quadratic slowdown', t => {
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

	t.true(result.startsWith('https://example.com/?a0=1&a1=1'));
	t.true(arrayElapsedTime < (predicateElapsedTime * 5) + 50, `Expected exclusion array filtering to stay near the Set predicate baseline. Array: ${arrayElapsedTime}ms. Predicate: ${predicateElapsedTime}ms.`);
});

test('handles excluding non-existent parameters', t => {
	t.is(queryString.exclude('http://example.com/?a=1&b=2', ['c', 'd']), 'http://example.com/?a=1&b=2');
});

test('handles multiple values for same parameter', t => {
	t.is(queryString.exclude('http://example.com/?a=1&a=2&b=3', ['b']), 'http://example.com/?a=1&a=2');
});

test('handles special characters in parameter names', t => {
	t.is(queryString.exclude('http://example.com/?foo%5Bbar%5D=1&normal=2', ['foo[bar]']), 'http://example.com/?normal=2');
});

test('handles URL without query parameters', t => {
	t.is(queryString.exclude('http://example.com/', ['a']), 'http://example.com/');
	t.is(queryString.exclude('http://example.com/#hash', ['a']), 'http://example.com/#hash');
});

test('excludes all parameters when filter matches everything', t => {
	t.is(queryString.exclude('http://example.com/?a=1&b=2&c=3', ['a', 'b', 'c']), 'http://example.com/');
});

test('preserves URL path when excluding parameters', t => {
	t.is(queryString.exclude('http://example.com/path/to/page?a=1&b=2', ['a']), 'http://example.com/path/to/page?b=2');
});

test('handles empty string values', t => {
	t.is(queryString.exclude('http://example.com/?a=&b=2&c=', ['b']), 'http://example.com/?a=&c=');
});

test('handles parameters without values', t => {
	t.is(queryString.exclude('http://example.com/?a&b=2&c', ['b']), 'http://example.com/?a&c');
});

test('filter predicate receives correct arguments for array values', t => {
	const url = 'http://example.com/?a=1&a=2&b=3';
	const result = queryString.exclude(url, (name, value) => {
		if (name === 'a') {
			t.true(Array.isArray(value));
			t.deepEqual(value, ['1', '2']);
			return true;
		}

		return false;
	});
	t.is(result, 'http://example.com/?b=3');
});

test('handles relative URLs', t => {
	t.is(queryString.exclude('/path?a=1&b=2', ['a']), '/path?b=2');
	t.is(queryString.exclude('?a=1&b=2', ['b']), '?a=1');
});

test('handles fragments with special characters', t => {
	t.is(queryString.exclude('http://example.com/?a=1#section/subsection', ['a']), 'http://example.com/#section/subsection');
});

test('handles complex nested parameter names', t => {
	const result = queryString.exclude('http://example.com/?user[name]=John&user[age]=30&id=1', ['user[name]']);
	t.true(result === 'http://example.com/?user%5Bage%5D=30&id=1' || result === 'http://example.com/?id=1&user%5Bage%5D=30');
});
