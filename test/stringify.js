import test from 'ava';
import queryString from '../index.js';

test('stringify', t => {
	t.is(queryString.stringify({foo: 'bar'}), 'foo=bar');
	t.is(queryString.stringify({
		foo: 'bar',
		bar: 'baz',
	}), 'bar=baz&foo=bar');
});

test('different types', t => {
	t.is(queryString.stringify(), '');
	t.is(queryString.stringify(0), '');
});

test('primitive types', t => {
	t.is(queryString.stringify({a: 'string'}), 'a=string');
	t.is(queryString.stringify({a: true, b: false}), 'a=true&b=false');
	t.is(queryString.stringify({a: 0, b: 1n}), 'a=0&b=1');
	t.is(queryString.stringify({a: null, b: undefined}), 'a');
});

test('URI encode', t => {
	t.is(queryString.stringify({'foo bar': 'baz faz'}), 'foo%20bar=baz%20faz');
	t.is(queryString.stringify({'foo bar': 'baz\'faz'}), 'foo%20bar=baz%27faz');
});

test('no encoding', t => {
	t.is(queryString.stringify({'foo:bar': 'baz:faz'}, {encode: false}), 'foo:bar=baz:faz');
});

test('handle array value', t => {
	t.is(queryString.stringify({
		abc: 'abc',
		foo: ['bar', 'baz'],
	}), 'abc=abc&foo=bar&foo=baz');
});

test('stringifies large arrays without quadratic slowdown', t => {
	const count = 20_000;
	const array = Array.from({length: count}, () => '1');
	const object = Object.fromEntries(Array.from({length: count}, (_, index) => [`a${index}`, '1']));
	const arrayFormats = [
		'none',
		'bracket',
		'index',
		'colon-list-separator',
	];

	const objectStartTime = performance.now();
	queryString.stringify(object);
	const objectElapsedTime = performance.now() - objectStartTime;

	for (const arrayFormat of arrayFormats) {
		const arrayStartTime = performance.now();
		const result = queryString.stringify({a: array}, {arrayFormat});
		const arrayElapsedTime = performance.now() - arrayStartTime;

		t.true(result.length > count);
		t.true(arrayElapsedTime < (objectElapsedTime * 10) + 100, `Expected ${arrayFormat} stringify to stay near the scalar-object baseline. Array: ${arrayElapsedTime}ms. Object: ${objectElapsedTime}ms.`);
	}
});

test('stringifies large separator arrays without quadratic slowdown', t => {
	const count = 100_000;
	const array = Array.from({length: count}, () => '1');
	const object = Object.fromEntries(Array.from({length: count}, (_, index) => [`a${index}`, '1']));
	const arrayFormats = [
		'comma',
		'separator',
		'bracket-separator',
	];

	const objectStartTime = performance.now();
	queryString.stringify(object);
	const objectElapsedTime = performance.now() - objectStartTime;

	for (const arrayFormat of arrayFormats) {
		const arrayStartTime = performance.now();
		const result = queryString.stringify({a: array}, {arrayFormat});
		const arrayElapsedTime = performance.now() - arrayStartTime;

		t.true(result.length > count);
		t.true(arrayElapsedTime < (objectElapsedTime * 5) + 100, `Expected ${arrayFormat} stringify to stay near the scalar-object baseline. Array: ${arrayElapsedTime}ms. Object: ${objectElapsedTime}ms.`);
	}
});

test('array order', t => {
	t.is(queryString.stringify({
		abc: 'abc',
		foo: ['baz', 'bar'],
	}), 'abc=abc&foo=baz&foo=bar');
});

test('handle empty array value', t => {
	t.is(queryString.stringify({
		abc: 'abc',
		foo: [],
	}), 'abc=abc');
});

test('should not encode undefined values', t => {
	t.is(queryString.stringify({
		abc: undefined,
		foo: 'baz',
	}), 'foo=baz');
});

test('should encode null values as just a key', t => {
	t.is(queryString.stringify({
		'x y z': null,
		abc: null,
		foo: 'baz',
	}), 'abc&foo=baz&x%20y%20z');
});

test('handle null values in array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [null, 'baz'],
	}), 'bar&bar=baz&foo');
});

test('handle undefined values in array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [undefined, 'baz'],
	}), 'bar=baz&foo');
});

test('handle undefined and null values in array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [undefined, null, 'baz'],
	}), 'bar&bar=baz&foo');
});

test('strict encoding', t => {
	t.is(queryString.stringify({foo: '\'bar\''}), 'foo=%27bar%27');
	t.is(queryString.stringify({foo: ['\'bar\'', '!baz']}), 'foo=%27bar%27&foo=%21baz');
});

test('loose encoding', t => {
	t.is(queryString.stringify({foo: '\'bar\''}, {strict: false}), 'foo=\'bar\'');
	t.is(queryString.stringify({foo: ['\'bar\'', '!baz']}, {strict: false}), 'foo=\'bar\'&foo=!baz');
});

test('array stringify representation with array indexes', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'index',
	}), 'bar[0]=one&bar[1]=two&foo');
});

test('array stringify representation with array brackets', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'bracket',
	}), 'bar[]=one&bar[]=two&foo');
});

test('array stringify representation with array brackets and null value', t => {
	t.is(queryString.stringify({
		foo: ['a', null, ''],
		bar: [null],
	}, {
		arrayFormat: 'bracket',
	}), 'bar[]&foo[]=a&foo[]&foo[]=');
});

test('array stringify representation with array commas', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'comma',
	}), 'bar=one,two&foo');
});

test('array stringify representation with array commas, null & empty string', t => {
	t.is(queryString.stringify({
		c: [null, 'a', '', null],
		b: [null],
		a: [''],
	}, {
		arrayFormat: 'comma',
	}), 'a=&b=&c=,a,,');
});

test('array stringify representation with array commas, null & empty string (skip both)', t => {
	t.is(queryString.stringify({
		c: [null, 'a', '', null],
		b: [null],
		a: [''],
	}, {
		skipNull: true,
		skipEmptyString: true,
		arrayFormat: 'comma',
	}), 'c=a');
});

test('array stringify representation with array commas and 0 value', t => {
	t.is(queryString.stringify({
		foo: ['a', null, 0],
		bar: [null],
	}, {
		arrayFormat: 'comma',
	}), 'bar=&foo=a,,0');
});

test('array stringify representation with a bad array format', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'badinput',
	}), 'bar=one&bar=two&foo');
});

test('array stringify representation with array indexes and sparse array', t => {
	const fixture = ['one', 'two'];
	fixture[10] = 'three';
	t.is(queryString.stringify({bar: fixture}, {arrayFormat: 'index'}), 'bar[0]=one&bar[1]=two&bar[2]=three');
});

test('array stringify representation with brackets and separators with empty array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]&foo');
});

test('array stringify representation with brackets and separators with single value', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one'],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=one&foo');
});

test('array stringify representation with brackets and separators with multiple values', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two', 'three'],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=one,two,three&foo');
});

test('array stringify representation with brackets and separators with a single empty string', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [''],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=&foo');
});

test('array stringify representation with brackets and separators with a multiple empty string', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['', 'two', ''],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=,two,&foo');
});

test('array stringify representation with brackets and separators with dropped empty strings', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['', 'two', ''],
	}, {
		arrayFormat: 'bracket-separator',
		skipEmptyString: true,
	}), 'bar[]=two&foo');
});

test('array stringify representation with brackets and separators with dropped null values', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', null, 'three', null, '', 'six'],
	}, {
		arrayFormat: 'bracket-separator',
		skipNull: true,
	}), 'bar[]=one,three,,six');
});

test('should sort keys in given order', t => {
	const fixture = ['c', 'a', 'b'];
	const sort = (key1, key2) => fixture.indexOf(key1) - fixture.indexOf(key2);

	t.is(queryString.stringify({a: 'foo', b: 'bar', c: 'baz'}, {sort}), 'c=baz&a=foo&b=bar');
});

test('should not sort when sort is false', t => {
	const fixture = {
		story: 'a',
		patch: 'b',
		deployment: 'c',
		lat: 10,
		lng: 20,
		sb: 'd',
		sc: 'e',
		mn: 'f',
		ln: 'g',
		nf: 'h',
		srs: 'i',
		destination: 'g',
	};
	t.is(queryString.stringify(fixture, {sort: false}), 'story=a&patch=b&deployment=c&lat=10&lng=20&sb=d&sc=e&mn=f&ln=g&nf=h&srs=i&destination=g');
});

test('should disable sorting', t => {
	t.is(queryString.stringify({
		c: 'foo',
		b: 'bar',
		a: 'baz',
	}, {
		sort: false,
	}), 'c=foo&b=bar&a=baz');
});

test('should ignore null when skipNull is set', t => {
	t.is(queryString.stringify({
		a: 1,
		b: null,
		c: 3,
	}, {
		skipNull: true,
	}), 'a=1&c=3');
});

test('should ignore emptyString when skipEmptyString is set', t => {
	t.is(queryString.stringify({
		a: 1,
		b: '',
		c: 3,
	}, {
		skipEmptyString: true,
	}), 'a=1&c=3');
});

test('should ignore undefined when skipNull is set', t => {
	t.is(queryString.stringify({
		a: 1,
		b: undefined,
		c: 3,
	}, {
		skipNull: true,
	}), 'a=1&c=3');
});

test('should ignore both null and undefined when skipNull is set', t => {
	t.is(queryString.stringify({
		a: undefined,
		b: null,
	}, {
		skipNull: true,
	}), '');
});

test('should ignore both null and undefined when skipNull is set for arrayFormat', t => {
	t.is(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
	}), 'a=1&a=2&c=1');

	t.is(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
		arrayFormat: 'bracket',
	}), 'a[]=1&a[]=2&c=1');

	t.is(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
		arrayFormat: 'comma',
	}), 'a=1,2&c=1');

	t.is(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
		arrayFormat: 'index',
	}), 'a[0]=1&a[1]=2&c=1');
});

test('should ignore empty string when skipEmptyString is set for arrayFormat', t => {
	t.is(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
	}), 'a=1&a=2&c=1');

	t.is(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
		arrayFormat: 'bracket',
	}), 'a[]=1&a[]=2&c=1');

	t.is(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
		arrayFormat: 'comma',
	}), 'a=1,2&c=1');

	t.is(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
		arrayFormat: 'index',
	}), 'a[0]=1&a[1]=2&c=1');

	t.is(queryString.stringify({
		a: ['', '', '', ''],
		c: 1,
	}, {
		skipEmptyString: true,
	}), 'c=1');
});

test('stringify throws TypeError for invalid arrayFormatSeparator', t => {
	t.throws(_ => queryString.stringify({}, {arrayFormatSeparator: ',,'}), {
		instanceOf: TypeError,
	});
	t.throws(_ => queryString.stringify({}, {arrayFormatSeparator: []}), {
		instanceOf: TypeError,
	});
});

test('array stringify representation with (:list) colon-list-separator', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'colon-list-separator',
	}), 'bar:list=one&bar:list=two&foo');
});

test('array stringify representation with (:list) colon-list-separator with null values', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', ''],
	}, {
		arrayFormat: 'colon-list-separator',
	}), 'bar:list=one&bar:list=&foo');
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', null],
	}, {
		arrayFormat: 'colon-list-separator',
	}), 'bar:list=one&bar:list=&foo');
});

test('replacer option transforms Date objects to ISO strings', t => {
	const date = new Date('2024-01-15T10:30:00.000Z');
	t.is(queryString.stringify({
		name: 'John',
		created: date,
	}, {
		replacer(key, value) {
			if (value instanceof Date) {
				return value.toISOString();
			}

			return value;
		},
	}), 'created=2024-01-15T10%3A30%3A00.000Z&name=John');
});

test('replacer option can omit null values', t => {
	t.is(queryString.stringify({
		a: 1,
		b: null,
		c: 3,
	}, {
		replacer: (key, value) => value === null ? undefined : value,
	}), 'a=1&c=3');
});

test('replacer option can transform specific keys', t => {
	t.is(queryString.stringify({
		price: 10,
		quantity: 5,
	}, {
		replacer(key, value) {
			if (key === 'price' && typeof value === 'number') {
				return `$${value}`;
			}

			return value;
		},
	}), 'price=%2410&quantity=5');
});

test('replacer option can filter array elements', t => {
	t.is(queryString.stringify({
		tags: ['one', 'two', 'three'],
	}, {
		replacer(key, value) {
			if (key.startsWith('tags[') && value === 'two') {
				return undefined; // Skip 'two'
			}

			return value;
		},
	}), 'tags=one&tags=three');
});

test('replacer option returning undefined for all values results in empty string', t => {
	t.is(queryString.stringify({
		a: 1,
		b: 2,
	}, {
		replacer: () => undefined,
	}), '');
});

test('replacer option can transform array to string', t => {
	t.is(queryString.stringify({
		tags: ['one', 'two', 'three'],
	}, {
		replacer(key, value) {
			if (Array.isArray(value)) {
				return value.join('|');
			}

			return value;
		},
	}), 'tags=one%7Ctwo%7Cthree');
});

test('replacer option works with bracket array format', t => {
	t.is(queryString.stringify({
		items: [1, 2, 3],
	}, {
		arrayFormat: 'bracket',
		replacer(key, value) {
			if (typeof value === 'number') {
				return value * 10;
			}

			return value;
		},
	}), 'items[]=10&items[]=20&items[]=30');
});

test('replacer option handles edge cases correctly', t => {
	t.is(queryString.stringify({
		undefinedValue: undefined,
		nullValue: null,
		empty: '',
		zero: 0,
		false: false,
	}, {
		replacer: (key, value) => value,
	}), 'empty=&false=false&nullValue&zero=0');
});

test('replacer option can handle Symbol without crashing', t => {
	const symbol = Symbol('test');
	t.is(queryString.stringify({
		a: 1,
		b: symbol,
	}, {
		replacer(key, value) {
			if (typeof value === 'symbol') {
				return 'symbol-value';
			}

			return value;
		},
	}), 'a=1&b=symbol-value');
});

test('replacer option works with comma array format', t => {
	t.is(queryString.stringify({
		colors: ['red', 'green', 'blue'],
	}, {
		arrayFormat: 'comma',
		replacer(key, value) {
			if (key.startsWith('colors[') && value === 'green') {
				return 'GREEN';
			}

			return value;
		},
	}), 'colors=red,GREEN,blue');
});

test('replacer option is called with correct keys for index array format', t => {
	const replacerKeys = [];
	queryString.stringify({
		items: ['x', 'y'],
	}, {
		arrayFormat: 'index',
		replacer(key, value) {
			replacerKeys.push(key);
			return value;
		},
	});
	t.deepEqual(replacerKeys, ['items', 'items[0]', 'items[1]']);
});

test('replacer option can transform objects to JSON strings', t => {
	t.is(queryString.stringify({
		data: {nested: 'value'},
	}, {
		replacer(key, value) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				return JSON.stringify(value);
			}

			return value;
		},
	}), 'data=%7B%22nested%22%3A%22value%22%7D');
});
