import test from 'ava';
import queryString from '../index.js';

test('query strings starting with a `?`', t => {
	t.deepEqual(queryString.parse('?foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `#`', t => {
	t.deepEqual(queryString.parse('#foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `&`', t => {
	t.deepEqual(queryString.parse('&foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('query strings ending with a `&`', t => {
	t.deepEqual(queryString.parse('foo=bar&'), {foo: 'bar'});
	t.deepEqual(queryString.parse('foo=bar&&&'), {foo: 'bar'});
});

test('parse a query string', t => {
	t.deepEqual(queryString.parse('foo=bar'), {foo: 'bar'});
	t.deepEqual(queryString.parse('foo=null'), {foo: 'null'});
});

test('parse multiple query string', t => {
	t.deepEqual(queryString.parse('foo=bar&key=val'), {
		foo: 'bar',
		key: 'val',
	});
});

test('parse multiple query string retain order when not sorted', t => {
	const expectedKeys = ['b', 'a', 'c'];
	const parsed = queryString.parse('b=foo&a=bar&c=yay', {sort: false});
	for (const [index, key] of Object.keys(parsed).entries()) {
		t.is(key, expectedKeys[index]);
	}
});

test('parse multiple query string sorted keys', t => {
	const fixture = ['a', 'b', 'c'];
	const parsed = queryString.parse('a=foo&c=bar&b=yay');
	for (const [index, key] of Object.keys(parsed).entries()) {
		t.is(key, fixture[index]);
	}
});

test('should sort parsed keys in given order', t => {
	const fixture = ['c', 'a', 'b'];
	const sort = (key1, key2) => fixture.indexOf(key1) - fixture.indexOf(key2);

	const parsed = queryString.parse('a=foo&b=bar&c=yay', {sort});
	for (const [index, key] of Object.keys(parsed).entries()) {
		t.is(key, fixture[index]);
	}
});

test('parse query string without a value', t => {
	t.deepEqual(queryString.parse('foo'), {foo: null});
	t.deepEqual(queryString.parse('foo&key'), {
		foo: null,
		key: null,
	});
	t.deepEqual(queryString.parse('foo=bar&key'), {
		foo: 'bar',
		key: null,
	});
	t.deepEqual(queryString.parse('a&a'), {a: [null, null]});
	t.deepEqual(queryString.parse('a=&a'), {a: ['', null]});
});

test('return empty object if no qss can be found', t => {
	t.deepEqual(queryString.parse('?'), {});
	t.deepEqual(queryString.parse('&'), {});
	t.deepEqual(queryString.parse('#'), {});
	t.deepEqual(queryString.parse(' '), {});
});

test('handle `+` correctly', t => {
	t.deepEqual(queryString.parse('foo+faz=bar+baz++'), {'foo faz': 'bar baz  '});
});

test('parses numbers with exponential notation as string', t => {
	t.deepEqual(queryString.parse('192e11=bar'), {'192e11': 'bar'});
	t.deepEqual(queryString.parse('bar=192e11'), {bar: '192e11'});
});

test('handle `+` correctly when not decoding', t => {
	t.deepEqual(queryString.parse('foo+faz=bar+baz++', {decode: false}), {'foo+faz': 'bar+baz++'});
});

test('handle multiple of the same key', t => {
	t.deepEqual(queryString.parse('foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('handles many duplicate keys without quadratic slowdown', t => {
	const count = 20_000;
	const duplicateQuery = Array.from({length: count}, () => 'a=1').join('&');
	const uniqueQuery = Array.from({length: count}, (_, index) => `a${index}=1`).join('&');

	const uniqueStartTime = performance.now();
	queryString.parse(uniqueQuery);
	const uniqueElapsedTime = performance.now() - uniqueStartTime;

	const duplicateStartTime = performance.now();
	const parsed = queryString.parse(duplicateQuery);
	const duplicateElapsedTime = performance.now() - duplicateStartTime;

	t.is(parsed.a.length, count);
	t.true(parsed.a.every(value => value === '1'));
	t.true(duplicateElapsedTime < (uniqueElapsedTime * 20) + 100, `Expected duplicate-key parsing to stay near the unique-key baseline. Duplicate: ${duplicateElapsedTime}ms. Unique: ${uniqueElapsedTime}ms.`);
});

test('handles many explicit array items without quadratic slowdown', t => {
	const count = 20_000;
	const cases = [
		{
			arrayFormat: 'bracket',
			duplicateQuery: Array.from({length: count}, () => 'a[]=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}[]=1`).join('&'),
		},
		{
			arrayFormat: 'colon-list-separator',
			duplicateQuery: Array.from({length: count}, () => 'a:list=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}:list=1`).join('&'),
		},
		{
			arrayFormat: 'bracket-separator',
			duplicateQuery: Array.from({length: count}, () => 'a[]=1').join('&'),
			uniqueQuery: Array.from({length: count}, (_, index) => `a${index}[]=1`).join('&'),
		},
	];

	for (const {arrayFormat, duplicateQuery, uniqueQuery} of cases) {
		const uniqueStartTime = performance.now();
		queryString.parse(uniqueQuery, {arrayFormat});
		const uniqueElapsedTime = performance.now() - uniqueStartTime;

		const duplicateStartTime = performance.now();
		const parsed = queryString.parse(duplicateQuery, {arrayFormat});
		const duplicateElapsedTime = performance.now() - duplicateStartTime;

		t.is(parsed.a.length, count);
		t.true(parsed.a.every(value => value === '1'));
		t.true(duplicateElapsedTime < (uniqueElapsedTime * 10) + 100, `Expected ${arrayFormat} parsing to stay near the unique-key baseline. Duplicate: ${duplicateElapsedTime}ms. Unique: ${uniqueElapsedTime}ms.`);
	}
});

test('handles large bracket-separator chunks without argument spread overflow', t => {
	const count = 200_000;
	const query = `a[]=0&a[]=${Array.from({length: count}, () => '1').join(',')}`;
	const parsed = queryString.parse(query, {arrayFormat: 'bracket-separator'});

	t.is(parsed.a.length, count + 1);
	t.is(parsed.a[0], '0');
	t.is(parsed.a.at(-1), '1');
});

test('handles scalar values before explicit array entries', t => {
	t.deepEqual(queryString.parse('a=one&a[]=two', {arrayFormat: 'bracket'}), {a: ['one', 'two']});
	t.deepEqual(queryString.parse('a=one&a:list=two', {arrayFormat: 'colon-list-separator'}), {a: ['one', 'two']});
	t.deepEqual(queryString.parse('a=one&a[]=two,three', {arrayFormat: 'bracket-separator'}), {a: ['one', 'two', 'three']});
});

test('comma and separator formats parse a single value as a plain value unless an array type is given', t => {
	// A single value has no separator, so it cannot be told apart from a plain value. This is documented, and the `types` option is the way to always get an array.
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'comma'}), {foo: '1'});
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'separator', arrayFormatSeparator: '|'}), {foo: '1'});
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: ['1']});
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'comma', types: {foo: 'number[]'}}), {foo: [1]});
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'separator', arrayFormatSeparator: '|', types: {foo: 'string[]'}}), {foo: ['1']});
	t.deepEqual(queryString.parse('foo=', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: ['']});
	t.deepEqual(queryString.parse('foo=a%2Cb', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: ['a,b']});
	t.deepEqual(queryString.parse('foo=1,2', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo[]=1', {arrayFormat: 'bracket-separator'}), {foo: ['1']});
	t.deepEqual(queryString.parse(queryString.stringify({foo: [1]}, {arrayFormat: 'comma'}), {arrayFormat: 'comma', types: {foo: 'number[]'}}), {foo: [1]});
});

test('bracket-style array formats keep the values of a repeated key without the array marker', t => {
	// A repeated plain key is not in the array syntax of these formats, so it is collected like with `arrayFormat: 'none'` instead of silently dropping the earlier values.
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2&foo=3', {arrayFormat: 'bracket'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'colon-list-separator'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket-separator'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'}), {foo: ['1', '2']});

	// Valueless and empty repeats are kept too.
	t.deepEqual(queryString.parse('foo&foo=1', {arrayFormat: 'bracket'}), {foo: [null, '1']});
	t.deepEqual(queryString.parse('foo=&foo=1', {arrayFormat: 'colon-list-separator'}), {foo: ['', '1']});
	t.deepEqual(queryString.parse('foo&foo', {arrayFormat: 'bracket-separator'}), {foo: [null, null]});

	// A plain value after the marked entries is added to the array, like a plain value before them already was.
	t.deepEqual(queryString.parse('foo[]=1&foo=2', {arrayFormat: 'bracket'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo[]=2&foo=3', {arrayFormat: 'bracket'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo:list=1&foo=2', {arrayFormat: 'colon-list-separator'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo[]=1|2&foo=3', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo[]&foo=1', {arrayFormat: 'bracket-separator'}), {foo: ['1']});

	// Plain values are decoded, like the array items.
	t.deepEqual(queryString.parse('foo=a%20b&foo=c%2Cd', {arrayFormat: 'bracket-separator'}), {foo: ['a b', 'c,d']});
	t.deepEqual(queryString.parse('foo=a%20b&foo=c', {arrayFormat: 'bracket-separator', decode: false}), {foo: ['a%20b', 'c']});

	// The other options still apply to the collected array.
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', parseNumbers: true}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', types: {foo: 'number[]'}}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', types: {foo: 'string'}}), {foo: '1,2'});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'bracket', types: {foo: value => `<${value}>`}}), {foo: ['<1>', '<2>']});
	t.deepEqual(queryString.parse('b=1&a=2&b=3', {arrayFormat: 'bracket', sort: false}), {b: ['1', '3'], a: '2'});
	t.deepEqual(Object.keys(queryString.parse('b=1&a=2&b=3', {arrayFormat: 'bracket', sort: false})), ['b', 'a']);

	// A single plain key is still a plain value, and other keys are not affected.
	t.deepEqual(queryString.parse('foo=1&bar=2', {arrayFormat: 'bracket'}), {foo: '1', bar: '2'});
	t.deepEqual(queryString.parse('foo=1&bar=2&bar=3', {arrayFormat: 'colon-list-separator'}), {foo: '1', bar: ['2', '3']});

	// `stringify()` writes an array with these formats using the marker, and the URL helpers keep every value of a repeated plain key.
	t.is(queryString.pick('https://foo.bar?foo=1&foo=2&bar=3', ['foo'], {arrayFormat: 'bracket'}), 'https://foo.bar?foo[]=1&foo[]=2');
	t.is(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=3', ['bar'], {arrayFormat: 'colon-list-separator'}), 'https://foo.bar?foo:list=1&foo:list=2');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?foo=1&foo=2', query: {bar: 3}}, {arrayFormat: 'bracket-separator'}), 'https://foo.bar?bar=3&foo[]=1,2');
});

test('handles many empty parameters without allocating split results', t => {
	const query = '&'.repeat(5_000_000);
	const startTime = performance.now();
	const parsed = queryString.parse(query, {sort: false});
	const elapsedTime = performance.now() - startTime;

	t.deepEqual(parsed, {});
	t.true(elapsedTime < 50, `Expected empty parameter parsing to avoid split allocation. Took ${elapsedTime}ms.`);
});

test('handle multiple values and preserve appearence order', t => {
	t.deepEqual(queryString.parse('a=value&a='), {a: ['value', '']});
	t.deepEqual(queryString.parse('a=&a=value'), {a: ['', 'value']});
});

test('handle multiple values and preserve appearance order with brackets', t => {
	t.deepEqual(queryString.parse('a[]=value&a[]=', {arrayFormat: 'bracket'}), {a: ['value', '']});
	t.deepEqual(queryString.parse('a[]=&a[]=value', {arrayFormat: 'bracket'}), {a: ['', 'value']});
});

test('handle multiple values and preserve appearance order with indexes', t => {
	t.deepEqual(queryString.parse('a[0]=value&a[1]=', {arrayFormat: 'index'}), {a: ['value', '']});
	t.deepEqual(queryString.parse('a[1]=&a[0]=value', {arrayFormat: 'index'}), {a: ['value', '']});
});

test('query strings params including embedded `=`', t => {
	const value = 'https://someurl?id=2837';
	t.deepEqual(queryString.parse(`param=${encodeURIComponent(value)}`), {param: 'https://someurl?id=2837'});
});

test('object properties', t => {
	t.falsy(queryString.parse().prototype);
	t.deepEqual(queryString.parse('hasOwnProperty=foo'), {hasOwnProperty: 'foo'});
});

test('query strings having indexed arrays', t => {
	t.deepEqual(queryString.parse('foo[0]=bar&foo[1]=baz'), {'foo[0]': 'bar', 'foo[1]': 'baz'});
});

test('query strings having brackets arrays', t => {
	t.deepEqual(queryString.parse('foo[]=bar&foo[]=baz'), {'foo[]': ['bar', 'baz']});
});

test('query strings having indexed arrays keeping index order', t => {
	t.deepEqual(queryString.parse('foo[1]=bar&foo[0]=baz'), {'foo[1]': 'bar', 'foo[0]': 'baz'});
});

test('query string having a single bracketed value and format option as `bracket`', t => {
	t.deepEqual(queryString.parse('foo[]=bar', {arrayFormat: 'bracket'}), {foo: ['bar']});
});

test('query string not having a bracketed value and format option as `bracket`', t => {
	t.deepEqual(queryString.parse('foo=bar', {arrayFormat: 'bracket'}), {foo: 'bar'});
});

test('query string having a bracketed value and a single value and format option as `bracket`', t => {
	t.deepEqual(queryString.parse('foo=bar&baz[]=bar', {arrayFormat: 'bracket'}), {foo: 'bar', baz: ['bar']});
});

test('query strings having brackets arrays and format option as `bracket`', t => {
	t.deepEqual(queryString.parse('foo[]=bar&foo[]=baz', {
		arrayFormat: 'bracket',
	}), {foo: ['bar', 'baz']});
});

test('query strings having comma separated arrays and format option as `comma`', t => {
	t.deepEqual(queryString.parse('foo=bar,baz', {
		arrayFormat: 'comma',
	}), {foo: ['bar', 'baz']});
});

test('query strings having pipe separated arrays and format option as `separator`', t => {
	t.deepEqual(queryString.parse('foo=bar|baz', {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
	}), {foo: ['bar', 'baz']});
});

test('single value with encoded separator should not be split into array', t => {
	// Test for issue #336 - encoded separators should not cause array splitting
	const value = encodeURIComponent('a|b'); // 'a%7Cb'
	t.deepEqual(queryString.parse(`foo=${value}`, {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
	}), {foo: 'a|b'});

	// Multiple values with encoded separators in them
	const value1 = encodeURIComponent('a|b');
	const value2 = encodeURIComponent('c|d');
	t.deepEqual(queryString.parse(`foo=${value1}|${value2}`, {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
	}), {foo: ['a|b', 'c|d']});
});

test('query strings having percent-encoded array markers in the key', t => {
	// The key is decoded before the array marker is checked, like `URLSearchParams`, Rack, and PHP do. `new URLSearchParams({'foo[]': 1}).toString()` gives `foo%5B%5D=1`.
	t.deepEqual(queryString.parse('foo%5B%5D=1&foo%5B%5D=2', {arrayFormat: 'bracket'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo%5B%5D=1&foo[]=2', {arrayFormat: 'bracket'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo%5B%5D', {arrayFormat: 'bracket'}), {foo: [null]});
	t.deepEqual(queryString.parse('foo%5B0%5D=a&foo%5B1%5D=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo%5B1%5D=b&foo[0]=a', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo%5B%5D=1|2', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo%5B%5D', {arrayFormat: 'bracket-separator'}), {foo: []});
	t.deepEqual(queryString.parse('foo%3Alist=1&foo%3Alist=2', {arrayFormat: 'colon-list-separator'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('a%20b%5B%5D=1', {arrayFormat: 'bracket'}), {'a b': ['1']});

	// The marker is not decoded without `decode`, so it is a plain key then.
	t.deepEqual(queryString.parse('foo%5B%5D=1', {arrayFormat: 'bracket', decode: false}), {'foo%5B%5D': '1'});

	// Without an array format, the decoded marker is part of the key.
	t.deepEqual(queryString.parse('foo%5B%5D=1'), {'foo[]': '1'});

	// The trade-off: a key that itself ends in a marker cannot be told apart from the marker after decoding.
	t.is(queryString.stringify({'foo[]': 'x'}, {arrayFormat: 'bracket'}), 'foo%5B%5D=x');
	t.deepEqual(queryString.parse('foo%5B%5D=x', {arrayFormat: 'bracket'}), {foo: ['x']});
});

test('query strings having brackets arrays with null and format option as `bracket`', t => {
	t.deepEqual(queryString.parse('bar[]&foo[]=a&foo[]&foo[]=', {
		arrayFormat: 'bracket',
	}), {
		foo: ['a', null, ''],
		bar: [null],
	});
});

test('query strings having comma separated arrays with null and format option as `comma`', t => {
	t.deepEqual(queryString.parse('bar&foo=a,', {
		arrayFormat: 'comma',
	}), {
		foo: ['a', ''],
		bar: null,
	});
});

test('query strings having indexed arrays and format option as `index`', t => {
	t.deepEqual(queryString.parse('foo[0]=bar&foo[1]=baz', {
		arrayFormat: 'index',
	}), {foo: ['bar', 'baz']});
});

test('query strings having brackets+separator arrays and format option as `bracket-separator` with 1 value', t => {
	t.deepEqual(queryString.parse('foo[]=bar', {
		arrayFormat: 'bracket-separator',
	}), {foo: ['bar']});
});

test('query strings having brackets+separator arrays and format option as `bracket-separator` with multiple values', t => {
	t.deepEqual(queryString.parse('foo[]=bar,baz,,,biz', {
		arrayFormat: 'bracket-separator',
	}), {foo: ['bar', 'baz', '', '', 'biz']});
});

test('query strings with multiple brackets+separator arrays and format option as `bracket-separator` using same key name', t => {
	t.deepEqual(queryString.parse('foo[]=bar,baz&foo[]=biz,boz', {
		arrayFormat: 'bracket-separator',
	}), {foo: ['bar', 'baz', 'biz', 'boz']});
});

test('query strings having an empty brackets+separator array and format option as `bracket-separator`', t => {
	t.deepEqual(queryString.parse('foo[]', {
		arrayFormat: 'bracket-separator',
	}), {foo: []});
});

test('query strings having a brackets+separator array and format option as `bracket-separator` with a single empty string', t => {
	t.deepEqual(queryString.parse('foo[]=', {
		arrayFormat: 'bracket-separator',
	}), {foo: ['']});
});

test('query strings having a brackets+separator array and format option as `bracket-separator` with a URL encoded value', t => {
	// A percent-encoded separator is part of the item, not a separator. See https://github.com/sindresorhus/query-string/issues/398
	const key = 'foo[]';
	const value = 'a,b,c,d,e,f';
	t.deepEqual(queryString.parse(`?${encodeURIComponent(key)}=${encodeURIComponent(value)}`, {
		arrayFormat: 'bracket-separator',
	}), {
		foo: ['a,b,c,d,e,f'],
	});
});

test('query strings having a brackets+separator array and format option as `bracket-separator` with an encoded separator inside an item', t => {
	t.deepEqual(queryString.parse('foo[]=a%2Cb,c', {arrayFormat: 'bracket-separator'}), {foo: ['a,b', 'c']});
	t.deepEqual(queryString.parse('foo[]=%2C', {arrayFormat: 'bracket-separator'}), {foo: [',']});
	t.deepEqual(queryString.parse('foo[]=a%7Cb|c', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'}), {foo: ['a|b', 'c']});
	t.deepEqual(queryString.parse('foo[]=a%2Cb,c', {arrayFormat: 'bracket-separator', decode: false}), {foo: ['a%2Cb', 'c']});
	t.deepEqual(queryString.parse('foo[]=a%2Cb,c&foo[]=d%2Ce', {arrayFormat: 'bracket-separator'}), {foo: ['a,b', 'c', 'd,e']});
	t.deepEqual(queryString.parse('foo[]=1%2C2,3', {arrayFormat: 'bracket-separator', parseNumbers: true}), {foo: ['1,2', 3]});
});

test('`bracket-separator` round-trips items containing the separator', t => {
	for (const arrayFormatSeparator of [',', '|', ';']) {
		const options = {arrayFormat: 'bracket-separator', arrayFormatSeparator};
		const object = {foo: [`a${arrayFormatSeparator}b`, 'c', arrayFormatSeparator, ''], bar: [arrayFormatSeparator]};
		t.deepEqual(queryString.parse(queryString.stringify(object, options), options), object, `separator: ${arrayFormatSeparator}`);
	}
});

test('`bracket-separator` handles encoded separators the same way as `comma` and `separator`', t => {
	const separator = queryString.parse('foo=a%2Cb,c', {arrayFormat: 'separator'});
	const comma = queryString.parse('foo=a%2Cb,c', {arrayFormat: 'comma'});
	const bracketSeparator = queryString.parse('foo[]=a%2Cb,c', {arrayFormat: 'bracket-separator'});
	t.deepEqual(separator, {foo: ['a,b', 'c']});
	t.deepEqual(comma, separator);
	t.deepEqual(bracketSeparator, separator);
});

test('query strings having = within parameters (i.e. GraphQL IDs)', t => {
	t.deepEqual(queryString.parse('foo=bar=&foo=ba=z='), {foo: ['bar=', 'ba=z=']});
});

test('query strings having ordered index arrays and format option as `index`', t => {
	t.deepEqual(queryString.parse('foo[1]=bar&foo[0]=baz&foo[3]=one&foo[2]=two', {
		arrayFormat: 'index',
	}), {foo: ['baz', 'bar', 'two', 'one']});

	t.deepEqual(queryString.parse('foo[0]=bar&foo[1]=baz&foo[2]=one&foo[3]=two', {
		arrayFormat: 'index',
	}), {foo: ['bar', 'baz', 'one', 'two']});

	t.deepEqual(queryString.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero', {
		arrayFormat: 'index',
	}), {foo: ['zero', 'one', 'two', 'three']});

	t.deepEqual(queryString.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index',
	}), {foo: ['zero', 'one', 'two', 'three'], bat: 'buz'});

	t.deepEqual(queryString.parse('foo[1]=bar&foo[0]=baz', {
		arrayFormat: 'index',
	}), {foo: ['baz', 'bar']});

	t.deepEqual(queryString.parse('foo[102]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index',
	}), {bat: 'buz', foo: ['zero', 'one', 'two', 'three']});

	t.deepEqual(queryString.parse('foo[102]=three&foo[2]=two&foo[100]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index',
	}), {bat: 'buz', foo: ['zero', 'two', 'one', 'three']});
});

test('circuit parse → stringify', t => {
	const original = 'foo[3]=foo&foo[2]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const expected = {bat: 'buz', foo: ['', 'one', null, 'foo']};
	const options = {
		arrayFormat: 'index',
	};

	t.deepEqual(queryString.parse(original, options), expected);

	t.is(queryString.stringify(expected, options), sortedOriginal);
});

test('circuit original → parse → stringify → sorted original', t => {
	const original = 'foo[21474836471]=foo&foo[21474836470]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const options = {
		arrayFormat: 'index',
	};

	t.deepEqual(queryString.stringify(queryString.parse(original, options), options), sortedOriginal);
});

test('circuit parse → stringify with array commas', t => {
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

	t.deepEqual(queryString.parse(original, options), expected);

	t.is(queryString.stringify(expected, options), sortedOriginal);
});

test('circuit original → parse → stringify with array commas → sorted original', t => {
	const original = 'c=,a,,&b=&a=';
	const sortedOriginal = 'a=&b=&c=,a,,';
	const options = {
		arrayFormat: 'comma',
	};

	t.deepEqual(queryString.stringify(queryString.parse(original, options), options), sortedOriginal);
});

test('decode keys and values', t => {
	t.deepEqual(queryString.parse('st%C3%A5le=foo'), {ståle: 'foo'});
	t.deepEqual(queryString.parse('foo=%7B%ab%%7C%de%%7D+%%7Bst%C3%A5le%7D%'), {foo: '{%ab%|%de%} %{ståle}%'});
});

test('disable decoding of keys and values', t => {
	const value = 'postal office,burger, fries and coke';
	t.deepEqual(queryString.parse(`tags=${encodeURIComponent(value)}`, {decode: false}), {tags: 'postal%20office%2Cburger%2C%20fries%20and%20coke'});
});

test('number value returns as string by default', t => {
	t.deepEqual(queryString.parse('foo=1'), {foo: '1'});
});

test('number value returns as number if option is set', t => {
	t.deepEqual(queryString.parse('foo=1', {parseNumbers: true}), {foo: 1});
	t.deepEqual(queryString.parse('foo=12.3&bar=123e-1', {parseNumbers: true}), {foo: 12.3, bar: 12.3});
	t.deepEqual(queryString.parse('foo=0x11&bar=12.00', {parseNumbers: true}), {foo: 17, bar: 12});
});

test('NaN value returns as string if option is set', t => {
	t.deepEqual(queryString.parse('foo=null', {parseNumbers: true}), {foo: 'null'});
	t.deepEqual(queryString.parse('foo=undefined', {parseNumbers: true}), {foo: 'undefined'});
	t.deepEqual(queryString.parse('foo=100a&bar=100', {parseNumbers: true}), {foo: '100a', bar: 100});
	t.deepEqual(queryString.parse('foo=   &bar=', {parseNumbers: true}), {foo: '   ', bar: ''});
});

test('parseNumbers works with arrayFormat', t => {
	t.deepEqual(queryString.parse('foo[]=1&foo[]=2&foo[]=3&bar=1', {parseNumbers: true, arrayFormat: 'bracket'}), {foo: [1, 2, 3], bar: 1});
	t.deepEqual(queryString.parse('foo=1,2,a', {parseNumbers: true, arrayFormat: 'comma'}), {foo: [1, 2, 'a']});
	t.deepEqual(queryString.parse('foo=1|2|a', {parseNumbers: true, arrayFormat: 'separator', arrayFormatSeparator: '|'}), {foo: [1, 2, 'a']});
	t.deepEqual(queryString.parse('foo[0]=1&foo[1]=2&foo[2]', {parseNumbers: true, arrayFormat: 'index'}), {foo: [1, 2, null]});
	t.deepEqual(queryString.parse('foo=1&foo=2&foo=3', {parseNumbers: true}), {foo: [1, 2, 3]});
});

test('boolean value returns as string by default', t => {
	t.deepEqual(queryString.parse('foo=true'), {foo: 'true'});
});

test('boolean value returns as boolean if option is set', t => {
	t.deepEqual(queryString.parse('foo=true', {parseBooleans: true}), {foo: true});
	t.deepEqual(queryString.parse('foo=false&bar=true', {parseBooleans: true}), {foo: false, bar: true});
});

test('parseBooleans works with arrayFormat', t => {
	t.deepEqual(queryString.parse('foo[]=true&foo[]=false&foo[]=true&bar=1', {parseBooleans: true, arrayFormat: 'bracket'}), {foo: [true, false, true], bar: '1'});
	t.deepEqual(queryString.parse('foo=true,false,a', {parseBooleans: true, arrayFormat: 'comma'}), {foo: [true, false, 'a']});
	t.deepEqual(queryString.parse('foo[0]=true&foo[1]=false&foo[2]', {parseBooleans: true, arrayFormat: 'index'}), {foo: [true, false, null]});
	t.deepEqual(queryString.parse('foo=true&foo=false&foo=3', {parseBooleans: true}), {foo: [true, false, '3']});
});

test('boolean value returns as boolean and number value as number if both options are set', t => {
	t.deepEqual(queryString.parse('foo=true&bar=1.12', {parseNumbers: true, parseBooleans: true}), {foo: true, bar: 1.12});
	t.deepEqual(queryString.parse('foo=16.32&bar=false', {parseNumbers: true, parseBooleans: true}), {foo: 16.32, bar: false});
});

test('parseNumbers and parseBooleans can work with arrayFormat at the same time', t => {
	t.deepEqual(queryString.parse('foo=true&foo=false&bar=1.12&bar=2', {parseNumbers: true, parseBooleans: true}), {foo: [true, false], bar: [1.12, 2]});
	t.deepEqual(queryString.parse('foo[]=true&foo[]=false&foo[]=true&bar[]=1&bar[]=2', {parseNumbers: true, parseBooleans: true, arrayFormat: 'bracket'}), {foo: [true, false, true], bar: [1, 2]});
	t.deepEqual(queryString.parse('foo=true,false&bar=1,2', {parseNumbers: true, parseBooleans: true, arrayFormat: 'comma'}), {foo: [true, false], bar: [1, 2]});
	t.deepEqual(queryString.parse('foo[0]=true&foo[1]=false&bar[0]=1&bar[1]=2', {parseNumbers: true, parseBooleans: true, arrayFormat: 'index'}), {foo: [true, false], bar: [1, 2]});
});

test('parse throws TypeError for invalid arrayFormatSeparator', t => {
	t.throws(() => {
		queryString.parse('', {arrayFormatSeparator: ',,'});
	}, {
		instanceOf: TypeError,
	});

	t.throws(() => {
		queryString.parse('', {arrayFormatSeparator: []});
	}, {
		instanceOf: TypeError,
	});
});

test('query strings having comma encoded and format option as `comma`', t => {
	const values = ['zero,one', 'two,three'];
	t.deepEqual(queryString.parse(`foo=${encodeURIComponent(values[0])},${encodeURIComponent(values[1])}`, {arrayFormat: 'comma'}), {
		foo: [
			'zero,one',
			'two,three',
		],
	});
});

test('value should not be decoded twice with `arrayFormat` option set as `separator`', t => {
	t.deepEqual(queryString.parse('foo=2020-01-01T00:00:00%2B03:00', {arrayFormat: 'separator'}), {
		foo: '2020-01-01T00:00:00+03:00',
	});
});

// See https://github.com/sindresorhus/query-string/issues/242
test('value separated by encoded comma will not be parsed as array with `arrayFormat` option set to `comma`', t => {
	const value = '1,2,3';
	t.deepEqual(queryString.parse(`id=${encodeURIComponent(value)}`, {arrayFormat: 'comma', parseNumbers: true}), {
		id: '1,2,3',
	});
});

test('query strings having (:list) colon-list-separator arrays', t => {
	t.deepEqual(queryString.parse('bar:list=one&bar:list=two', {arrayFormat: 'colon-list-separator'}), {bar: ['one', 'two']});
});

test('query strings having (:list) colon-list-separator arrays including null values', t => {
	t.deepEqual(queryString.parse('bar:list=one&bar:list=two&foo', {arrayFormat: 'colon-list-separator'}), {bar: ['one', 'two'], foo: null});
});

test('types option: can override a parsed number to be a string ', t => {
	const phoneNumber = '+380951234567';
	t.deepEqual(queryString.parse(`phoneNumber=${encodeURIComponent(phoneNumber)}`, {
		parseNumbers: true,
		types: {
			phoneNumber: 'string',
		},
	}), {phoneNumber: '+380951234567'});
});

test('types option: can override a parsed boolean value to be a string', t => {
	t.deepEqual(queryString.parse('question=true', {
		parseBooleans: true,
		types: {
			question: 'string',
		},
	}), {
		question: 'true',
	});
});

test('types option: can override parsed numbers arrays to be string[]', t => {
	t.deepEqual(queryString.parse('ids=999,998,997&items=1,2,3', {
		arrayFormat: 'comma',
		parseNumbers: true,
		types: {
			ids: 'string[]',
		},
	}), {
		ids: ['999', '998', '997'],
		items: [1, 2, 3],
	});
});

test('types option: can override string arrays to be number[]', t => {
	t.deepEqual(queryString.parse('ids=1,2,3&items=1,2,3', {
		arrayFormat: 'comma',
		types: {
			ids: 'number[]',
		},
	}), {
		ids: [1, 2, 3],
		items: ['1', '2', '3'],
	});
});

test('types option: can override an array to be string', t => {
	t.deepEqual(queryString.parse('ids=001,002,003&items=1,2,3', {
		arrayFormat: 'comma',
		parseNumbers: true,
		types: {
			ids: 'string',
		},
	}), {
		ids: '001,002,003',
		items: [1, 2, 3],
	});
});

test('types option: can override a separator array to be string ', t => {
	t.deepEqual(queryString.parse('ids=001|002|003&items=1|2|3', {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
		parseNumbers: true,
		types: {
			ids: 'string',
		},
	}), {
		ids: '001|002|003',
		items: [1, 2, 3],
	});
});

test('types option: when value is not of specified type, it will safely parse the value as string', t => {
	t.deepEqual(queryString.parse('id=example', {
		types: {
			id: 'number',
		},
	}), {
		id: 'example',
	});
});

test('types option: array types will have no effect if arrayFormat is set to "none"', t => {
	t.deepEqual(queryString.parse('ids=001,002,003&foods=apple,orange,mango', {
		arrayFormat: 'none',
		types: {
			ids: 'number[]',
			foods: 'string[]',
		},
	}), {
		ids: '001,002,003',
		foods: 'apple,orange,mango',
	});
});

test('types option: will parse the value as number if specified in type but parseNumbers is false', t => {
	t.deepEqual(queryString.parse('id=123', {
		arrayFormat: 'comma',
		types: {
			id: 'number',
		},
	}), {
		id: 123,
	});
});

test('types option: all supported types work in conjunction with one another', t => {
	t.deepEqual(queryString.parse('ids=001,002,003&items=1,2,3&price=22.00&numbers=1,2,3&double=5&number=20', {
		arrayFormat: 'comma',
		types: {
			ids: 'string',
			items: 'string[]',
			price: 'string',
			numbers: 'number[]',
			double: value => value * 2,
			number: 'number',
		},
	}), {
		ids: '001,002,003',
		items: ['1', '2', '3'],
		price: '22.00',
		numbers: [1, 2, 3],
		double: 10,
		number: 20,
	});
});

test('types option: single element with `{arrayFormat: "comma"} and type: string[]`', t => {
	t.deepEqual(queryString.parse('a=b', {
		arrayFormat: 'comma',
		types: {
			a: 'string[]',
		},
	}), {
		a: ['b'],
	});
});

test('types option: single element with `{arrayFormat: "comma"}, and type: number[]`', t => {
	t.deepEqual(queryString.parse('a=1', {
		arrayFormat: 'comma',
		types: {
			a: 'number[]',
		},
	}), {
		a: [1],
	});
});

test('types option: can parse boolean when parseboolean is false', t => {
	t.deepEqual(queryString.parse('a=true', {
		parsebooleans: false,
		types: {
			a: 'boolean',
		},
	}), {
		a: true,
	});
});

test('types option: boolean type accepts 1 and 0 as boolean values', t => {
	t.deepEqual(queryString.parse('a=1&b=0', {
		parsebooleans: false,
		types: {
			a: 'boolean',
			b: 'boolean',
		},
	}), {
		a: true,
		b: false,
	});
});

test('types option: boolean type accepts an empty string as true', t => {
	t.deepEqual(
		queryString.parse('a&b', {
			parsebooleans: false,
			types: {
				a: 'boolean',
				b: 'boolean',
			},
		}),
		{
			a: true,
			b: true,
		},
	);
});

test('types option: function types with arrays apply to each element', t => {
	// Test with comma format
	t.deepEqual(queryString.parse('scores=10,20,30', {
		arrayFormat: 'comma',
		types: {
			scores: value => Number(value) * 2,
		},
	}), {
		scores: [20, 40, 60],
	});

	// Test with bracket format
	t.deepEqual(queryString.parse('scores[]=5&scores[]=10&scores[]=15', {
		arrayFormat: 'bracket',
		types: {
			scores: value => Number(value) + 10,
		},
	}), {
		scores: [15, 20, 25],
	});

	// Test with separator format
	t.deepEqual(queryString.parse('scores=1|2|3', {
		arrayFormat: 'separator',
		arrayFormatSeparator: '|',
		types: {
			scores: value => `item-${value}`,
		},
	}), {
		scores: ['item-1', 'item-2', 'item-3'],
	});

	// Test function with single value still works
	t.deepEqual(queryString.parse('score=42', {
		types: {
			score: value => Number(value) / 2,
		},
	}), {
		score: 21,
	});

	// Test mixed types in same query
	t.deepEqual(queryString.parse('nums=1,2,3&single=10', {
		arrayFormat: 'comma',
		types: {
			nums: value => Number(value) * 3,
			single: value => Number(value) * 2,
		},
	}), {
		nums: [3, 6, 9],
		single: 20,
	});
});

test('types option: does not treat `Object.prototype` keys as custom types', t => {
	t.deepEqual(queryString.parse('toString=1&a=2', {types: {}}), {a: '2', toString: '1'});
	t.deepEqual(queryString.parse('valueOf=hello', {types: {}}), {valueOf: 'hello'});
	t.deepEqual(queryString.parse('hasOwnProperty=x', {types: {}}), {hasOwnProperty: 'x'});
	t.deepEqual(queryString.parse('constructor=1', {types: {}}), {constructor: '1'});
	t.deepEqual(queryString.parse('toString[]=1&toString[]=2', {arrayFormat: 'bracket', types: {}}), {toString: ['1', '2']});
});

test('parse index array format when sort is false', t => {
	t.deepEqual(queryString.parse('foo[1]=b&foo[0]=a&bar=baz', {arrayFormat: 'index', sort: false}), {foo: ['a', 'b'], bar: 'baz'});
	t.deepEqual(queryString.parse('foo[0]=a', {arrayFormat: 'index', sort: false}), {foo: ['a']});
});

test('parse index array format when sort is false with types', t => {
	t.deepEqual(queryString.parse('foo[1]=2&foo[0]=1', {arrayFormat: 'index', sort: false, types: {foo: 'number[]'}}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo[1]=2&foo[0]=1', {arrayFormat: 'index', sort: false, types: {foo: value => `${value}!`}}), {foo: ['1!', '2!']});
	t.deepEqual(queryString.parse('foo[1]=2&foo[0]=1', {arrayFormat: 'index', sort: false, parseNumbers: true}), {foo: [1, 2]});
});

test('parse index array format when sort is false with null and empty values', t => {
	t.deepEqual(queryString.parse('foo[2]&foo[0]=&foo[1]=one', {arrayFormat: 'index', sort: false}), {foo: ['', 'one', null]});
});

test('parse index array format with a custom sort function', t => {
	const sort = (key1, key2) => key2.localeCompare(key1);
	const parsed = queryString.parse('bar=x&foo[1]=b&foo[0]=a', {arrayFormat: 'index', sort});
	t.deepEqual(parsed, {foo: ['a', 'b'], bar: 'x'});
	t.deepEqual(Object.keys(parsed), ['foo', 'bar']);
});

test('index array format does not throw when a scalar precedes the indexed entries', t => {
	t.deepEqual(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo&foo[0]=2', {arrayFormat: 'index'}), {foo: [null, '2']});
	t.deepEqual(queryString.parse('foo=&foo[0]=2', {arrayFormat: 'index'}), {foo: ['', '2']});
	t.deepEqual(queryString.parse('foo=1&foo[1]=3&foo[0]=2&bar=x', {arrayFormat: 'index'}), {foo: ['1', '2', '3'], bar: 'x'});
	t.deepEqual(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', sort: false}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', types: {foo: 'number[]'}}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', types: {foo: 'string'}}), {foo: '1,2'});
	t.deepEqual(queryString.parse('foo=1&foo[0]=2', {arrayFormat: 'index', parseNumbers: true}), {foo: [1, 2]});
});

test('index array format preserves distinct explicit index strings', t => {
	t.deepEqual(queryString.parse('foo[01]=a&foo[1]=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo[9007199254740992]=a&foo[9007199254740993]=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo[01]=a&foo[01]=b', {arrayFormat: 'index'}), {foo: ['b']});
});

test('index array format appends entries without an index', t => {
	// `foo[]` is what PHP and Rack write for an array item without an index, and it is what `arrayFormat: 'bracket'` produces. Every such entry landed on the same empty index and silently overrode the previous one.
	t.deepEqual(queryString.parse('foo[]=1&foo[]=2&foo[]=3', {arrayFormat: 'index'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo[]=1', {arrayFormat: 'index'}), {foo: ['1']});
	t.deepEqual(queryString.parse('foo[]', {arrayFormat: 'index'}), {foo: [null]});
	t.deepEqual(queryString.parse('foo[]&foo[]=1&foo[]=', {arrayFormat: 'index'}), {foo: [null, '1', '']});
	t.deepEqual(queryString.parse('foo%5B%5D=1&foo%5B%5D=2', {arrayFormat: 'index'}), {foo: ['1', '2']});

	// Entries without an index take the next free index, like in PHP.
	t.deepEqual(queryString.parse('foo[0]=a&foo[]=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo[]=a&foo[1]=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo[]=a&foo[0]=b', {arrayFormat: 'index'}), {foo: ['b']});
	t.deepEqual(queryString.parse('foo[1]=b&foo[]=c&foo[0]=a', {arrayFormat: 'index'}), {foo: ['a', 'b', 'c']});
	t.deepEqual(queryString.parse('foo[]=a&foo[]=b&foo[1]=c', {arrayFormat: 'index'}), {foo: ['a', 'c']});
	t.deepEqual(queryString.parse('foo[5]=a&foo[]=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});

	// A plain value before the entries is the first item, like for indexed entries.
	t.deepEqual(queryString.parse('foo=a&foo[]=b&foo[]=c', {arrayFormat: 'index'}), {foo: ['a', 'b', 'c']});

	// Other keys are not affected, and the other options still apply.
	t.deepEqual(queryString.parse('foo[]=1&bar[]=2&foo[]=3', {arrayFormat: 'index'}), {foo: ['1', '3'], bar: ['2']});
	t.deepEqual(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', sort: false}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', parseNumbers: true}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', types: {foo: 'number[]'}}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo[]=1&foo[]=2', {arrayFormat: 'index', types: {foo: 'string'}}), {foo: '1,2'});
	t.deepEqual(queryString.parse('foo[]=a%20b&foo[]=c', {arrayFormat: 'index', decode: false}), {foo: ['a%20b', 'c']});

	// A bracket-format URL survives the URL helpers with the index format.
	t.is(queryString.pick('https://foo.bar?foo[]=1&foo[]=2&bar=3', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?foo[]=1&foo[]=2', query: {bar: 3}}, {arrayFormat: 'index'}), 'https://foo.bar?bar=3&foo[0]=1&foo[1]=2');
});

test('types option: an explicit type takes precedence over `parseNumbers` and `parseBooleans` when the value does not match the type', t => {
	t.deepEqual(queryString.parse('id=true', {types: {id: 'number'}, parseBooleans: true}), {id: 'true'});
	t.deepEqual(queryString.parse('id=abc', {types: {id: 'number'}, parseBooleans: true, parseNumbers: true}), {id: 'abc'});
	t.deepEqual(queryString.parse('flag=2', {types: {flag: 'boolean'}, parseNumbers: true}), {flag: '2'});
	t.deepEqual(queryString.parse('flag=yes', {types: {flag: 'boolean'}, parseNumbers: true, parseBooleans: true}), {flag: 'yes'});
	t.deepEqual(queryString.parse('ids=1,true', {arrayFormat: 'comma', types: {ids: 'number[]'}, parseBooleans: true}), {ids: [1, 'true']});
	t.deepEqual(queryString.parse('ids=1&ids=true', {types: {ids: 'number[]'}, parseBooleans: true}), {ids: [1, 'true']});
	t.deepEqual(queryString.parse('ids=1&ids=2', {types: {ids: 'number[]'}}), {ids: [1, 2]});
	t.deepEqual(queryString.parse('ids=1,2', {types: {ids: 'number[]'}}), {ids: '1,2'});
	t.deepEqual(queryString.parse('ids=1', {types: {ids: 'number[]'}}), {ids: '1'});
	t.deepEqual(queryString.parse('flags=true&flags=2', {types: {flags: 'boolean'}, parseNumbers: true}), {flags: [true, '2']});
	t.deepEqual(queryString.parse('id[]=true', {arrayFormat: 'bracket', types: {id: 'number[]'}, parseBooleans: true}), {id: ['true']});
});

test('types option: matching values are still parsed with an explicit type alongside `parseNumbers` and `parseBooleans`', t => {
	t.deepEqual(queryString.parse('id=1&flag=true&other=2&text=3', {
		types: {
			id: 'number',
			flag: 'boolean',
			text: 'string',
		},
		parseNumbers: true,
		parseBooleans: true,
	}), {
		id: 1,
		flag: true,
		other: 2,
		text: '3',
	});
	t.deepEqual(queryString.parse('flag', {types: {flag: 'boolean'}, parseNumbers: true}), {flag: true});
	t.deepEqual(queryString.parse('id', {types: {id: 'number'}, parseBooleans: true}), {id: null});
});

test('types option: `number[]` wraps a single value that is not a number in an array', t => {
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: ['abc']});
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'separator', arrayFormatSeparator: '|', types: {ids: 'number[]'}}), {ids: ['abc']});
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'bracket', types: {ids: 'number[]'}}), {ids: ['abc']});
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'index', types: {ids: 'number[]'}}), {ids: ['abc']});
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'bracket-separator', types: {ids: 'number[]'}}), {ids: ['abc']});
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'colon-list-separator', types: {ids: 'number[]'}}), {ids: ['abc']});
	t.deepEqual(queryString.parse('ids=', {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: ['']});
	t.deepEqual(queryString.parse('ids=true', {arrayFormat: 'comma', types: {ids: 'number[]'}, parseBooleans: true}), {ids: ['true']});
	t.deepEqual(queryString.parse('ids=1', {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: [1]});
	t.deepEqual(queryString.parse('ids=abc', {arrayFormat: 'none', types: {ids: 'number[]'}}), {ids: 'abc'});
	t.deepEqual(queryString.parse('ids', {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: [null]});
});

test('comma and separator array formats keep the values of a repeated key', t => {
	t.deepEqual(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'comma'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2,3&foo=4,5', {arrayFormat: 'comma'}), {foo: ['1', '2', '3', '4', '5']});
	t.deepEqual(queryString.parse('foo&foo=1', {arrayFormat: 'comma'}), {foo: [null, '1']});
	t.deepEqual(queryString.parse('foo=1&foo', {arrayFormat: 'comma'}), {foo: ['1', null]});
	t.deepEqual(queryString.parse('foo=a%2Cb&foo=c', {arrayFormat: 'comma'}), {foo: ['a,b', 'c']});
	t.deepEqual(queryString.parse('foo=1|2&foo=3', {arrayFormat: 'separator', arrayFormatSeparator: '|'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo=1,2&foo=3&bar=4', {arrayFormat: 'comma', parseNumbers: true}), {foo: [1, 2, 3], bar: 4});
	t.deepEqual(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma', types: {foo: 'string'}}), {foo: '1,2,3'});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'comma', sort: false}), {foo: ['1', '2']});
});

test('comma and separator array formats still parse a single key', t => {
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'comma'}), {foo: '1'});
	t.deepEqual(queryString.parse('foo=1,2', {arrayFormat: 'comma'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'comma'}), {foo: null});
	t.deepEqual(queryString.parse('foo=', {arrayFormat: 'comma'}), {foo: ''});
});

test('types option: explicit types combined with `parseNumbers` and `parseBooleans` edge cases', t => {
	t.deepEqual(queryString.parse('flag=0', {types: {flag: 'boolean'}, parseNumbers: true}), {flag: false});
	t.deepEqual(queryString.parse('flag=1', {types: {flag: 'boolean'}, parseNumbers: true}), {flag: true});
	t.deepEqual(queryString.parse('x=true', {types: {x: value => `fn:${value}`}, parseBooleans: true}), {x: 'fn:true'});
	t.deepEqual(queryString.parse('id=', {types: {id: 'number'}, parseNumbers: true}), {id: ''});
	t.deepEqual(queryString.parse('id', {types: {id: 'number'}, parseNumbers: true}), {id: null});
	t.deepEqual(queryString.parse('id=%20', {types: {id: 'number'}, parseNumbers: true}), {id: ' '});
});

test('types option: array types wrap a single value for every array format', t => {
	t.deepEqual(queryString.parse('ids[]=hello', {arrayFormat: 'bracket-separator', types: {ids: 'string[]'}}), {ids: ['hello']});
	t.deepEqual(queryString.parse('ids:list=42', {arrayFormat: 'colon-list-separator', types: {ids: 'number[]'}}), {ids: [42]});
	t.deepEqual(queryString.parse('ids=42', {arrayFormat: 'colon-list-separator', types: {ids: 'number[]'}}), {ids: [42]});
	t.deepEqual(queryString.parse('ids=5', {arrayFormat: 'comma', decode: false, types: {ids: 'number[]'}}), {ids: [5]});
	t.deepEqual(queryString.parse('ids', {arrayFormat: 'comma', types: {ids: 'string[]'}}), {ids: [null]});
	t.deepEqual(queryString.parse('ids=1', {arrayFormat: 'comma', types: {ids: 'string[]'}, parseNumbers: true}), {ids: ['1']});
	t.deepEqual(queryString.parse(queryString.stringify({ids: [1, 2, 3]}, {arrayFormat: 'comma'}), {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: [1, 2, 3]});
	t.deepEqual(queryString.parse(queryString.stringify({ids: [1]}, {arrayFormat: 'comma'}), {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: [1]});
	t.deepEqual(queryString.parse(queryString.stringify({ids: ['a']}, {arrayFormat: 'comma'}), {arrayFormat: 'comma', types: {ids: 'number[]'}}), {ids: ['a']});
});

test('comma and separator array formats merge a repeated key with types and other options', t => {
	t.deepEqual(queryString.parse('foo&foo&foo', {arrayFormat: 'comma'}), {foo: [null, null, null]});
	t.deepEqual(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma', types: {foo: 'number[]'}}), {foo: [1, 2, 3]});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'comma', types: {foo: 'number'}}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma', types: {foo: value => `${value}!`}}), {foo: ['1!', '2!', '3!']});
	t.deepEqual(queryString.parse('foo=a,b&foo=c', {arrayFormat: 'comma', decode: false}), {foo: ['a', 'b', 'c']});
	t.deepEqual(queryString.parse('foo=a%2Cb&foo=c', {arrayFormat: 'comma', decode: false}), {foo: ['a%2Cb', 'c']});
	t.deepEqual(queryString.parse('foo=a', {arrayFormat: 'separator', arrayFormatSeparator: '|'}), {foo: 'a'});
	t.is(queryString.stringify(queryString.parse('foo=1,2&foo=3', {arrayFormat: 'comma'}), {arrayFormat: 'comma'}), 'foo=1,2,3');
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=1,2&foo=3', {arrayFormat: 'comma'}), {url: 'https://foo.bar', query: {foo: ['1', '2', '3']}});
	t.is(queryString.pick('https://foo.bar?foo=1&foo=2&bar=3', ['foo'], {arrayFormat: 'comma'}), 'https://foo.bar?foo=1,2');
	t.is(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=3', ['bar'], {arrayFormat: 'comma'}), 'https://foo.bar?foo=1,2');
});

test('index array format keeps the values of a repeated key without an index', t => {
	// A repeated plain key is not in the array syntax of this format, so it is collected like with `arrayFormat: 'none'` and the other formats instead of silently dropping the earlier values.
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'index'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2&foo=3', {arrayFormat: 'index'}), {foo: ['1', '2', '3']});

	// A plain value after the indexed entries is appended, like `foo[]`.
	t.deepEqual(queryString.parse('foo[0]=1&foo=2', {arrayFormat: 'index'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo[0]=1&foo[1]=2&foo=3', {arrayFormat: 'index'}), {foo: ['1', '2', '3']});
	t.deepEqual(queryString.parse('foo[]=1&foo=2', {arrayFormat: 'index'}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo[1]=b&foo=c&foo[0]=a', {arrayFormat: 'index'}), {foo: ['a', 'b', 'c']});
	t.deepEqual(queryString.parse('foo[5]=a&foo=b', {arrayFormat: 'index'}), {foo: ['a', 'b']});
	t.deepEqual(queryString.parse('foo=a&foo[0]=b&foo=c', {arrayFormat: 'index'}), {foo: ['a', 'b', 'c']});
	t.deepEqual(queryString.parse('foo%5B0%5D=1&foo=2', {arrayFormat: 'index'}), {foo: ['1', '2']});

	// Null and empty values are kept.
	t.deepEqual(queryString.parse('foo&foo=', {arrayFormat: 'index'}), {foo: [null, '']});
	t.deepEqual(queryString.parse('foo[0]=1&foo', {arrayFormat: 'index'}), {foo: ['1', null]});
	t.deepEqual(queryString.parse('foo[0]=1&foo=', {arrayFormat: 'index'}), {foo: ['1', '']});

	// An explicit index still overrides the item at that index.
	t.deepEqual(queryString.parse('foo[0]=a&foo=b&foo[0]=c', {arrayFormat: 'index'}), {foo: ['c', 'b']});
	t.deepEqual(queryString.parse('foo[0]=1&foo=2&foo[1]=3', {arrayFormat: 'index'}), {foo: ['1', '3']});

	// Other keys are not affected, and the other options still apply.
	t.deepEqual(queryString.parse('foo=1&bar=x&foo=2', {arrayFormat: 'index'}), {foo: ['1', '2'], bar: 'x'});
	t.deepEqual(queryString.parse('foo[0]=1&foo=2', {arrayFormat: 'index', sort: false}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', sort: false}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', parseNumbers: true}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo=true&foo=false', {arrayFormat: 'index', parseBooleans: true}), {foo: [true, false]});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', types: {foo: 'number[]'}}), {foo: [1, 2]});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', types: {foo: 'string'}}), {foo: '1,2'});
	t.deepEqual(queryString.parse('foo=1&foo=2', {arrayFormat: 'index', types: {foo: value => `<${value}>`}}), {foo: ['<1>', '<2>']});
	t.deepEqual(queryString.parse('foo=a%20b&foo=c', {arrayFormat: 'index', decode: false}), {foo: ['a%20b', 'c']});

	// A single plain key is still a plain value.
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'index'}), {foo: '1'});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'index'}), {foo: null});

	// `stringify()` writes an array with this format using indexes, and the URL helpers keep every value of a repeated plain key.
	t.is(queryString.pick('https://foo.bar?foo=1&foo=2&bar=3', ['foo'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
	t.is(queryString.exclude('https://foo.bar?foo=1&foo=2&bar=3', ['bar'], {arrayFormat: 'index'}), 'https://foo.bar?foo[0]=1&foo[1]=2');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?foo=1&foo=2', query: {bar: 3}}, {arrayFormat: 'index'}), 'https://foo.bar?bar=3&foo[0]=1&foo[1]=2');
});

test('types option: array types turn a valueless key into an array with a null item', t => {
	// A valueless key is parsed as `null`. With an array type it is one item, like `foo=` is `['']`, and like a valueless item of a repeated key. Otherwise the type would not give an array for every value.
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'number[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'separator', arrayFormatSeparator: '|', types: {foo: 'string[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'bracket', types: {foo: 'string[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'index', types: {foo: 'number[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'colon-list-separator', types: {foo: 'string[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'bracket-separator', types: {foo: 'string[]'}}), {foo: [null]});

	// The other values of the type are unchanged.
	t.deepEqual(queryString.parse('foo=', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: ['']});
	t.deepEqual(queryString.parse('foo=1', {arrayFormat: 'comma', types: {foo: 'number[]'}}), {foo: [1]});
	t.deepEqual(queryString.parse('foo=1&foo', {arrayFormat: 'comma', types: {foo: 'number[]'}}), {foo: [1, null]});
	t.deepEqual(queryString.parse('foo[]', {arrayFormat: 'bracket', types: {foo: 'string[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo[]', {arrayFormat: 'bracket-separator', types: {foo: 'string[]'}}), {foo: []});

	// The other options do not change the item.
	t.deepEqual(queryString.parse('foo', {
		arrayFormat: 'comma',
		parseNumbers: true,
		parseBooleans: true,
		types: {foo: 'string[]'},
	}), {foo: [null]});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'comma', decode: false, types: {foo: 'number[]'}}), {foo: [null]});
	t.deepEqual(queryString.parse('foo&bar', {arrayFormat: 'comma', types: {foo: 'string[]'}}), {foo: [null], bar: null});

	// A valueless key with a non-array type, or with `arrayFormat: 'none'`, stays `null`.
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'string'}}), {foo: null});
	t.deepEqual(queryString.parse('foo', {arrayFormat: 'comma', types: {foo: 'number'}}), {foo: null});
	t.deepEqual(queryString.parse('foo', {types: {foo: 'string[]'}}), {foo: null});
	t.deepEqual(queryString.parse('foo', {types: {foo: 'number[]'}}), {foo: null});
});

test('types option: an array type takes precedence over `parseNumbers` and `parseBooleans` for a single value with `arrayFormat: "none"`', t => {
	t.deepEqual(queryString.parse('ids=1', {types: {ids: 'string[]'}, parseNumbers: true}), {ids: '1'});
	t.deepEqual(queryString.parse('ids=true', {types: {ids: 'string[]'}, parseBooleans: true}), {ids: 'true'});
	t.deepEqual(queryString.parse('ids=true', {types: {ids: 'number[]'}, parseBooleans: true}), {ids: 'true'});
	t.deepEqual(queryString.parse('ids=1', {
		arrayFormat: 'none', types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true,
	}), {ids: '1'});
	t.deepEqual(queryString.parse('ids=1&other=1', {types: {ids: 'string[]'}, parseNumbers: true}), {ids: '1', other: 1});
	// A repeated key is still an array, and its items are parsed with the element type.
	t.deepEqual(queryString.parse('ids=1&ids=true', {types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true}), {ids: ['1', 'true']});
});

test('types option: edge cases of a single value with an array type and `arrayFormat: "none"`', t => {
	// A value that is not a number is a string either way.
	t.deepEqual(queryString.parse('ids=1,2', {types: {ids: 'string[]'}, parseNumbers: true}), {ids: '1,2'});
	t.deepEqual(queryString.parse('ids=1,2', {types: {ids: 'number[]'}, parseNumbers: true}), {ids: '1,2'});
	// `0` and `1` are not booleans without an explicit `boolean` type.
	t.deepEqual(queryString.parse('flag=0', {types: {flag: 'string[]'}, parseBooleans: true}), {flag: '0'});
	t.deepEqual(queryString.parse('flag=false', {types: {flag: 'number[]'}, parseBooleans: true}), {flag: 'false'});
	// An empty value stays an empty string.
	t.deepEqual(queryString.parse('ids=', {types: {ids: 'number[]'}, parseNumbers: true}), {ids: ''});
	// A valueless key stays `null`.
	t.deepEqual(queryString.parse('ids', {types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true}), {ids: null});
	// The value is still decoded.
	t.deepEqual(queryString.parse('ids=%31', {types: {ids: 'string[]'}, parseNumbers: true}), {ids: '1'});
	t.deepEqual(queryString.parse('ids=%31', {types: {ids: 'string[]'}, parseNumbers: true, decode: false}), {ids: '%31'});
	// Other keys are still parsed with the general options.
	t.deepEqual(queryString.parse('ids=1&flag=true&n=2', {
		types: {ids: 'string[]'}, parseNumbers: true, parseBooleans: true, sort: false,
	}), {ids: '1', flag: true, n: 2});
	// A repeated key is an array, and its items are parsed with the element type, not the general options.
	t.deepEqual(queryString.parse('ids=1&ids=2', {types: {ids: 'string[]'}, parseNumbers: true}), {ids: ['1', '2']});
	t.deepEqual(queryString.parse('ids=1&ids=true', {types: {ids: 'number[]'}, parseBooleans: true}), {ids: [1, 'true']});
	t.deepEqual(queryString.parse('ids=1&ids', {types: {ids: 'number[]'}, parseBooleans: true}), {ids: [1, null]});
	// A custom function still takes precedence over the general options for a single value.
	t.deepEqual(queryString.parse('ids=1', {types: {ids: value => `<${value}>`}, parseNumbers: true}), {ids: '<1>'});
});

test('types option: a single value with an array type and `arrayFormat: "none"` stays a string in `parseUrl()`, `pick()`, and `exclude()`', t => {
	t.deepEqual(queryString.parseUrl('https://foo.bar?ids=1&n=1', {types: {ids: 'string[]'}, parseNumbers: true}), {url: 'https://foo.bar', query: {ids: '1', n: 1}});
	t.is(queryString.pick('https://foo.bar?ids=1&n=1', (key, value) => value === '1', {types: {ids: 'string[]'}, parseNumbers: true}), 'https://foo.bar?ids=1');
	t.is(queryString.exclude('https://foo.bar?ids=1&n=1', (key, value) => value === '1', {types: {ids: 'string[]'}, parseNumbers: true}), 'https://foo.bar?n=1');
});

test('index array format does not pollute the prototype with a `__proto__` key', t => {
	const parsed = queryString.parse('__proto__[0]=x&__proto__[1]=y', {arrayFormat: 'index'});
	t.deepEqual(Object.getOwnPropertyDescriptor(parsed, '__proto__').value, ['x', 'y']);
	t.is(Object.getPrototypeOf(parsed), null);
	t.deepEqual(Object.keys({}), []);
	t.false(0 in Object.prototype);
	t.deepEqual(queryString.parse('constructor=x&constructor=y'), {constructor: ['x', 'y']});
});

test('an option that is explicitly `undefined` uses its default', t => {
	// Passing through an optional setting, like `{decode: config.decode}`, must behave like leaving the option out.
	t.deepEqual(queryString.parse('foo=%26+bar', {decode: undefined}), {foo: '& bar'});
	t.deepEqual(queryString.parse('b=1&a=2', {sort: undefined}), {a: '2', b: '1'});
	t.deepEqual(Object.keys(queryString.parse('b=1&a=2', {sort: undefined})), ['a', 'b']);
	t.deepEqual(queryString.parse('foo=1,2', {arrayFormat: undefined}), {foo: '1,2'});
	t.deepEqual(queryString.parse('foo=1,2', {arrayFormat: 'comma', arrayFormatSeparator: undefined}), {foo: ['1', '2']});
	t.deepEqual(queryString.parse('foo=1&bar=true', {parseNumbers: undefined, parseBooleans: undefined, types: undefined}), {foo: '1', bar: 'true'});
	t.deepEqual(queryString.parseUrl('https://foo.bar?foo=%26', {decode: undefined}), {url: 'https://foo.bar', query: {foo: '&'}});
});

test('comma and separator array formats parse a key repeated many times without quadratic slowdown', t => {
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

	t.is(baseline.a.length, count);
	t.deepEqual(comma, baseline);
	t.deepEqual(separator, baseline);
	t.true(commaElapsedTime < (baselineElapsedTime * 5) + 50, `Expected the comma format to stay near the default format. Comma: ${commaElapsedTime}ms. Default: ${baselineElapsedTime}ms.`);
	t.true(separatorElapsedTime < (baselineElapsedTime * 5) + 50, `Expected the separator format to stay near the default format. Separator: ${separatorElapsedTime}ms. Default: ${baselineElapsedTime}ms.`);

	// A value with more items than a function call can take as arguments is appended without spreading it.
	const manyItems = Array.from({length: 300_000}, (_, index) => index).join(',');
	t.is(queryString.parse(`a=${manyItems}&a=${manyItems}`, {arrayFormat: 'comma'}).a.length, 600_000);
});
