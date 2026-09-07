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

test('handles relative URLs with fragment identifiers', t => {
	t.is(queryString.exclude('/users?page=1&sort=name#section', ['sort']), '/users?page=1#section');
});

test('handles fragments with special characters', t => {
	t.is(queryString.exclude('http://example.com/?a=1#section/subsection', ['a']), 'http://example.com/#section/subsection');
});

test('handles complex nested parameter names', t => {
	const result = queryString.exclude('http://example.com/?user[name]=John&user[age]=30&id=1', ['user[name]']);
	t.true(result === 'http://example.com/?user%5Bage%5D=30&id=1' || result === 'http://example.com/?id=1&user%5Bage%5D=30');
});

test('handles a URL with a fragment identifier that the WHATWG parser rejects', t => {
	t.is(queryString.exclude('http://foo.com:99999/p?a=1&b=2#frag', ['b']), 'http://foo.com:99999/p?a=1#frag');
});

test('handles a fragment identifier that starts with `#`', t => {
	t.is(queryString.exclude('https://foo.bar/?a=1&b=2#%23top', ['b']), 'https://foo.bar/?a=1#%23top');
});

test('excludes elements in a URL with index array format', t => {
	t.is(queryString.exclude('https://foo.bar?foo[1]=b&foo[0]=a&bar=x', ['bar'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=a&foo[1]=b');
});

test('excludes elements in a URL with a percent-encoded fragment identifier', t => {
	t.is(queryString.exclude('https://foo.bar?foo=1&bar=2#hello%20world', ['foo']), 'https://foo.bar?bar=2#hello%20world');
});

test('excludes elements in a URL and keeps the fragment identifier as-is', t => {
	t.is(queryString.exclude('https://foo.bar?a=1&b=2#a%2Fb/c:d', ['a']), 'https://foo.bar?b=2#a%2Fb/c:d');
	t.is(queryString.exclude('https://foo.bar?a=1&b=2#', ['a']), 'https://foo.bar?b=2#');
	t.is(queryString.exclude('https://foo.bar?a=1&b=2#hello%20world', (name, value) => value === '1'), 'https://foo.bar?b=2#hello%20world');
	t.is(queryString.exclude('https://foo.bar?a=1#section?x=1', ['a']), 'https://foo.bar#section?x=1');
});

test('excludes elements in a URL with `encode: false` and keeps the values as-is', t => {
	t.is(queryString.exclude('https://foo.bar?a=%20&b=1+2&c=3', ['c'], {encode: false}), 'https://foo.bar?a=%20&b=1+2');
});

test('excludes elements in a URL with `encode: false` and array formats', t => {
	t.is(queryString.exclude('https://foo.bar?a[]=%20&a[]=2&b=1', ['b'], {encode: false, arrayFormat: 'bracket'}), 'https://foo.bar?a[]=%20&a[]=2');
	t.is(queryString.exclude('https://foo.bar?a=%2C,2&b=1', ['b'], {encode: false, arrayFormat: 'comma'}), 'https://foo.bar?a=%2C,2');
});

test('excludes elements in a URL with default encoding and re-encodes the values', t => {
	t.is(queryString.exclude('https://foo.bar?a=%20&b=1+2&c=3', ['c']), 'https://foo.bar?a=%20&b=1%202');
});

test('drops a query parameter named `__proto__` even when it is not excluded', t => {
	t.is(queryString.exclude('https://foo.bar?__proto__=1&a=2', ['a']), 'https://foo.bar');
	t.is(queryString.exclude('https://foo.bar?__proto__=1&a=2', ['__proto__']), 'https://foo.bar?a=2');
});

test('sorts the query parameters by default and keeps their order with sort false', t => {
	t.is(queryString.exclude('http://example.com/?c=3&b=2&a=1', ['b']), 'http://example.com/?a=1&c=3');
	t.is(queryString.exclude('http://example.com/?c=3&b=2&a=1', ['b'], {sort: false}), 'http://example.com/?c=3&a=1');
	t.is(queryString.exclude('http://example.com/?c=3&b=2&a=1#hash', [], {sort: false}), 'http://example.com/?c=3&b=2&a=1#hash');
	t.is(queryString.exclude('http://example.com/?c=3&b=2&a=1', (key, value) => value === '2', {sort: false}), 'http://example.com/?c=3&a=1');
	t.is(queryString.exclude('http://example.com/?c=3&b=2&a=1', ['b'], {sort: (left, right) => right.localeCompare(left)}), 'http://example.com/?c=3&a=1');
	t.is(queryString.exclude('http://example.com/?c[]=3&a[]=1&c[]=4', ['b'], {arrayFormat: 'bracket', sort: false}), 'http://example.com/?c[]=3&c[]=4&a[]=1');
});
