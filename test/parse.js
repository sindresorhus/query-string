/* eslint-disable node-test/no-conditional-assertion -- Many tests here are table-driven, so the assertions sit inside a loop over the cases. The loop always runs, and every case is checked. */
import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('query strings starting with a `?`', () => {
	assert.deepEqual(structuredClone(queryString.parse('?foo=bar')), {foo: 'bar'});
});

test('query strings starting with a `#`', () => {
	assert.deepEqual(structuredClone(queryString.parse('#foo=bar')), {foo: 'bar'});
});

test('query strings starting with a `&`', () => {
	assert.deepEqual(structuredClone(queryString.parse('&foo=bar&foo=baz')), {foo: ['bar', 'baz']});
});

test('query strings ending with a `&`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar&')), {foo: 'bar'});
	assert.deepEqual(structuredClone(queryString.parse('foo=bar&&&')), {foo: 'bar'});
});

test('parse a query string', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar')), {foo: 'bar'});
	assert.deepEqual(structuredClone(queryString.parse('foo=null')), {foo: 'null'});
});

test('parse multiple query string', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar&key=val')), {
		foo: 'bar',
		key: 'val',
	});
});

test('parse multiple query string retain order when not sorted', () => {
	const expectedKeys = ['b', 'a', 'c'];
	const parsed = queryString.parse('b=foo&a=bar&c=yay', {sort: false});
	for (const [index, key] of Object.keys(parsed).entries()) {
		assert.equal(key, expectedKeys[index]);
	}
});

test('a `sort` that is not a boolean or a function sorts, like `stringify()` sorts', () => {
	// `parse()` passed the option straight to `Array#sort()`, which throws for anything that is not a function, so any other value crashed with a message about a comparison function. `stringify()` reads the same option as a function or nothing, so it sorted. One options object shared by both has to work.
	for (const sort of [null, 0, '', 1, 'asc', [], {}]) {
		assert.deepEqual(structuredClone(queryString.parse('b=1&a=2', {sort})), {a: '2', b: '1'}, `sort: ${JSON.stringify(sort)}`);
		assert.deepEqual(structuredClone(queryString.parse('b=1&a=2', {sort: true})), {a: '2', b: '1'}, 'sort: true');
		assert.deepEqual(structuredClone(queryString.parse('b=1&a=2', {sort: false})), {b: '1', a: '2'}, 'sort: false');
	}

	// A function is still the comparator, and it is still applied to the keys.
	assert.deepEqual(structuredClone(queryString.parse('c=3&b=2&a=1', {sort: (left, right) => left.localeCompare(right)})), {a: '1', b: '2', c: '3'});
});

test('parse multiple query string sorted keys', () => {
	const fixture = ['a', 'b', 'c'];
	const parsed = queryString.parse('a=foo&c=bar&b=yay');
	for (const [index, key] of Object.keys(parsed).entries()) {
		assert.equal(key, fixture[index]);
	}
});

test('default sort compares keys in UTF-16 code unit order, not code point order', () => {
	// `Array#sort` compares UTF-16 code units, so a character outside the Basic Multilingual Plane is stored as a surrogate pair whose leading code unit is below U+E000 and therefore sorts before U+FFFD. Unicode code point order would place U+FFFD (0xFFFD) before the astral character (0x10000), but the documented default is `Array#sort`, so the UTF-16 order is what is delivered.
	const parsed = queryString.parse('%F0%9F%98%80=astral&%EF%BF%BD=bmp');
	assert.deepEqual(structuredClone(Object.keys(parsed)), ['\u{1F600}', '\u{FFFD}']);
});

test('should sort parsed keys in given order', () => {
	const fixture = ['c', 'a', 'b'];
	const sort = (key1, key2) => fixture.indexOf(key1) - fixture.indexOf(key2);

	const parsed = queryString.parse('a=foo&b=bar&c=yay', {sort});
	for (const [index, key] of Object.keys(parsed).entries()) {
		assert.equal(key, fixture[index]);
	}
});

test('parse query string without a value', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo')), {foo: null});
	assert.deepEqual(structuredClone(queryString.parse('foo&key')), {
		foo: null,
		key: null,
	});
	assert.deepEqual(structuredClone(queryString.parse('foo=bar&key')), {
		foo: 'bar',
		key: null,
	});
	assert.deepEqual(structuredClone(queryString.parse('a&a')), {a: [null, null]});
	assert.deepEqual(structuredClone(queryString.parse('a=&a')), {a: ['', null]});
});

test('return empty object if no qss can be found', () => {
	assert.deepEqual(structuredClone(queryString.parse('?')), {});
	assert.deepEqual(structuredClone(queryString.parse('&')), {});
	assert.deepEqual(structuredClone(queryString.parse('#')), {});
	assert.deepEqual(structuredClone(queryString.parse(' ')), {});
});

test('handle `+` correctly', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo+faz=bar+baz++')), {'foo faz': 'bar baz  '});
});

test('parses numbers with exponential notation as string', () => {
	assert.deepEqual(structuredClone(queryString.parse('192e11=bar')), {'192e11': 'bar'});
	assert.deepEqual(structuredClone(queryString.parse('bar=192e11')), {bar: '192e11'});
});

test('handle `+` correctly when not decoding', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo+faz=bar+baz++', {decode: false})), {'foo+faz': 'bar+baz++'});
});

test('handle multiple of the same key', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar&foo=baz')), {foo: ['bar', 'baz']});
});

test('handles many duplicate keys without quadratic slowdown', () => {
	// The additive term below is a ceiling for garbage collection, not for the
	// parsing. These queries are megabytes long, so collecting them costs a few
	// hundred milliseconds however the parsing is written. The factor is what
	// catches a quadratic slowdown, and a quadratic pass over this input takes
	// seconds, so there is still a wide gap between passing and failing.
	const count = 20_000;
	const duplicateQuery = Array.from({length: count}, () => 'a=1').join('&');
	const uniqueQuery = Array.from({length: count}, (_, index) => `a${index}=1`).join('&');

	const uniqueStartTime = performance.now();
	queryString.parse(uniqueQuery);
	const uniqueElapsedTime = performance.now() - uniqueStartTime;

	const duplicateStartTime = performance.now();
	const parsed = queryString.parse(duplicateQuery);
	const duplicateElapsedTime = performance.now() - duplicateStartTime;

	assert.equal(parsed.a.length, count);
	assert.ok(parsed.a.every(value => value === '1'));
	assert.ok(
		duplicateElapsedTime < (uniqueElapsedTime * 20) + 1000,
		`Expected duplicate-key parsing to stay near the unique-key baseline. Duplicate: ${duplicateElapsedTime}ms. Unique: ${uniqueElapsedTime}ms.`,
	);
});

test('handles many explicit array items without quadratic slowdown', () => {
	// The additive term below is a ceiling for garbage collection, not for the
	// parsing. These inputs are megabytes long, so collecting them costs a few
	// hundred milliseconds however the code is written. The factor is what
	// catches a quadratic slowdown, which on an input this size takes seconds.
	const count = 20_000;
	const cases = [
		{
			label: 'bracket',
			arrayFormat: 'bracket',
			duplicateQuery: Array.from({length: count}, () => 'a[]=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}[]=1`).join('&'),
		},
		{
			label: 'colon-list-separator',
			arrayFormat: 'colon-list-separator',
			duplicateQuery: Array.from({length: count}, () => 'a:list=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}:list=1`).join('&'),
		},
		{
			label: 'bracket-separator',
			arrayFormat: 'bracket-separator',
			duplicateQuery: Array.from({length: count}, () => 'a[]=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}[]=1`).join('&'),
		},
		{
			// The next free index is tracked per key, so an entry without an index does not have to look at the items seen so far.
			label: 'index without an index',
			arrayFormat: 'index',
			duplicateQuery: Array.from({length: count}, () => 'a[]=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}[]=1`).join('&'),
		},
		{
			// An entry with an explicit index is stored in the index-keyed object, so the object is what grows here, not the next free index.
			label: 'index with an explicit index',
			arrayFormat: 'index',
			duplicateQuery: Array.from({length: count}, (_, index) => `a[${index}]=1`).join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}[0]=1`).join('&'),
		},
	];

	for (const {label, arrayFormat, duplicateQuery, uniqueQuery} of cases) {
		const uniqueStartTime = performance.now();
		queryString.parse(uniqueQuery, {arrayFormat});
		const uniqueElapsedTime = performance.now() - uniqueStartTime;

		const duplicateStartTime = performance.now();
		const parsed = queryString.parse(duplicateQuery, {arrayFormat});
		const duplicateElapsedTime = performance.now() - duplicateStartTime;

		assert.equal(parsed.a.length, count, `case ${label}`);
		assert.ok(parsed.a.every(value => value === '1'), `case ${label}`);
		assert.ok(duplicateElapsedTime < (uniqueElapsedTime * 10) + 1000, `Expected the ${label} case to stay near the unique-key baseline. Duplicate: ${duplicateElapsedTime}ms. Unique: ${uniqueElapsedTime}ms.`);
	}
});

test('handles large bracket-separator chunks without argument spread overflow', () => {
	const count = 200_000;
	const query = `a[]=0&a[]=${Array.from({length: count}, () => '1').join(',')}`;
	const parsed = queryString.parse(query, {arrayFormat: 'bracket-separator'});

	assert.equal(parsed.a.length, count + 1);
	assert.equal(parsed.a[0], '0');
	assert.equal(parsed.a.at(-1), '1');
});

test('handles scalar values before explicit array entries', () => {
	assert.deepEqual(structuredClone(queryString.parse('a=one&a[]=two', {arrayFormat: 'bracket'})), {a: ['one', 'two']});
	assert.deepEqual(structuredClone(queryString.parse('a=one&a:list=two', {arrayFormat: 'colon-list-separator'})), {a: ['one', 'two']});
	assert.deepEqual(structuredClone(queryString.parse('a=one&a[]=two,three', {arrayFormat: 'bracket-separator'})), {a: ['one', 'two', 'three']});
});

test('comma and separator formats parse a single value as a plain value unless an array type is given', () => {
	// A single value has no separator, so it cannot be told apart from a plain value. This is documented, and the `types` option is the way to always get an array.
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'comma'})), {foo: '1'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'separator', arrayFormatSeparator: '|'})), {foo: '1'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: ['1']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'comma', types: {foo: 'number[]'}})), {foo: [1]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'separator', arrayFormatSeparator: '|', types: {foo: 'string[]'}})), {foo: ['1']});
	assert.deepEqual(structuredClone(queryString.parse('foo=', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: ['']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a%2Cb', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: ['a,b']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1', {arrayFormat: 'bracket-separator'})), {foo: ['1']});
	const stringified = queryString.stringify({foo: [1]}, {arrayFormat: 'comma'});
	assert.deepEqual(structuredClone(queryString.parse(stringified, {arrayFormat: 'comma', types: {foo: 'number[]'}})), {foo: [1]});
});

test('bracket-style array formats keep the values of a repeated key without the array marker', () => {
	// A repeated plain key is not in the array syntax of these formats, so it is collected like with `arrayFormat: 'none'` instead of silently dropping the earlier values.
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2&foo=3', {arrayFormat: 'bracket'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'colon-list-separator'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket-separator'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'})), {foo: ['1', '2']});

	// Valueless and empty repeats are kept too.
	assert.deepEqual(structuredClone(queryString.parse('foo&foo=1', {arrayFormat: 'bracket'})), {foo: [null, '1']});
	assert.deepEqual(structuredClone(queryString.parse('foo=&foo=1', {arrayFormat: 'colon-list-separator'})), {foo: ['', '1']});
	assert.deepEqual(structuredClone(queryString.parse('foo&foo', {arrayFormat: 'bracket-separator'})), {foo: [null, null]});

	// A plain value after the marked entries is added to the array, like a plain value before them already was.
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo=2', {arrayFormat: 'bracket'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[]=2&foo=3', {arrayFormat: 'bracket'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo:list=1&foo=2', {arrayFormat: 'colon-list-separator'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1|2&foo=3', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]&foo=1', {arrayFormat: 'bracket-separator'})), {foo: ['1']});

	// Plain values are decoded, like the array items.
	assert.deepEqual(structuredClone(queryString.parse('foo=a%20b&foo=c%2Cd', {arrayFormat: 'bracket-separator'})), {foo: ['a b', 'c,d']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a%20b&foo=c', {arrayFormat: 'bracket-separator', decode: false})), {foo: ['a%20b', 'c']});

	// The other options still apply to the collected array.
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', parseNumbers: true})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', types: {foo: 'number[]'}})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', types: {foo: 'string'}})), {foo: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', types: {foo: value => `<${value}>`}})), {foo: ['<1>', '<2>']});
	assert.deepEqual(structuredClone(queryString.parse('b=1&a=2&b=3', {arrayFormat: 'bracket', sort: false})), {b: ['1', '3'], a: '2'});
	assert.deepEqual(Object.keys(queryString.parse('b=1&a=2&b=3', {arrayFormat: 'bracket', sort: false})), ['b', 'a']);

	// A single plain key is still a plain value, and other keys are not affected.
	assert.deepEqual(structuredClone(queryString.parse('foo=1&bar=2', {arrayFormat: 'bracket'})), {foo: '1', bar: '2'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&bar=2&bar=3', {arrayFormat: 'colon-list-separator'})), {foo: '1', bar: ['2', '3']});

	// `stringify()` writes an array with these formats using the marker, and the URL helpers keep every value of a repeated plain key.
	assert.equal(queryString.pick('https://foo.bar?foo=1&foo=2&bar=3', ['foo'], {arrayFormat: 'bracket'}), 'https://foo.bar?foo[]=1&foo[]=2');
	assert.equal(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=3', ['bar'], {arrayFormat: 'colon-list-separator'}), 'https://foo.bar?foo:list=1&foo:list=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=1&foo=2', query: {bar: 3}}, {arrayFormat: 'bracket-separator'}), 'https://foo.bar?bar=3&foo[]=1,2');
});

test('handles many empty parameters without allocating split results', () => {
	const query = '&'.repeat(5_000_000);
	const startTime = performance.now();
	const parsed = queryString.parse(query, {sort: false});
	const elapsedTime = performance.now() - startTime;

	assert.deepEqual(structuredClone(parsed), {});
	assert.ok(elapsedTime < 1000, `Expected empty parameter parsing to avoid split allocation. Took ${elapsedTime}ms.`);
});

test('handle multiple values and preserve appearence order', () => {
	assert.deepEqual(structuredClone(queryString.parse('a=value&a=')), {a: ['value', '']});
	assert.deepEqual(structuredClone(queryString.parse('a=&a=value')), {a: ['', 'value']});
});

test('handle multiple values and preserve appearance order with brackets', () => {
	assert.deepEqual(structuredClone(queryString.parse('a[]=value&a[]=', {arrayFormat: 'bracket'})), {a: ['value', '']});
	assert.deepEqual(structuredClone(queryString.parse('a[]=&a[]=value', {arrayFormat: 'bracket'})), {a: ['', 'value']});
});

test('handle multiple values and preserve appearance order with indexes', () => {
	assert.deepEqual(structuredClone(queryString.parse('a[0]=value&a[1]=', {arrayFormat: 'index'})), {a: ['value', '']});
	assert.deepEqual(structuredClone(queryString.parse('a[1]=&a[0]=value', {arrayFormat: 'index'})), {a: ['value', '']});
});

test('query strings params including embedded `=`', () => {
	const value = 'https://someurl?id=2837';
	const query = `param=${encodeURIComponent(value)}`;
	assert.deepEqual(structuredClone(queryString.parse(query)), {param: 'https://someurl?id=2837'});
});

test('object properties', () => {
	assert.ok(!(queryString.parse().prototype));
	assert.deepEqual(structuredClone(queryString.parse('hasOwnProperty=foo')), {hasOwnProperty: 'foo'});
});

test('query strings having indexed arrays', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=bar&foo[1]=baz')), {'foo[0]': 'bar', 'foo[1]': 'baz'});
});

test('query strings having brackets arrays', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=bar&foo[]=baz')), {'foo[]': ['bar', 'baz']});
});

test('query strings having indexed arrays keeping index order', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=bar&foo[0]=baz')), {'foo[1]': 'bar', 'foo[0]': 'baz'});
});

test('query string having a single bracketed value and format option as `bracket`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=bar', {arrayFormat: 'bracket'})), {foo: ['bar']});
});

test('query string not having a bracketed value and format option as `bracket`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar', {arrayFormat: 'bracket'})), {foo: 'bar'});
});

test('query string having a bracketed value and a single value and format option as `bracket`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar&baz[]=bar', {arrayFormat: 'bracket'})), {foo: 'bar', baz: ['bar']});
});

test('query strings having brackets arrays and format option as `bracket`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=bar&foo[]=baz', {
		arrayFormat: 'bracket',
	})), {foo: ['bar', 'baz']});
});

test('query strings having comma separated arrays and format option as `comma`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar,baz', {
		arrayFormat: 'comma',
	})), {foo: ['bar', 'baz']});
});

test('query strings having pipe separated arrays and format option as `separator`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar|baz', {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
	})), {foo: ['bar', 'baz']});
});

test('single value with encoded separator should not be split into array', () => {
	// Test for issue #336 - encoded separators should not cause array splitting
	const value = encodeURIComponent('a|b'); // 'a%7Cb'
	assert.deepEqual(structuredClone(queryString.parse(`foo=${value}`, {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
	})), {foo: 'a|b'});

	// Multiple values with encoded separators in them
	const value1 = encodeURIComponent('a|b');
	const value2 = encodeURIComponent('c|d');
	assert.deepEqual(structuredClone(queryString.parse(`foo=${value1}|${value2}`, {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
	})), {foo: ['a|b', 'c|d']});
});

test('query strings having percent-encoded array markers in the key', () => {
	// The key is decoded before the array marker is checked, like `URLSearchParams`, Rack, and PHP do. `new URLSearchParams({'foo[]': 1}).toString()` gives `foo%5B%5D=1`.
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=1&foo%5B%5D=2', {arrayFormat: 'bracket'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=1&foo[]=2', {arrayFormat: 'bracket'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D', {arrayFormat: 'bracket'})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B0%5D=a&foo%5B1%5D=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B1%5D=b&foo[0]=a', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=1|2', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D', {arrayFormat: 'bracket-separator'})), {foo: []});
	assert.deepEqual(structuredClone(queryString.parse('foo%3Alist=1&foo%3Alist=2', {arrayFormat: 'colon-list-separator'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('a%20b%5B%5D=1', {arrayFormat: 'bracket'})), {'a b': ['1']});

	// The marker is not decoded without `decode`, so it is a plain key then.
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=1', {arrayFormat: 'bracket', decode: false})), {'foo%5B%5D': '1'});

	// Without an array format, the decoded marker is part of the key.
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=1')), {'foo[]': '1'});

	// The trade-off: a key that itself ends in a marker cannot be told apart from the marker after decoding.
	assert.equal(queryString.stringify({'foo[]': 'x'}, {arrayFormat: 'bracket'}), 'foo%5B%5D=x');
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=x', {arrayFormat: 'bracket'})), {foo: ['x']});
});

test('query strings having brackets arrays with null and format option as `bracket`', () => {
	assert.deepEqual(structuredClone(queryString.parse('bar[]&foo[]=a&foo[]&foo[]=', {
		arrayFormat: 'bracket',
	})), {
		foo: ['a', null, ''],
		bar: [null],
	});
});

test('query strings having comma separated arrays with null and format option as `comma`', () => {
	assert.deepEqual(structuredClone(queryString.parse('bar&foo=a,', {
		arrayFormat: 'comma',
	})), {
		foo: ['a', ''],
		bar: null,
	});
});

test('query strings having indexed arrays and format option as `index`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=bar&foo[1]=baz', {
		arrayFormat: 'index',
	})), {foo: ['bar', 'baz']});
});

test('query strings having brackets+separator arrays and format option as `bracket-separator` with 1 value', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=bar', {
		arrayFormat: 'bracket-separator',
	})), {foo: ['bar']});
});

test('query strings having brackets+separator arrays and format option as `bracket-separator` with multiple values', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=bar,baz,,,biz', {
		arrayFormat: 'bracket-separator',
	})), {foo: ['bar', 'baz', '', '', 'biz']});
});

test('query strings with multiple brackets+separator arrays and format option as `bracket-separator` using same key name', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=bar,baz&foo[]=biz,boz', {
		arrayFormat: 'bracket-separator',
	})), {foo: ['bar', 'baz', 'biz', 'boz']});
});

test('query strings having an empty brackets+separator array and format option as `bracket-separator`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]', {
		arrayFormat: 'bracket-separator',
	})), {foo: []});
});

test('query strings having a brackets+separator array and format option as `bracket-separator` with a single empty string', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=', {
		arrayFormat: 'bracket-separator',
	})), {foo: ['']});
});

test('query strings having a brackets+separator array and format option as `bracket-separator` with a URL encoded value', () => {
	// A percent-encoded separator is part of the item, not a separator. See https://github.com/sindresorhus/query-string/issues/398
	const key = 'foo[]';
	const value = 'a,b,c,d,e,f';
	const query = `?${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
	assert.deepEqual(structuredClone(queryString.parse(query, {
		arrayFormat: 'bracket-separator',
	})), {
		foo: ['a,b,c,d,e,f'],
	});
});

test('query strings having a brackets+separator array and format option as `bracket-separator` with an encoded separator inside an item', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a%2Cb,c', {arrayFormat: 'bracket-separator'})), {foo: ['a,b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=%2C', {arrayFormat: 'bracket-separator'})), {foo: [',']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a%7Cb|c', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'})), {foo: ['a|b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a%2Cb,c', {arrayFormat: 'bracket-separator', decode: false})), {foo: ['a%2Cb', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a%2Cb,c&foo[]=d%2Ce', {arrayFormat: 'bracket-separator'})), {foo: ['a,b', 'c', 'd,e']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1%2C2,3', {arrayFormat: 'bracket-separator', parseNumbers: true})), {foo: ['1,2', 3]});
});

test('`bracket-separator` round-trips items containing the separator', () => {
	for (const arrayFormatSeparator of [',', '|', ';']) {
		const options = {arrayFormat: 'bracket-separator', arrayFormatSeparator};
		const object = {foo: [`a${arrayFormatSeparator}b`, 'c', arrayFormatSeparator, ''], bar: [arrayFormatSeparator]};
		const stringified = queryString.stringify(object, options);
		assert.deepEqual(structuredClone(queryString.parse(stringified, options)), object, `separator: ${arrayFormatSeparator}`);
	}
});

test('`bracket-separator` handles encoded separators the same way as `comma` and `separator`', () => {
	const separator = queryString.parse('foo=a%2Cb,c', {arrayFormat: 'separator'});
	const comma = queryString.parse('foo=a%2Cb,c', {arrayFormat: 'comma'});
	const bracketSeparator = queryString.parse('foo[]=a%2Cb,c', {arrayFormat: 'bracket-separator'});
	assert.deepEqual(structuredClone(separator), {foo: ['a,b', 'c']});
	// These two compare one parse result against another, so the expected side
	// needs the same treatment as the actual side.
	assert.deepEqual(structuredClone(comma), structuredClone(separator));
	assert.deepEqual(structuredClone(bracketSeparator), structuredClone(separator));
});

test('query strings having = within parameters (i.e. GraphQL IDs)', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=bar=&foo=ba=z=')), {foo: ['bar=', 'ba=z=']});
});

test('query strings having ordered index arrays and format option as `index`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=bar&foo[0]=baz&foo[3]=one&foo[2]=two', {
		arrayFormat: 'index',
	})), {foo: ['baz', 'bar', 'two', 'one']});

	assert.deepEqual(structuredClone(queryString.parse('foo[0]=bar&foo[1]=baz&foo[2]=one&foo[3]=two', {
		arrayFormat: 'index',
	})), {foo: ['bar', 'baz', 'one', 'two']});

	assert.deepEqual(structuredClone(queryString.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero', {
		arrayFormat: 'index',
	})), {foo: ['zero', 'one', 'two', 'three']});

	assert.deepEqual(structuredClone(queryString.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index',
	})), {foo: ['zero', 'one', 'two', 'three'], bat: 'buz'});

	assert.deepEqual(structuredClone(queryString.parse('foo[1]=bar&foo[0]=baz', {
		arrayFormat: 'index',
	})), {foo: ['baz', 'bar']});

	assert.deepEqual(structuredClone(queryString.parse('foo[102]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index',
	})), {bat: 'buz', foo: ['zero', 'one', 'two', 'three']});

	assert.deepEqual(structuredClone(queryString.parse('foo[102]=three&foo[2]=two&foo[100]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index',
	})), {bat: 'buz', foo: ['zero', 'two', 'one', 'three']});
});

test('circuit parse → stringify', () => {
	const original = 'foo[3]=foo&foo[2]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const expected = {bat: 'buz', foo: ['', 'one', null, 'foo']};
	const options = {
		arrayFormat: 'index',
	};

	assert.deepEqual(structuredClone(queryString.parse(original, options)), expected);

	assert.equal(queryString.stringify(expected, options), sortedOriginal);
});

test('circuit original → parse → stringify → sorted original', () => {
	const original = 'foo[21474836471]=foo&foo[21474836470]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const options = {
		arrayFormat: 'index',
	};

	assert.equal(queryString.stringify(queryString.parse(original, options), options), sortedOriginal);
});

test('circuit parse → stringify with array commas', () => {
	const original = 'c=,a,,&b=&a=';
	const sortedOriginal = 'a=&b=&c=,a,,';
	const expected = {
		c: ['', 'a', '', ''],
		b: '',
		a: '',
	};
	const options = {
		arrayFormat: 'comma',
	};

	assert.deepEqual(structuredClone(queryString.parse(original, options)), expected);

	assert.equal(queryString.stringify(expected, options), sortedOriginal);
});

test('circuit original → parse → stringify with array commas → sorted original', () => {
	const original = 'c=,a,,&b=&a=';
	const sortedOriginal = 'a=&b=&c=,a,,';
	const options = {
		arrayFormat: 'comma',
	};

	assert.equal(queryString.stringify(queryString.parse(original, options), options), sortedOriginal);
});

test('decode keys and values', () => {
	assert.deepEqual(structuredClone(queryString.parse('st%C3%A5le=foo')), {ståle: 'foo'});
	// `%ab` and `%de` are continuation bytes with no lead byte, so each is one replacement character. The `%` around them is not an escape and is kept.
	assert.deepEqual(structuredClone(queryString.parse('foo=%7B%ab%%7C%de%%7D+%%7Bst%C3%A5le%7D%')), {foo: '{�%|�%} %{ståle}%'});
});

test('a byte that is not valid UTF-8 becomes the replacement character', () => {
	// The built-in decoder throws away the whole value for one bad byte, so the value is decoded a lenient way instead, like the `URL` parser and `URLSearchParams` do.
	const cases = [
		// A sequence that is cut short. The lead byte and the continuation bytes that were read are consumed together, so this is one replacement character and not one per byte.
		['%E4', '�'],
		['%E4%B8', '�'],
		['%E4%80%41', '�A'],
		['%C3', '�'],
		// A lead byte that can only ever start an invalid sequence: an overlong encoding, a surrogate, or a code point above U+10FFFF.
		['%C0%80', '��'],
		['%C1%BF', '��'],
		['%ED%A0%80', '���'],
		['%F5%80%80%80', '����'],
		['%FF', '�'],
		// A `%` that does not start an escape is not a byte and is kept as it is.
		['%', '%'],
		['%2', '%2'],
		['%z', '%z'],
		// A decoded byte is not decoded again, so `%25` gives a `%` and not a space.
		['%2525%E25', '%25�5'],
		// The characters around an invalid byte are still decoded.
		['a%E4b', 'a�b'],
		['%E4%80%80%80%41', '䀀�A'],
	];

	for (const [value, expected] of cases) {
		assert.equal(queryString.parse(`foo=${value}`).foo, expected, `value: ${value}`);
	}
});

test('a raw character next to an invalid escape is kept', () => {
	// The raw character is not part of the UTF-8 sequence, so it is decoded on its own. The `URL` parser agrees, so this is the WHATWG behavior. Only the `URLSearchParams` constructor loses it, and that is a bug in it: `new URLSearchParams('a=%E4中').get('a')` gives `�-`, with a hyphen that is not in the input at all.
	assert.equal(queryString.parse('foo=%E4å').foo, '�å');
	assert.equal(queryString.parse('foo=å%E4').foo, 'å�');
});

test('the edges of what a UTF-8 sequence may encode are checked', () => {
	// A sequence that is the right length can still be out of range. The lead byte and the first continuation byte are the only place the range is narrowed, so each edge is checked here.
	const cases = [
		// An overlong encoding is a shorter sequence for a code point that has a longer one. It is not the same character, so it is rejected.
		['%C0%80', '��', 'the lowest two-byte lead is 0xC2, so 0xC0 is only ever an overlong encoding'],
		['%C1%BF', '��', 'the same for 0xC1'],
		['%E0%80%80', '���', 'the lowest three-byte lead is 0xE0, whose second byte may not be below 0xA0'],
		['%E0%9F%BF', '���', 'the same for one below 0xA0'],
		['%E0%A0%80', 'ࠀ', '0xA0 is the lowest second byte that 0xE0 may take'],
		['%F0%80%80%80', '����', 'the lowest four-byte lead is 0xF0, whose second byte may not be below 0x90'],
		['%F0%8F%BF%BF', '����', 'the same for one below 0x90'],
		['%F0%90%80%80', '𐀀', '0x90 is the lowest second byte that 0xF0 may take, which is the first astral code point'],
		// A surrogate is not a character, so no sequence may encode one.
		['%ED%9F%BF', '퟿', 'the highest code point below the surrogates'],
		['%ED%A0%80', '���', '0xED may not take a second byte of 0xA0 or above'],
		['%ED%BF%BF', '���', 'the same for 0xBF'],
		// U+10FFFF is the highest code point there is. A sequence above it is not a Unicode scalar value, and `String.fromCodePoint()` throws for it, so this case must not reach that.
		['%F4%8F%BF%BF', '􏿿', 'the highest code point there is'],
		['%F4%90%80%80', '����', '0xF4 may not take a second byte above 0x8F'],
		['%F4%BF%BF%BF', '����', 'the same for 0xBF'],
		['%F5%80%80%80', '����', '0xF5 can only ever start a code point above U+10FFFF'],
		['%FF', '�', '0xFF is not a lead byte at all'],
	];

	for (const [value, expected, reason] of cases) {
		assert.equal(queryString.parse(`foo=${value}`).foo, expected, `${value} (${reason})`);
	}
});

test('a value that encodes a code point above U+10FFFF is decoded, not thrown on', () => {
	// Without the range check the sequence would decode to a code point that `String.fromCodePoint()` rejects with a `RangeError`, so `parse()` would throw on a value from the network instead of decoding it. Each of these becomes one replacement character per byte.
	const cases = [
		['%F4%90%80%80', 4],
		['%F5%80%80%80', 4],
		['%F7%BF%BF%BF', 4],
		['%FF%FF%FF%FF', 4],
		// Two three-byte sequences, so six.
		['%ED%A0%80%ED%B0%80', 6],
	];

	for (const [value, count] of cases) {
		assert.equal(queryString.parse(`foo=${value}`).foo, '�'.repeat(count), `value: ${value}`);
	}
});

test('disable decoding of keys and values', () => {
	const value = 'postal office,burger, fries and coke';
	const query = `tags=${encodeURIComponent(value)}`;
	assert.deepEqual(structuredClone(queryString.parse(query, {decode: false})), {tags: 'postal%20office%2Cburger%2C%20fries%20and%20coke'});
});

test('number value returns as string by default', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=1')), {foo: '1'});
});

test('number value returns as number if option is set', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {parseNumbers: true})), {foo: 1});
	assert.deepEqual(structuredClone(queryString.parse('foo=12.3&bar=123e-1', {parseNumbers: true})), {foo: 12.3, bar: 12.3});
	assert.deepEqual(structuredClone(queryString.parse('foo=0x11&bar=12.00', {parseNumbers: true})), {foo: 17, bar: 12});
});

test('NaN value returns as string if option is set', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=null', {parseNumbers: true})), {foo: 'null'});
	assert.deepEqual(structuredClone(queryString.parse('foo=undefined', {parseNumbers: true})), {foo: 'undefined'});
	assert.deepEqual(structuredClone(queryString.parse('foo=100a&bar=100', {parseNumbers: true})), {foo: '100a', bar: 100});
	assert.deepEqual(structuredClone(queryString.parse('foo=   &bar=', {parseNumbers: true})), {foo: ' '.repeat(3), bar: ''});
});

test('parseNumbers works with arrayFormat', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo[]=2&foo[]=3&bar=1', {parseNumbers: true, arrayFormat: 'bracket'})), {foo: [1, 2, 3], bar: 1});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2,a', {parseNumbers: true, arrayFormat: 'comma'})), {foo: [1, 2, 'a']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1|2|a', {parseNumbers: true, arrayFormat: 'separator', arrayFormatSeparator: '|'})), {foo: [1, 2, 'a']});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo[1]=2&foo[2]', {parseNumbers: true, arrayFormat: 'index'})), {foo: [1, 2, null]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2&foo=3', {parseNumbers: true})), {foo: [1, 2, 3]});
});

test('boolean value returns as string by default', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=true')), {foo: 'true'});
});

test('boolean value returns as boolean if option is set', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=true', {parseBooleans: true})), {foo: true});
	assert.deepEqual(structuredClone(queryString.parse('foo=false&bar=true', {parseBooleans: true})), {foo: false, bar: true});
});

test('parseBooleans works with arrayFormat', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[]=true&foo[]=false&foo[]=true&bar=1', {parseBooleans: true, arrayFormat: 'bracket'})), {foo: [true, false, true], bar: '1'});
	assert.deepEqual(structuredClone(queryString.parse('foo=true,false,a', {parseBooleans: true, arrayFormat: 'comma'})), {foo: [true, false, 'a']});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=true&foo[1]=false&foo[2]', {parseBooleans: true, arrayFormat: 'index'})), {foo: [true, false, null]});
	assert.deepEqual(structuredClone(queryString.parse('foo=true&foo=false&foo=3', {parseBooleans: true})), {foo: [true, false, '3']});
});

test('boolean value returns as boolean and number value as number if both options are set', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=true&bar=1.12', {parseNumbers: true, parseBooleans: true})), {foo: true, bar: 1.12});
	assert.deepEqual(structuredClone(queryString.parse('foo=16.32&bar=false', {parseNumbers: true, parseBooleans: true})), {foo: 16.32, bar: false});
});

test('parseNumbers and parseBooleans can work with arrayFormat at the same time', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=true&foo=false&bar=1.12&bar=2', {parseNumbers: true, parseBooleans: true})), {foo: [true, false], bar: [1.12, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=true&foo[]=false&foo[]=true&bar[]=1&bar[]=2', {parseNumbers: true, parseBooleans: true, arrayFormat: 'bracket'})), {foo: [true, false, true], bar: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=true,false&bar=1,2', {parseNumbers: true, parseBooleans: true, arrayFormat: 'comma'})), {foo: [true, false], bar: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=true&foo[1]=false&bar[0]=1&bar[1]=2', {parseNumbers: true, parseBooleans: true, arrayFormat: 'index'})), {foo: [true, false], bar: [1, 2]});
});

test('parse throws TypeError for invalid arrayFormatSeparator', () => {
	assert.throws(() => {
		queryString.parse('', {arrayFormatSeparator: ',,'});
	}, TypeError);

	assert.throws(() => {
		queryString.parse('', {arrayFormatSeparator: []});
	}, TypeError);
});

test('query strings having comma encoded and format option as `comma`', () => {
	const values = ['zero,one', 'two,three'];
	const query = `foo=${encodeURIComponent(values[0])},${encodeURIComponent(values[1])}`;
	assert.deepEqual(structuredClone(queryString.parse(query, {arrayFormat: 'comma'})), {
		foo: [
			'zero,one',
			'two,three',
		],
	});
});

test('value should not be decoded twice with `arrayFormat` option set as `separator`', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=2020-01-01T00:00:00%2B03:00', {arrayFormat: 'separator'})), {
		foo: '2020-01-01T00:00:00+03:00',
	});
});

// See https://github.com/sindresorhus/query-string/issues/242
test('value separated by encoded comma will not be parsed as array with `arrayFormat` option set to `comma`', () => {
	const value = '1,2,3';
	const query = `id=${encodeURIComponent(value)}`;
	assert.deepEqual(structuredClone(queryString.parse(query, {arrayFormat: 'comma', parseNumbers: true})), {
		id: '1,2,3',
	});
});

test('query strings having (:list) colon-list-separator arrays', () => {
	assert.deepEqual(structuredClone(queryString.parse('bar:list=one&bar:list=two', {arrayFormat: 'colon-list-separator'})), {bar: ['one', 'two']});
});

test('query strings having (:list) colon-list-separator arrays including null values', () => {
	assert.deepEqual(structuredClone(queryString.parse('bar:list=one&bar:list=two&foo', {arrayFormat: 'colon-list-separator'})), {bar: ['one', 'two'], foo: null});
});

test('types option: can override a parsed number to be a string', () => {
	const phoneNumber = '+380951234567';
	const query = `phoneNumber=${encodeURIComponent(phoneNumber)}`;
	assert.deepEqual(structuredClone(queryString.parse(query, {
		parseNumbers: true,
		types: {
			phoneNumber: 'string',
		},
	})), {phoneNumber: '+380951234567'});
});

test('types option: can override a parsed boolean value to be a string', () => {
	assert.deepEqual(structuredClone(queryString.parse('question=true', {
		parseBooleans: true,
		types: {
			question: 'string',
		},
	})), {
		question: 'true',
	});
});

test('types option: can override parsed numbers arrays to be string[]', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=999,998,997&items=1,2,3', {
		arrayFormat: 'comma',
		parseNumbers: true,
		types: {
			ids: 'string[]',
		},
	})), {
		ids: ['999', '998', '997'],
		items: [1, 2, 3],
	});
});

test('types option: can override string arrays to be number[]', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=1,2,3&items=1,2,3', {
		arrayFormat: 'comma',
		types: {
			ids: 'number[]',
		},
	})), {
		ids: [1, 2, 3],
		items: ['1', '2', '3'],
	});
});

test('types option: can override an array to be string', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=001,002,003&items=1,2,3', {
		arrayFormat: 'comma',
		parseNumbers: true,
		types: {
			ids: 'string',
		},
	})), {
		ids: '001,002,003',
		items: [1, 2, 3],
	});
});

test('types option: can override a separator array to be string', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=001|002|003&items=1|2|3', {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
		parseNumbers: true,
		types: {
			ids: 'string',
		},
	})), {
		ids: '001|002|003',
		items: [1, 2, 3],
	});
});

test('types option: when value is not of specified type, it will safely parse the value as string', () => {
	assert.deepEqual(structuredClone(queryString.parse('id=example', {
		types: {
			id: 'number',
		},
	})), {
		id: 'example',
	});
});

test('types option: array types will have no effect if arrayFormat is set to "none"', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=001,002,003&foods=apple,orange,mango', {
		arrayFormat: 'none',
		types: {
			ids: 'number[]',
			foods: 'string[]',
		},
	})), {
		ids: '001,002,003',
		foods: 'apple,orange,mango',
	});
});

test('types option: will parse the value as number if specified in type but parseNumbers is false', () => {
	assert.deepEqual(structuredClone(queryString.parse('id=123', {
		arrayFormat: 'comma',
		types: {
			id: 'number',
		},
	})), {
		id: 123,
	});
});

test('types option: all supported types work in conjunction with one another', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=001,002,003&items=1,2,3&price=22.00&numbers=1,2,3&double=5&number=20', {
		arrayFormat: 'comma',
		types: {
			ids: 'string',
			items: 'string[]',
			price: 'string',
			numbers: 'number[]',
			double: value => value * 2,
			number: 'number',
		},
	})), {
		ids: '001,002,003',
		items: ['1', '2', '3'],
		price: '22.00',
		numbers: [1, 2, 3],
		double: 10,
		number: 20,
	});
});

test('types option: single element with `{arrayFormat: "comma"} and type: string[]`', () => {
	assert.deepEqual(structuredClone(queryString.parse('a=b', {
		arrayFormat: 'comma',
		types: {
			a: 'string[]',
		},
	})), {
		a: ['b'],
	});
});

test('types option: single element with `{arrayFormat: "comma"}, and type: number[]`', () => {
	assert.deepEqual(structuredClone(queryString.parse('a=1', {
		arrayFormat: 'comma',
		types: {
			a: 'number[]',
		},
	})), {
		a: [1],
	});
});

test('types option: can parse boolean when parseboolean is false', () => {
	assert.deepEqual(structuredClone(queryString.parse('a=true', {
		parsebooleans: false,
		types: {
			a: 'boolean',
		},
	})), {
		a: true,
	});
});

test('types option: boolean type accepts 1 and 0 as boolean values', () => {
	assert.deepEqual(structuredClone(queryString.parse('a=1&b=0', {
		parsebooleans: false,
		types: {
			a: 'boolean',
			b: 'boolean',
		},
	})), {
		a: true,
		b: false,
	});
});

test('types option: boolean type accepts an empty string as true', () => {
	assert.deepEqual(structuredClone(queryString.parse('a&b', {
		parsebooleans: false,
		types: {
			a: 'boolean',
			b: 'boolean',
		},
	})), {
		a: true,
		b: true,
	});
});

test('types option: function types with arrays apply to each element', () => {
	// Test with comma format
	assert.deepEqual(structuredClone(queryString.parse('scores=10,20,30', {
		arrayFormat: 'comma',
		types: {
			scores: value => Number(value) * 2,
		},
	})), {
		scores: [20, 40, 60],
	});

	// Test with bracket format
	assert.deepEqual(structuredClone(queryString.parse('scores[]=5&scores[]=10&scores[]=15', {
		arrayFormat: 'bracket',
		types: {
			scores: value => Number(value) + 10,
		},
	})), {
		scores: [15, 20, 25],
	});

	// Test with separator format
	assert.deepEqual(structuredClone(queryString.parse('scores=1|2|3', {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
		types: {
			scores: value => `item-${value}`,
		},
	})), {
		scores: ['item-1', 'item-2', 'item-3'],
	});

	// Test function with single value still works
	assert.deepEqual(structuredClone(queryString.parse('score=42', {
		types: {
			score: value => Number(value) / 2,
		},
	})), {
		score: 21,
	});

	// Test mixed types in same query
	assert.deepEqual(structuredClone(queryString.parse('nums=1,2,3&single=10', {
		arrayFormat: 'comma',
		types: {
			nums: value => Number(value) * 3,
			single: value => Number(value) * 2,
		},
	})), {
		nums: [3, 6, 9],
		single: 20,
	});
});

test('types option: a value that is not a supported type is ignored for an array too', () => {
	// The type is invalid, but the scalar path ignored it, while the array path called `.replace()` on it and threw.
	for (const invalid of [1, null, true, {}]) {
		assert.deepEqual(structuredClone(queryString.parse('a=1&a=2', {types: {a: invalid}})), {a: ['1', '2']}, `array: ${JSON.stringify(invalid)}`);
		assert.deepEqual(structuredClone(queryString.parse('a=1', {types: {a: invalid}})), {a: '1'}, `scalar: ${JSON.stringify(invalid)}`);
	}

	// The valid types still apply to each item.
	assert.deepEqual(structuredClone(queryString.parse('a=1&a=2', {types: {a: 'number[]'}})), {a: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('a=1&a=2', {types: {a: value => `<${value}>`}})), {a: ['<1>', '<2>']});
});

test('types option: does not treat `Object.prototype` keys as custom types', () => {
	assert.deepEqual(structuredClone(queryString.parse('toString=1&a=2', {types: {}})), {a: '2', toString: '1'});
	assert.deepEqual(structuredClone(queryString.parse('valueOf=hello', {types: {}})), {valueOf: 'hello'});
	assert.deepEqual(structuredClone(queryString.parse('hasOwnProperty=x', {types: {}})), {hasOwnProperty: 'x'});
	assert.deepEqual(structuredClone(queryString.parse('constructor=1', {types: {}})), {constructor: '1'});
	assert.deepEqual(structuredClone(queryString.parse('toString[]=1&toString[]=2', {arrayFormat: 'bracket', types: {}})), {toString: ['1', '2']});
});

test('parse index array format when sort is false', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=b&foo[0]=a&bar=baz', {arrayFormat: 'index', sort: false})), {foo: ['a', 'b'], bar: 'baz'});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=a', {arrayFormat: 'index', sort: false})), {foo: ['a']});
});

test('parse index array format when sort is false with types', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=2&foo[0]=1', {arrayFormat: 'index', sort: false, types: {foo: 'number[]'}})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=2&foo[0]=1', {arrayFormat: 'index', sort: false, types: {foo: value => `${value}!`}})), {foo: ['1!', '2!']});
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=2&foo[0]=1', {arrayFormat: 'index', sort: false, parseNumbers: true})), {foo: [1, 2]});
});

test('parse index array format when sort is false with null and empty values', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[2]&foo[0]=&foo[1]=one', {arrayFormat: 'index', sort: false})), {foo: ['', 'one', null]});
});

test('parse index array format with a custom sort function', () => {
	const sort = (key1, key2) => key2.localeCompare(key1);
	const parsed = queryString.parse('bar=x&foo[1]=b&foo[0]=a', {arrayFormat: 'index', sort});
	assert.deepEqual(structuredClone(parsed), {foo: ['a', 'b'], bar: 'x'});
	assert.deepEqual(structuredClone(Object.keys(parsed)), ['foo', 'bar']);
});

test('index array format does not throw when a scalar precedes the indexed entries', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo&foo[0]=2', {arrayFormat: 'index'})), {foo: [null, '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=&foo[0]=2', {arrayFormat: 'index'})), {foo: ['', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[1]=3&foo[0]=2&bar=x', {arrayFormat: 'index'})), {foo: ['1', '2', '3'], bar: 'x'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', sort: false})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', types: {foo: 'number[]'}})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', types: {foo: 'string'}})), {foo: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', parseNumbers: true})), {foo: [1, 2]});
});

test('index array format preserves distinct explicit index strings', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo[01]=a&foo[1]=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo[9007199254740992]=a&foo[9007199254740993]=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo[01]=a&foo[01]=b', {arrayFormat: 'index'})), {foo: ['b']});
});

test('index array format appends entries without an index', () => {
	// `foo[]` is what PHP and Rack write for an array item without an index, and it is what `arrayFormat: 'bracket'` produces. Every such entry landed on the same empty index and silently overrode the previous one.
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo[]=2&foo[]=3', {arrayFormat: 'index'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1', {arrayFormat: 'index'})), {foo: ['1']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]', {arrayFormat: 'index'})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo[]&foo[]=1&foo[]=', {arrayFormat: 'index'})), {foo: [null, '1', '']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B%5D=1&foo%5B%5D=2', {arrayFormat: 'index'})), {foo: ['1', '2']});

	// Entries without an index take the next free index, like in PHP.
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=a&foo[]=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a&foo[1]=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a&foo[0]=b', {arrayFormat: 'index'})), {foo: ['b']});
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=b&foo[]=c&foo[0]=a', {arrayFormat: 'index'})), {foo: ['a', 'b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a&foo[]=b&foo[1]=c', {arrayFormat: 'index'})), {foo: ['a', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo[5]=a&foo[]=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});

	// A plain value before the entries is the first item, like for indexed entries.
	assert.deepEqual(structuredClone(queryString.parse('foo=a&foo[]=b&foo[]=c', {arrayFormat: 'index'})), {foo: ['a', 'b', 'c']});

	// Other keys are not affected, and the other options still apply.
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&bar[]=2&foo[]=3', {arrayFormat: 'index'})), {foo: ['1', '3'], bar: ['2']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', sort: false})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', parseNumbers: true})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', types: {foo: 'number[]'}})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', types: {foo: 'string'}})), {foo: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=a%20b&foo[]=c', {arrayFormat: 'index', decode: false})), {foo: ['a%20b', 'c']});

	// A bracket-format URL survives the URL helpers with the index format.
	assert.equal(queryString.pick('https://foo.bar?foo[]=1&foo[]=2&bar=3', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo[]=1&foo[]=2', query: {bar: 3}}, {arrayFormat: 'index'}), 'https://foo.bar?bar=3&foo[0]=1&foo[1]=2');
});

test('types option: an explicit type takes precedence over `parseNumbers` and `parseBooleans` when the value does not match the type', () => {
	assert.deepEqual(structuredClone(queryString.parse('id=true', {types: {id: 'number'}, parseBooleans: true})), {id: 'true'});
	assert.deepEqual(structuredClone(queryString.parse('id=abc', {types: {id: 'number'}, parseBooleans: true, parseNumbers: true})), {id: 'abc'});
	assert.deepEqual(structuredClone(queryString.parse('flag=2', {types: {flag: 'boolean'}, parseNumbers: true})), {flag: '2'});
	assert.deepEqual(structuredClone(queryString.parse('flag=yes', {types: {flag: 'boolean'}, parseNumbers: true, parseBooleans: true})), {flag: 'yes'});
	assert.deepEqual(structuredClone(queryString.parse('ids=1,true', {arrayFormat: 'comma', types: {ids: 'number[]'}, parseBooleans: true})), {ids: [1, 'true']});
	assert.deepEqual(structuredClone(queryString.parse('ids=1&ids=true', {types: {ids: 'number[]'}, parseBooleans: true})), {ids: [1, 'true']});
	assert.deepEqual(structuredClone(queryString.parse('ids=1&ids=2', {types: {ids: 'number[]'}})), {ids: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('ids=1,2', {types: {ids: 'number[]'}})), {ids: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('ids=1', {types: {ids: 'number[]'}})), {ids: '1'});
	assert.deepEqual(structuredClone(queryString.parse('flags=true&flags=2', {types: {flags: 'boolean'}, parseNumbers: true})), {flags: [true, '2']});
	assert.deepEqual(structuredClone(queryString.parse('id[]=true', {arrayFormat: 'bracket', types: {id: 'number[]'}, parseBooleans: true})), {id: ['true']});
});

test('types option: matching values are still parsed with an explicit type alongside `parseNumbers` and `parseBooleans`', () => {
	assert.deepEqual(structuredClone(queryString.parse('id=1&flag=true&other=2&text=3', {
		types: {
			id: 'number',
			flag: 'boolean',
			text: 'string',
		},
		parseNumbers: true,
		parseBooleans: true,
	})), {
		id: 1,
		flag: true,
		other: 2,
		text: '3',
	});
	assert.deepEqual(structuredClone(queryString.parse('flag', {types: {flag: 'boolean'}, parseNumbers: true})), {flag: true});
	assert.deepEqual(structuredClone(queryString.parse('id', {types: {id: 'number'}, parseBooleans: true})), {id: null});
});

test('types option: `number[]` wraps a single value that is not a number in an array', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: ['abc']});
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'separator', arrayFormatSeparator: '|', types: {ids: 'number[]'}})), {ids: ['abc']});
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'bracket', types: {ids: 'number[]'}})), {ids: ['abc']});
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'index', types: {ids: 'number[]'}})), {ids: ['abc']});
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'bracket-separator', types: {ids: 'number[]'}})), {ids: ['abc']});
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'colon-list-separator', types: {ids: 'number[]'}})), {ids: ['abc']});
	assert.deepEqual(structuredClone(queryString.parse('ids=', {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: ['']});
	assert.deepEqual(structuredClone(queryString.parse('ids=true', {arrayFormat: 'comma', types: {ids: 'number[]'}, parseBooleans: true})), {ids: ['true']});
	assert.deepEqual(structuredClone(queryString.parse('ids=1', {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: [1]});
	assert.deepEqual(structuredClone(queryString.parse('ids=abc', {arrayFormat: 'none', types: {ids: 'number[]'}})), {ids: 'abc'});
	assert.deepEqual(structuredClone(queryString.parse('ids', {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: [null]});
});

test('comma and separator array formats keep the values of a repeated key', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'comma'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2,3&foo=4,5', {arrayFormat: 'comma'})), {foo: ['1', '2', '3', '4', '5']});
	assert.deepEqual(structuredClone(queryString.parse('foo&foo=1', {arrayFormat: 'comma'})), {foo: [null, '1']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo', {arrayFormat: 'comma'})), {foo: ['1', null]});
	assert.deepEqual(structuredClone(queryString.parse('foo=a%2Cb&foo=c', {arrayFormat: 'comma'})), {foo: ['a,b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1|2&foo=3', {arrayFormat: 'separator', arrayFormatSeparator: '|'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2&foo=3&bar=4', {arrayFormat: 'comma', parseNumbers: true})), {foo: [1, 2, 3], bar: 4});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma', types: {foo: 'string'}})), {foo: '1,2,3'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'comma', sort: false})), {foo: ['1', '2']});
});

test('comma and separator array formats still parse a single key', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'comma'})), {foo: '1'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2', {arrayFormat: 'comma'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'comma'})), {foo: null});
	assert.deepEqual(structuredClone(queryString.parse('foo=', {arrayFormat: 'comma'})), {foo: ''});
});

test('types option: explicit types combined with `parseNumbers` and `parseBooleans` edge cases', () => {
	assert.deepEqual(structuredClone(queryString.parse('flag=0', {types: {flag: 'boolean'}, parseNumbers: true})), {flag: false});
	assert.deepEqual(structuredClone(queryString.parse('flag=1', {types: {flag: 'boolean'}, parseNumbers: true})), {flag: true});
	assert.deepEqual(structuredClone(queryString.parse('x=true', {types: {x: value => `fn:${value}`}, parseBooleans: true})), {x: 'fn:true'});
	assert.deepEqual(structuredClone(queryString.parse('id=', {types: {id: 'number'}, parseNumbers: true})), {id: ''});
	assert.deepEqual(structuredClone(queryString.parse('id', {types: {id: 'number'}, parseNumbers: true})), {id: null});
	assert.deepEqual(structuredClone(queryString.parse('id=%20', {types: {id: 'number'}, parseNumbers: true})), {id: ' '});
});

test('types option: array types wrap a single value for every array format', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids[]=hello', {arrayFormat: 'bracket-separator', types: {ids: 'string[]'}})), {ids: ['hello']});
	assert.deepEqual(structuredClone(queryString.parse('ids:list=42', {arrayFormat: 'colon-list-separator', types: {ids: 'number[]'}})), {ids: [42]});
	assert.deepEqual(structuredClone(queryString.parse('ids=42', {arrayFormat: 'colon-list-separator', types: {ids: 'number[]'}})), {ids: [42]});
	assert.deepEqual(structuredClone(queryString.parse('ids=5', {arrayFormat: 'comma', decode: false, types: {ids: 'number[]'}})), {ids: [5]});
	assert.deepEqual(structuredClone(queryString.parse('ids', {arrayFormat: 'comma', types: {ids: 'string[]'}})), {ids: [null]});
	assert.deepEqual(structuredClone(queryString.parse('ids=1', {arrayFormat: 'comma', types: {ids: 'string[]'}, parseNumbers: true})), {ids: ['1']});
	const stringifiedNumbers = queryString.stringify({ids: [1, 2, 3]}, {arrayFormat: 'comma'});
	assert.deepEqual(structuredClone(queryString.parse(stringifiedNumbers, {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: [1, 2, 3]});
	const stringifiedOne = queryString.stringify({ids: [1]}, {arrayFormat: 'comma'});
	assert.deepEqual(structuredClone(queryString.parse(stringifiedOne, {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: [1]});
	const stringifiedText = queryString.stringify({ids: ['a']}, {arrayFormat: 'comma'});
	assert.deepEqual(structuredClone(queryString.parse(stringifiedText, {arrayFormat: 'comma', types: {ids: 'number[]'}})), {ids: ['a']});
});

test('comma and separator array formats merge a repeated key with types and other options', () => {
	assert.deepEqual(structuredClone(queryString.parse('foo&foo&foo', {arrayFormat: 'comma'})), {foo: [null, null, null]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma', types: {foo: 'number[]'}})), {foo: [1, 2, 3]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'comma', types: {foo: 'number'}})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma', types: {foo: value => `${value}!`}})), {foo: ['1!', '2!', '3!']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a,b&foo=c', {arrayFormat: 'comma', decode: false})), {foo: ['a', 'b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a%2Cb&foo=c', {arrayFormat: 'comma', decode: false})), {foo: ['a%2Cb', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a', {arrayFormat: 'separator', arrayFormatSeparator: '|'})), {foo: 'a'});
	assert.equal(queryString.stringify(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma'}), {arrayFormat: 'comma'}), 'foo=1,2,3');
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=1,2&foo=3', {arrayFormat: 'comma'})), {url: 'https://foo.bar', query: {foo: ['1', '2', '3']}});
	assert.equal(queryString.pick('https://foo.bar?foo=1&foo=2&bar=3', ['foo'], {arrayFormat: 'comma'}), 'https://foo.bar?foo=1,2');
	assert.equal(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=3', ['bar'], {arrayFormat: 'comma'}), 'https://foo.bar?foo=1,2');
});

test('index array format keeps the values of a repeated key without an index', () => {
	// A repeated plain key is not in the array syntax of this format, so it is collected like with `arrayFormat: 'none'` and the other formats instead of silently dropping the earlier values.
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'index'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2&foo=3', {arrayFormat: 'index'})), {foo: ['1', '2', '3']});

	// A plain value after the indexed entries is appended, like `foo[]`.
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo=2', {arrayFormat: 'index'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo[1]=2&foo=3', {arrayFormat: 'index'})), {foo: ['1', '2', '3']});
	assert.deepEqual(structuredClone(queryString.parse('foo[]=1&foo=2', {arrayFormat: 'index'})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo[1]=b&foo=c&foo[0]=a', {arrayFormat: 'index'})), {foo: ['a', 'b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo[5]=a&foo=b', {arrayFormat: 'index'})), {foo: ['a', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a&foo[0]=b&foo=c', {arrayFormat: 'index'})), {foo: ['a', 'b', 'c']});
	assert.deepEqual(structuredClone(queryString.parse('foo%5B0%5D=1&foo=2', {arrayFormat: 'index'})), {foo: ['1', '2']});

	// Null and empty values are kept.
	assert.deepEqual(structuredClone(queryString.parse('foo&foo=', {arrayFormat: 'index'})), {foo: [null, '']});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo', {arrayFormat: 'index'})), {foo: ['1', null]});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo=', {arrayFormat: 'index'})), {foo: ['1', '']});

	// An explicit index still overrides the item at that index.
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=a&foo=b&foo[0]=c', {arrayFormat: 'index'})), {foo: ['c', 'b']});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo=2&foo[1]=3', {arrayFormat: 'index'})), {foo: ['1', '3']});

	// Other keys are not affected, and the other options still apply.
	assert.deepEqual(structuredClone(queryString.parse('foo=1&bar=x&foo=2', {arrayFormat: 'index'})), {foo: ['1', '2'], bar: 'x'});
	assert.deepEqual(structuredClone(queryString.parse('foo[0]=1&foo=2', {arrayFormat: 'index', sort: false})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', sort: false})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', parseNumbers: true})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=true&foo=false', {arrayFormat: 'index', parseBooleans: true})), {foo: [true, false]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', types: {foo: 'number[]'}})), {foo: [1, 2]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', types: {foo: 'string'}})), {foo: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', types: {foo: value => `<${value}>`}})), {foo: ['<1>', '<2>']});
	assert.deepEqual(structuredClone(queryString.parse('foo=a%20b&foo=c', {arrayFormat: 'index', decode: false})), {foo: ['a%20b', 'c']});

	// A single plain key is still a plain value.
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'index'})), {foo: '1'});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'index'})), {foo: null});

	// `stringify()` writes an array with this format using indexes, and the URL helpers keep every value of a repeated plain key.
	assert.equal(queryString.pick('https://foo.bar?foo=1&foo=2&bar=3', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
	assert.equal(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=3', ['bar'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar?foo=1&foo=2', query: {bar: 3}}, {arrayFormat: 'index'}), 'https://foo.bar?bar=3&foo[0]=1&foo[1]=2');
});

test('types option: array types turn a valueless key into an array with a null item', () => {
	// A valueless key is parsed as `null`. With an array type it is one item, like `foo=` is `['']`, and like a valueless item of a repeated key. Otherwise the type would not give an array for every value.
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'number[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'separator', arrayFormatSeparator: '|', types: {foo: 'string[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'bracket', types: {foo: 'string[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'index', types: {foo: 'number[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'colon-list-separator', types: {foo: 'string[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'bracket-separator', types: {foo: 'string[]'}})), {foo: [null]});

	// The other values of the type are unchanged.
	assert.deepEqual(structuredClone(queryString.parse('foo=', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: ['']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1', {arrayFormat: 'comma', types: {foo: 'number[]'}})), {foo: [1]});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&foo', {arrayFormat: 'comma', types: {foo: 'number[]'}})), {foo: [1, null]});
	assert.deepEqual(structuredClone(queryString.parse('foo[]', {arrayFormat: 'bracket', types: {foo: 'string[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo[]', {arrayFormat: 'bracket-separator', types: {foo: 'string[]'}})), {foo: []});

	// The other options do not change the item.
	assert.deepEqual(structuredClone(queryString.parse('foo', {
		arrayFormat: 'comma',
		parseNumbers: true,
		parseBooleans: true,
		types: {foo: 'string[]'},
	})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'comma', decode: false, types: {foo: 'number[]'}})), {foo: [null]});
	assert.deepEqual(structuredClone(queryString.parse('foo&bar', {arrayFormat: 'comma', types: {foo: 'string[]'}})), {foo: [null], bar: null});

	// A valueless key with a non-array type, or with `arrayFormat: 'none'`, stays `null`.
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'string'}})), {foo: null});
	assert.deepEqual(structuredClone(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'number'}})), {foo: null});
	assert.deepEqual(structuredClone(queryString.parse('foo', {types: {foo: 'string[]'}})), {foo: null});
	assert.deepEqual(structuredClone(queryString.parse('foo', {types: {foo: 'number[]'}})), {foo: null});
});

test('types option: an array type takes precedence over `parseNumbers` and `parseBooleans` for a single value with `arrayFormat: "none"`', () => {
	assert.deepEqual(structuredClone(queryString.parse('ids=1', {types: {ids: 'string[]'}, parseNumbers: true})), {ids: '1'});
	assert.deepEqual(structuredClone(queryString.parse('ids=true', {types: {ids: 'string[]'}, parseBooleans: true})), {ids: 'true'});
	assert.deepEqual(structuredClone(queryString.parse('ids=true', {types: {ids: 'number[]'}, parseBooleans: true})), {ids: 'true'});
	assert.deepEqual(structuredClone(queryString.parse('ids=1', {
		arrayFormat: 'none', types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true,
	})), {ids: '1'});
	assert.deepEqual(structuredClone(queryString.parse('ids=1&other=1', {types: {ids: 'string[]'}, parseNumbers: true})), {ids: '1', other: 1});
	// A repeated key is still an array, and its items are parsed with the element type.
	assert.deepEqual(structuredClone(queryString.parse('ids=1&ids=true', {types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true})), {ids: ['1', 'true']});
});

test('types option: edge cases of a single value with an array type and `arrayFormat: "none"`', () => {
	// A value that is not a number is a string either way.
	assert.deepEqual(structuredClone(queryString.parse('ids=1,2', {types: {ids: 'string[]'}, parseNumbers: true})), {ids: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('ids=1,2', {types: {ids: 'number[]'}, parseNumbers: true})), {ids: '1,2'});
	// `0` and `1` are not booleans without an explicit `boolean` type.
	assert.deepEqual(structuredClone(queryString.parse('flag=0', {types: {flag: 'string[]'}, parseBooleans: true})), {flag: '0'});
	assert.deepEqual(structuredClone(queryString.parse('flag=false', {types: {flag: 'number[]'}, parseBooleans: true})), {flag: 'false'});
	// An empty value stays an empty string.
	assert.deepEqual(structuredClone(queryString.parse('ids=', {types: {ids: 'number[]'}, parseNumbers: true})), {ids: ''});
	// A valueless key stays `null`.
	assert.deepEqual(structuredClone(queryString.parse('ids', {types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true})), {ids: null});
	// The value is still decoded.
	assert.deepEqual(structuredClone(queryString.parse('ids=%31', {types: {ids: 'string[]'}, parseNumbers: true})), {ids: '1'});
	assert.deepEqual(structuredClone(queryString.parse('ids=%31', {types: {ids: 'string[]'}, parseNumbers: true, decode: false})), {ids: '%31'});
	// Other keys are still parsed with the general options.
	assert.deepEqual(structuredClone(queryString.parse('ids=1&flag=true&n=2', {
		types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true, sort: false,
	})), {ids: '1', flag: true, n: 2});
	// A repeated key is an array, and its items are parsed with the element type, not the general options.
	assert.deepEqual(structuredClone(queryString.parse('ids=1&ids=2', {types: {ids: 'string[]'}, parseNumbers: true})), {ids: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('ids=1&ids=true', {types: {ids: 'number[]'}, parseBooleans: true})), {ids: [1, 'true']});
	assert.deepEqual(structuredClone(queryString.parse('ids=1&ids', {types: {ids: 'number[]'}, parseBooleans: true})), {ids: [1, null]});
	// A custom function still takes precedence over the general options for a single value.
	assert.deepEqual(structuredClone(queryString.parse('ids=1', {types: {ids: value => `<${value}>`}, parseNumbers: true})), {ids: '<1>'});
});

test('types option: a single value with an array type and `arrayFormat: "none"` stays a string in `parseUrl()`, `pick()`, and `exclude()`', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?ids=1&n=1', {types: {ids: 'string[]'}, parseNumbers: true})), {url: 'https://foo.bar', query: {ids: '1', n: 1}});
	assert.equal(queryString.pick('https://foo.bar?ids=1&n=1', (key, value) => value === '1', {types: {ids: 'string[]'}, parseNumbers: true}), 'https://foo.bar?ids=1');
	assert.equal(queryString.exclude('https://foo.bar?ids=1&n=1', (key, value) => value === '1', {types: {ids: 'string[]'}, parseNumbers: true}), 'https://foo.bar?n=1');
});

test('index array format does not pollute the prototype with a `__proto__` key', () => {
	const parsed = queryString.parse('__proto__[0]=x&__proto__[1]=y', {arrayFormat: 'index'});
	assert.deepEqual(structuredClone(Object.getOwnPropertyDescriptor(parsed, '__proto__').value), ['x', 'y']);
	assert.equal(Object.getPrototypeOf(parsed), null);
	assert.deepEqual(structuredClone(Object.keys({})), []);
	assert.equal(0 in Object.prototype, false);
	assert.deepEqual(structuredClone(queryString.parse('constructor=x&constructor=y')), {constructor: ['x', 'y']});
});

test('an option that is explicitly `undefined` uses its default', () => {
	// Passing through an optional setting, like `{decode: config.decode}`, must behave like leaving the option out.
	assert.deepEqual(structuredClone(queryString.parse('foo=%26+bar', {decode: undefined})), {foo: '& bar'});
	assert.deepEqual(structuredClone(queryString.parse('b=1&a=2', {sort: undefined})), {a: '2', b: '1'});
	assert.deepEqual(Object.keys(queryString.parse('b=1&a=2', {sort: undefined})), ['a', 'b']);
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2', {arrayFormat: undefined})), {foo: '1,2'});
	assert.deepEqual(structuredClone(queryString.parse('foo=1,2', {arrayFormat: 'comma', arrayFormatSeparator: undefined})), {foo: ['1', '2']});
	assert.deepEqual(structuredClone(queryString.parse('foo=1&bar=true', {parseNumbers: undefined, parseBooleans: undefined, types: undefined})), {foo: '1', bar: 'true'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=%26', {decode: undefined})), {url: 'https://foo.bar', query: {foo: '&'}});
});

test('a value with many distinct percent-encodings decodes the same with and without an invalid sequence', () => {
	// A value that is valid percent-encoded UTF-8 is decoded by the built-in decoder. Adding one invalid sequence makes it throw, and the value is then decoded the lenient way instead. Both paths have to give the same characters, so this covers a value with thousands of distinct escapes going through the lenient path.
	const percentByte = value => `%${value.toString(16).toUpperCase().padStart(2, '0')}`;

	// Distinct three-byte sequences. Lead bytes 0xE0 and 0xED are left out, because 0xE0 can only begin an overlong encoding and 0xED can only begin a surrogate.
	const runs = [];
	for (let lead = 0xE1; lead <= 0xEF; lead++) {
		if (lead === 0xED) {
			continue;
		}

		for (let second = 0x80; second <= 0xBF; second += 7) {
			for (let third = 0x80; third <= 0xBF; third += 11) {
				// eslint-disable-next-line no-bitwise -- Unpacking a UTF-8 sequence is bit arithmetic by definition.
				const codePoint = ((lead & 0x0F) << 12) | ((second & 0x3F) << 6) | (third & 0x3F);
				runs.push([percentByte(lead) + percentByte(second) + percentByte(third), String.fromCodePoint(codePoint)]);
			}
		}
	}

	const encoded = runs.map(([bytes]) => bytes).join('z');
	const expected = runs.map(([, character]) => character).join('z');

	assert.equal(queryString.parse(`a=${encoded}`).a, expected);

	// A truncated three-byte sequence at the end is what makes the built-in decoder throw. Every run still decodes, and the truncated sequence becomes one replacement character.
	assert.equal(queryString.parse(`a=${encoded}%E4%B8`).a, `${expected}�`);

	// Decoding is off, so every byte is left exactly as it is.
	assert.equal(queryString.parse(`a=${encoded}%E4%B8`, {decode: false}).a, `${encoded}%E4%B8`);
});

test('decoding a value with many distinct percent-encodings and one invalid sequence is not quadratic', () => {
	// The lenient decoder used to collect every distinct run of percent-encoded bytes in a value into a replacement map and then replace each entry across the whole value, so a value with N distinct runs cost N passes over N bytes. An 80 KB value took seconds. Every count below has to grow in step with the size of the value instead.
	const percentByte = value => `%${value.toString(16).toUpperCase().padStart(2, '0')}`;
	const leadBytes = [0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, 0xEE, 0xEF];
	// Every run decodes to a different character, so each one is distinct.
	const distinctEncodings = count => Array.from({length: count}, (_, index) =>
		percentByte(leadBytes[index % leadBytes.length])
		+ percentByte(0x80 + (Math.floor(index / leadBytes.length) % 64))
		+ percentByte(0x80 + (Math.floor(index / (leadBytes.length * 64)) % 64)),
	).join('z');

	const count = 4000;
	const baselineQuery = `a=${distinctEncodings(count)}`;
	// A truncated three-byte sequence at the end is what makes the built-in decoder throw.
	const invalidQuery = `${baselineQuery}%E4%B8`;

	// Warm up first, so this measures the decoder and not the cost of the first call going through the interpreter.
	for (let iteration = 0; iteration < 10; iteration++) {
		queryString.parse(baselineQuery);
		queryString.parse(invalidQuery);
	}

	const baselineStartTime = performance.now();
	queryString.parse(baselineQuery);
	const baselineElapsedTime = performance.now() - baselineStartTime;

	const invalidStartTime = performance.now();
	queryString.parse(invalidQuery);
	const invalidElapsedTime = performance.now() - invalidStartTime;

	// The two values differ only in the trailing sequence, so the gap between them is the cost of the lenient path alone. It is measured against the baseline rather than an absolute budget, so a busy machine does not decide the result.
	assert.ok(invalidElapsedTime < (baselineElapsedTime * 20) + 100, `Expected the lenient decoder to stay near the built-in decoder. Invalid: ${invalidElapsedTime}ms. Baseline: ${baselineElapsedTime}ms.`);
});

test('comma and separator array formats parse a key repeated many times without quadratic slowdown', () => {
	const count = 20_000;
	const query = Array.from({length: count}, (_, index) => `a=${index}`).join('&');

	const baselineStartTime = performance.now();
	const baseline = queryString.parse(query);
	const baselineElapsedTime = performance.now() - baselineStartTime;

	const commaStartTime = performance.now();
	const comma = queryString.parse(query, {arrayFormat: 'comma'});
	const commaElapsedTime = performance.now() - commaStartTime;

	const separatorStartTime = performance.now();
	const separator = queryString.parse(query, {arrayFormat: 'separator', arrayFormatSeparator: '|'});
	const separatorElapsedTime = performance.now() - separatorStartTime;

	assert.equal(baseline.a.length, count);
	assert.deepEqual(structuredClone(comma), structuredClone(baseline));
	assert.deepEqual(structuredClone(separator), structuredClone(baseline));
	assert.ok(commaElapsedTime < (baselineElapsedTime * 5) + 1000, `Expected the comma format to stay near the default format. Comma: ${commaElapsedTime}ms. Default: ${baselineElapsedTime}ms.`);
	assert.ok(
		separatorElapsedTime < (baselineElapsedTime * 5) + 1000,
		`Expected the separator format to stay near the default format. Separator: ${separatorElapsedTime}ms. Default: ${baselineElapsedTime}ms.`,
	);

	// A value with more items than a function call can take as arguments is appended without spreading it.
	const manyItems = Array.from({length: 300_000}, (_, index) => index).join(',');
	assert.equal(queryString.parse(`a=${manyItems}&a=${manyItems}`, {arrayFormat: 'comma'}).a.length, 600_000);
});

test('rejects an invalid `arrayFormatSeparator`', () => {
	const invalid = {
		'arrayFormatSeparator must be a single character': ['\u{1F600}', '', ',,', 1, null],
		'arrayFormatSeparator must not be whitespace, since parse() ignores leading and trailing whitespace in the query': [' ', '\t', '\n', '\r', '\u{A0}'],
		'arrayFormatSeparator must not be a lone surrogate, since it cannot be percent-encoded': ['\u{D800}', '\u{DC00}'],
	};

	for (const [message, arrayFormatSeparators] of Object.entries(invalid)) {
		for (const arrayFormatSeparator of arrayFormatSeparators) {
			const callback = () => queryString.parse('foo=a|b', {arrayFormat: 'separator', arrayFormatSeparator});
			// The class and the message are checked separately, because `assert.throws()` cannot do both in one call.
			assert.throws(callback, TypeError);
			assert.throws(callback, {message});
		}
	}

	assert.deepEqual(structuredClone(queryString.parse('foo=a·b', {arrayFormat: 'separator', arrayFormatSeparator: '·'})), {foo: ['a', 'b']});
});
