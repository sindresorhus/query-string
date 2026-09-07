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

test('array stringify representation with brackets and separators when every item is skipped', t => {
	// After the items are skipped, the array is empty. An empty array is written as `bar[]`, like an empty array in the input, so the key is not lost.
	t.is(queryString.stringify({bar: [null]}, {arrayFormat: 'bracket-separator', skipNull: true}), 'bar[]');
	t.is(queryString.stringify({bar: [null, null]}, {arrayFormat: 'bracket-separator', skipNull: true}), 'bar[]');
	t.is(queryString.stringify({bar: ['']}, {arrayFormat: 'bracket-separator', skipEmptyString: true}), 'bar[]');
	t.is(queryString.stringify({bar: [null, '']}, {arrayFormat: 'bracket-separator', skipNull: true, skipEmptyString: true}), 'bar[]');
	t.is(queryString.stringify({bar: [undefined]}, {arrayFormat: 'bracket-separator'}), 'bar[]');
	t.is(queryString.stringify({bar: [undefined, undefined]}, {arrayFormat: 'bracket-separator'}), 'bar[]');
	t.is(queryString.stringify({bar: [1]}, {arrayFormat: 'bracket-separator', replacer: (key, value) => value === 1 ? undefined : value}), 'bar[]');
	t.is(queryString.stringify({bar: [null], foo: 'x'}, {arrayFormat: 'bracket-separator', skipNull: true}), 'bar[]&foo=x');
	t.is(queryString.stringify({bar: [null]}, {arrayFormat: 'bracket-separator', skipNull: true, encode: false}), 'bar[]');
	t.is(queryString.stringify({'a b': [null]}, {arrayFormat: 'bracket-separator', skipNull: true}), 'a%20b[]');

	// The result round-trips to an empty array.
	t.deepEqual(queryString.parse(queryString.stringify({bar: [null]}, {arrayFormat: 'bracket-separator', skipNull: true}), {arrayFormat: 'bracket-separator'}), {bar: []});

	// The other array formats have no representation for an empty array, so the key is dropped there, like for an empty array in the input.
	for (const arrayFormat of ['none', 'bracket', 'index', 'comma', 'separator', 'colon-list-separator']) {
		t.is(queryString.stringify({bar: [null]}, {arrayFormat, skipNull: true}), '', `${arrayFormat}: skipNull`);
		t.is(queryString.stringify({bar: [undefined]}, {arrayFormat}), '', `${arrayFormat}: undefined item`);
		t.is(queryString.stringify({bar: []}, {arrayFormat}), '', `${arrayFormat}: empty array`);
	}
});

test('a plain value that contains the separator is percent-encoded with the comma and separator formats', t => {
	// `parse()` splits every value on a literal separator with `comma` and `separator`, so a plain value that contains it would come back as an array.
	t.is(queryString.stringify({foo: 'a,b'}, {arrayFormat: 'comma'}), 'foo=a%2Cb');
	t.is(queryString.stringify({foo: 'a|b'}, {arrayFormat: 'separator', arrayFormatSeparator: '|'}), 'foo=a%7Cb');

	// `encodeURIComponent` leaves `-`, `.`, `_`, and `~` as-is, so those are encoded by hand.
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=a%2Db');
	t.is(queryString.stringify({foo: 'a.b'}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=a%2Eb');
	t.is(queryString.stringify({foo: 'a_b'}, {arrayFormat: 'separator', arrayFormatSeparator: '_'}), 'foo=a%5Fb');
	t.is(queryString.stringify({foo: 'a~b'}, {arrayFormat: 'separator', arrayFormatSeparator: '~'}), 'foo=a%7Eb');
	t.is(queryString.stringify({foo: 'a.b'}, {arrayFormat: 'comma', arrayFormatSeparator: '.'}), 'foo=a%2Eb');

	// `!`, `'`, `(`, `)`, and `*` are only encoded by the strict encoding. As a separator, they are encoded in both modes.
	t.is(queryString.stringify({foo: 'a!b'}, {arrayFormat: 'separator', arrayFormatSeparator: '!', strict: false}), 'foo=a%21b');
	t.is(queryString.stringify({foo: 'a(b)'}, {arrayFormat: 'separator', arrayFormatSeparator: '(', strict: false}), 'foo=a%28b)');
	t.is(queryString.stringify({foo: 'a*b'}, {arrayFormat: 'separator', arrayFormatSeparator: '*'}), 'foo=a%2Ab');

	// Every occurrence is encoded, also at the start and the end, and when the value is only the separator.
	t.is(queryString.stringify({foo: '-a--b-'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2Da%2D%2Db%2D');
	t.is(queryString.stringify({foo: '-'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2D');

	// A number is converted to a string first, so a decimal point is encoded with a `.` separator.
	t.is(queryString.stringify({foo: 1.5}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=1%2E5');
	t.is(queryString.stringify({foo: 15}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=15');

	// A separator that is a hex digit is encoded too, and the rest of the value is not searched for it inside a `%XX` escape.
	t.is(queryString.stringify({foo: 'aCb'}, {arrayFormat: 'separator', arrayFormatSeparator: 'C'}), 'foo=a%43b');
	t.is(queryString.stringify({foo: 'a,b'}, {arrayFormat: 'separator', arrayFormatSeparator: 'C'}), 'foo=a%2Cb');

	// A separator outside ASCII is percent-encoded anyway.
	t.is(queryString.stringify({foo: 'aåb'}, {arrayFormat: 'separator', arrayFormatSeparator: 'å'}), 'foo=a%C3%A5b');

	// The key is not split by `parse()`, so the separator in the key follows the normal encoding.
	t.is(queryString.stringify({'a-b': 'c'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'a-b=c');

	// A plain value and an array item are encoded the same way in one object.
	t.is(queryString.stringify({a: ['x-y', 'z'], b: 'x-y'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'a=x%2Dy-z&b=x%2Dy');

	// A null value has no separator to encode. An empty string is unaffected too.
	t.is(queryString.stringify({foo: null, bar: ''}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'bar=&foo');
	t.is(queryString.stringify({foo: null, bar: ''}, {
		arrayFormat: 'separator', arrayFormatSeparator: '-', skipNull: true, skipEmptyString: true,
	}), '');

	// The replacer runs before the encoding, so its result is encoded too.
	t.is(queryString.stringify({foo: 'x'}, {arrayFormat: 'separator', arrayFormatSeparator: '-', replacer: () => 'a-b'}), 'foo=a%2Db');

	// Without encoding, the value is written as-is.
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'separator', arrayFormatSeparator: '-', encode: false}), 'foo=a-b');

	// The other array formats do not split a plain value, so it keeps the normal encoding.
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '-'}), 'foo=a-b');
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'bracket', arrayFormatSeparator: '-'}), 'foo=a-b');
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'index', arrayFormatSeparator: '-'}), 'foo=a-b');
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'none', arrayFormatSeparator: '-'}), 'foo=a-b');

	// The value round-trips as a plain value, not as an array.
	for (const arrayFormatSeparator of ['-', '.', '_', '~', '!', '*', 'å', ',', '|']) {
		for (const arrayFormat of ['comma', 'separator']) {
			const options = {arrayFormat, arrayFormatSeparator};
			for (const value of [`a${arrayFormatSeparator}b`, arrayFormatSeparator, `${arrayFormatSeparator}${arrayFormatSeparator}`]) {
				t.deepEqual(queryString.parse(queryString.stringify({foo: value}, options), options), {foo: value}, `${arrayFormat} with ${JSON.stringify(arrayFormatSeparator)} and ${JSON.stringify(value)}`);
			}
		}
	}
});

test('array stringify representation with separators percent-encodes a separator inside an item', t => {
	// `parse()` only splits on a literal separator, so a separator inside an item must be percent-encoded, also when `encodeURIComponent` leaves it as-is, like `-`, `.`, `_`, and `~`.
	t.is(queryString.stringify({foo: ['a,b', 'c']}, {arrayFormat: 'comma'}), 'foo=a%2Cb,c');
	t.is(queryString.stringify({foo: ['a|b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '|'}), 'foo=a%7Cb|c');
	t.is(queryString.stringify({foo: ['a-b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=a%2Db-c');
	t.is(queryString.stringify({foo: ['a.b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=a%2Eb.c');
	t.is(queryString.stringify({foo: ['a_b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '_'}), 'foo=a%5Fb_c');
	t.is(queryString.stringify({foo: ['a~b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '~'}), 'foo=a%7Eb~c');
	t.is(queryString.stringify({foo: ['a-b', 'c']}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '-'}), 'foo[]=a%2Db-c');
	t.is(queryString.stringify({foo: ['a.b', 'c']}, {arrayFormat: 'comma', arrayFormatSeparator: '.'}), 'foo=a%2Eb.c');

	// Every occurrence is encoded, also at the start and the end of an item, and in a single-item array.
	t.is(queryString.stringify({foo: ['-a--b-']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2Da%2D%2Db%2D');
	t.is(queryString.stringify({foo: ['-', '-']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2D-%2D');
	t.is(queryString.stringify({foo: [1.5, 2]}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=1%2E5.2');

	// `!`, `'`, `(`, `)`, and `*` are only encoded by the strict encoding. As a separator, they are encoded in both modes.
	t.is(queryString.stringify({foo: ['a!b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '!', strict: false}), 'foo=a%21b!c');
	t.is(queryString.stringify({foo: ['a*b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '*', strict: false}), 'foo=a%2Ab*c');
	t.is(queryString.stringify({foo: ['a!b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '!'}), 'foo=a%21b!c');

	// The key is not an item, so the separator in the key follows the normal encoding.
	t.is(queryString.stringify({'a-b': ['c', 'd']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'a-b=c-d');

	// A scalar that contains the separator is encoded the same way, since `parse()` would otherwise split it into an array.
	t.is(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=a%2Db');

	// Without encoding, the item is written as-is.
	t.is(queryString.stringify({foo: ['a-b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '-', encode: false}), 'foo=a-b-c');

	// A separator outside ASCII is always percent-encoded inside an item, so it is already distinct from the literal separator.
	t.is(queryString.stringify({foo: ['aåb', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: 'å'}), 'foo=a%C3%A5båc');

	// A separator that is a hex digit must not be confused with the same character inside a `%XX` escape of another character.
	t.is(queryString.stringify({foo: ['a,b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: 'C'}), 'foo=a%2CbCc');
	t.is(queryString.stringify({foo: ['a b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '2'}), 'foo=a%20b2c');
	t.is(queryString.stringify({foo: ['a2b', 'c d']}, {arrayFormat: 'separator', arrayFormatSeparator: '2'}), 'foo=a%32b2c%20d');
	t.is(queryString.stringify({foo: ['*', 'b']}, {arrayFormat: 'separator', arrayFormatSeparator: 'A'}), 'foo=%2AAb');
	t.is(queryString.stringify({foo: ['a%b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '%'}), 'foo=a%25b%c');

	// The result round-trips.
	for (const arrayFormatSeparator of ['-', '.', '_', '~', '!', '*', 'x', 'å', ',', '|']) {
		for (const arrayFormat of ['separator', 'bracket-separator']) {
			const value = [`a${arrayFormatSeparator}b`, 'c', `${arrayFormatSeparator}`];
			const options = {arrayFormat, arrayFormatSeparator};
			t.deepEqual(queryString.parse(queryString.stringify({foo: value}, options), options), {foo: value}, `${arrayFormat} with ${arrayFormatSeparator}`);
			t.deepEqual(queryString.parse(queryString.stringify({foo: value}, {...options, strict: false}), options), {foo: value}, `${arrayFormat} with ${arrayFormatSeparator} and strict false`);
		}
	}
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
	}), 'bar:list=one&bar:list&foo');
});

test('array stringify representation with (:list) colon-list-separator keeps null values distinct from empty strings', t => {
	const options = {arrayFormat: 'colon-list-separator'};

	t.is(queryString.stringify({foo: [null]}, options), 'foo:list');
	t.is(queryString.stringify({foo: [null, null]}, options), 'foo:list&foo:list');
	t.is(queryString.stringify({foo: [null, '', 'a']}, options), 'foo:list&foo:list=&foo:list=a');
	t.is(queryString.stringify({foo: ['a b', null]}, {...options, encode: false}), 'foo:list=a b&foo:list');
	t.is(queryString.stringify({foo: [null, 'a']}, {...options, skipNull: true}), 'foo:list=a');
	t.is(queryString.stringify({foo: [null, '', 'a']}, {...options, skipEmptyString: true}), 'foo:list&foo:list=a');
	t.is(queryString.stringify({foo: [undefined, null]}, options), 'foo:list');
});

test('array stringify representation with (:list) colon-list-separator round-trips null values', t => {
	const options = {arrayFormat: 'colon-list-separator'};
	const object = {foo: [null, '', 'a'], bar: null};
	const stringified = queryString.stringify(object, options);

	t.is(stringified, 'bar&foo:list&foo:list=&foo:list=a');
	t.deepEqual(queryString.parse(stringified, options), object);
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

test('should sort keys when sort is true', t => {
	t.is(queryString.stringify({b: 1, c: 2, a: 3}, {sort: true}), 'a=3&b=1&c=2');
});

test('should sort keys when sort is true and values are arrays', t => {
	t.is(queryString.stringify({b: [2, 1], a: 'x'}, {sort: true, arrayFormat: 'bracket'}), 'a=x&b[]=2&b[]=1');
});

test('should sort keys when sort is true with skipNull and skipEmptyString', t => {
	t.is(queryString.stringify({c: '', b: null, a: 1}, {sort: true, skipNull: true, skipEmptyString: true}), 'a=1');
	t.is(queryString.stringify({c: '', b: null, a: 1}, {sort: true}), 'a=1&b&c=');
});

test('should sort keys when sort is true and the object has one key', t => {
	t.is(queryString.stringify({a: 1}, {sort: true}), 'a=1');
	t.is(queryString.stringify({}, {sort: true}), '');
});

test('throws a TypeError for unsupported value types', t => {
	const expectation = {instanceOf: TypeError, message: /Unsupported value type/};

	t.throws(() => queryString.stringify({a: {}}), expectation);
	t.throws(() => queryString.stringify({a: new Date()}), expectation);
	t.throws(() => queryString.stringify({a: new Map()}), expectation);
	t.throws(() => queryString.stringify({a() {}}), expectation);
	t.throws(() => queryString.stringify({a: Symbol('a')}), expectation);
	t.throws(() => queryString.stringify({a: {}}, {encode: false}), expectation);
	t.throws(() => queryString.stringify({a: {}}, {strict: false}), expectation);
});

test('throws a TypeError for unsupported value types inside arrays', t => {
	const expectation = {instanceOf: TypeError, message: /Unsupported value type/};

	for (const arrayFormat of ['none', 'bracket', 'index', 'comma', 'separator', 'bracket-separator', 'colon-list-separator']) {
		t.throws(() => queryString.stringify({a: [1, {}]}, {arrayFormat}), expectation, `${arrayFormat}: object`);
		t.throws(() => queryString.stringify({a: [[1, 2]]}, {arrayFormat}), expectation, `${arrayFormat}: nested array`);
		t.throws(() => queryString.stringify({a: [new Date()]}, {arrayFormat, encode: false}), expectation, `${arrayFormat}: encode false`);
	}
});

test('does not throw for unsupported value types that the replacer transforms', t => {
	t.is(queryString.stringify({a: {b: 1}, c: [new Date(0)]}, {
		replacer(key, value) {
			if (value instanceof Date) {
				return value.getTime();
			}

			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				return JSON.stringify(value);
			}

			return value;
		},
	}), 'a=%7B%22b%22%3A1%7D&c=0');
});

test('does not throw for supported value types', t => {
	t.is(queryString.stringify({
		a: 'a',
		b: 1,
		c: 1n,
		d: true,
		e: null,
		f: undefined,
		g: ['a', 1, 1n, true, null, undefined],
	}), 'a=a&b=1&c=1&d=true&e&g=a&g=1&g=1&g=true&g');
});

test('drops a key named `__proto__`', t => {
	// Intentional: the keys are copied into a plain object, where assigning `__proto__` sets the prototype instead of a property.
	t.is(queryString.stringify({['__proto__']: 'a', b: 'c'}), 'b=c');
	t.is(queryString.stringify(queryString.parse('__proto__=a&b=c')), 'b=c');
	t.is(queryString.stringify({['__proto__']: ['a', 'b']}, {arrayFormat: 'bracket'}), '');
	t.is(queryString.stringify({['__proto__']: null}), '');
	t.is(queryString.stringify({['__proto__']: null, a: 1}, {skipNull: true}), 'a=1');
	t.is(queryString.stringify({['__proto__']: '', a: 1}, {skipEmptyString: true}), 'a=1');
	t.deepEqual(Object.keys(queryString.parse('__proto__=a&b=c')), ['__proto__', 'b']);
});

test('skipNull and skipEmptyString apply to the value returned by the replacer', t => {
	t.is(queryString.stringify({a: 1, b: 2}, {skipNull: true, replacer: (key, value) => key === 'a' ? null : value}), 'b=2');
	t.is(queryString.stringify({a: 1, b: 2}, {skipEmptyString: true, replacer: (key, value) => key === 'a' ? '' : value}), 'b=2');
	t.is(queryString.stringify({a: null, b: ''}, {skipNull: true, skipEmptyString: true, replacer: (key, value) => value === null ? 'was-null' : (value === '' ? 'was-empty' : value)}), 'a=was-null&b=was-empty');
	t.is(queryString.stringify({a: undefined}, {skipNull: true, replacer: () => 'x'}), 'a=x');
	t.is(queryString.stringify({a: [1, 2]}, {skipNull: true, replacer: (key, value) => Array.isArray(value) ? value : (value === 1 ? null : value)}), 'a=2');
	t.is(queryString.stringify({a: [1, 2]}, {arrayFormat: 'bracket', skipEmptyString: true, replacer: (key, value) => Array.isArray(value) ? value : (value === 1 ? '' : value)}), 'a[]=2');
});

test('skipNull and skipEmptyString still apply without a replacer', t => {
	t.is(queryString.stringify({
		a: null,
		b: '',
		c: undefined,
		d: 1,
	}, {skipNull: true, skipEmptyString: true}), 'd=1');
	t.is(queryString.stringify({a: null, b: '', d: 1}, {skipNull: true}), 'b=&d=1');
	t.is(queryString.stringify({a: null, b: '', d: 1}, {skipEmptyString: true}), 'a&d=1');
	t.is(queryString.stringify({a: null, b: ''}, {
		skipNull: true,
		skipEmptyString: true,
		sort: false,
	}), '');
});

test('skipNull and skipEmptyString with a replacer and array formats', t => {
	t.is(queryString.stringify({a: [1, null, 2]}, {arrayFormat: 'bracket', skipNull: true, replacer: (key, value) => value}), 'a[]=1&a[]=2');
	t.is(queryString.stringify({a: [1, null, 2]}, {arrayFormat: 'comma', skipNull: true, replacer: (key, value) => value}), 'a=1,2');
	t.is(queryString.stringify({a: [1, 2, 3]}, {arrayFormat: 'index', skipNull: true, replacer: (key, value) => value === 2 ? null : value}), 'a[0]=1&a[1]=3');
	t.is(queryString.stringify({a: null, b: 1}, {skipNull: true, replacer: (key, value) => value === null ? 'rescued' : value}), 'a=rescued&b=1');
	t.is(queryString.stringify({a: 1, b: ''}, {skipEmptyString: true, replacer: (key, value) => key === 'a' ? '' : value}), '');
	t.is(queryString.stringify({a: 1, b: 2}, {skipNull: true, replacer: (key, value) => key === 'a' ? undefined : value}), 'b=2');
});

test('an option that is explicitly `undefined` uses its default', t => {
	// Passing through an optional setting, like `{encode: config.encode}`, must behave like leaving the option out.
	t.is(queryString.stringify({foo: 'a&b=c'}, {encode: undefined}), 'foo=a%26b%3Dc');
	t.is(queryString.stringify({foo: '!'}, {strict: undefined}), 'foo=%21');
	t.is(queryString.stringify({b: 1, a: 2}, {sort: undefined}), 'a=2&b=1');
	t.is(queryString.stringify({foo: [1, 2]}, {arrayFormat: undefined}), 'foo=1&foo=2');
	t.is(queryString.stringify({foo: [1, 2]}, {arrayFormat: 'comma', arrayFormatSeparator: undefined}), 'foo=1,2');
	t.is(queryString.stringify({foo: null, bar: ''}, {skipNull: undefined, skipEmptyString: undefined, replacer: undefined}), 'bar=&foo');
});

test('reads each value once', t => {
	// A getter or a `Proxy` trap runs once per key, so a value that changes on every read, like a counter, is written from the one read, and a costly getter is not called twice.
	let reads = 0;
	t.is(queryString.stringify({
		get foo() {
			reads++;
			return reads;
		},
	}), 'foo=1');
	t.is(reads, 1);

	reads = 0;
	t.is(queryString.stringify({
		get foo() {
			reads++;
			return [reads, 'x'];
		},
	}, {arrayFormat: 'comma'}), 'foo=1,x');
	t.is(reads, 1);

	reads = 0;
	t.is(queryString.stringify({
		get foo() {
			reads++;
			return reads;
		},
	}, {replacer: (key, value) => value * 10}), 'foo=10');
	t.is(reads, 1);

	const trapped = [];
	const proxy = new Proxy({b: 1, a: 2}, {
		get(target, key) {
			trapped.push(key);
			return target[key];
		},
	});
	t.is(queryString.stringify(proxy, {sort: false}), 'b=1&a=2');
	t.deepEqual(trapped, ['b', 'a']);
});
