/* eslint-disable node-test/no-conditional-assertion -- Many tests here are table-driven, so the assertions sit inside a loop over the cases. The loop always runs, and every case is checked. */
import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('stringify', () => {
	assert.equal(queryString.stringify({foo: 'bar'}), 'foo=bar');
	assert.equal(queryString.stringify({
		foo: 'bar',
		bar: 'baz',
	}), 'bar=baz&foo=bar');
});

test('different types', () => {
	assert.equal(queryString.stringify(), '');
	assert.equal(queryString.stringify(0), '');
});

test('primitive types', () => {
	assert.equal(queryString.stringify({a: 'string'}), 'a=string');
	assert.equal(queryString.stringify({a: true, b: false}), 'a=true&b=false');
	assert.equal(queryString.stringify({a: 0, b: 1n}), 'a=0&b=1');
	assert.equal(queryString.stringify({a: null, b: undefined}), 'a');
});

test('URI encode', () => {
	assert.equal(queryString.stringify({'foo bar': 'baz faz'}), 'foo%20bar=baz%20faz');
	assert.equal(queryString.stringify({'foo bar': 'baz\'faz'}), 'foo%20bar=baz%27faz');
});

test('no encoding', () => {
	assert.equal(queryString.stringify({'foo:bar': 'baz:faz'}, {encode: false}), 'foo:bar=baz:faz');
});

test('handle array value', () => {
	assert.equal(queryString.stringify({
		abc: 'abc',
		foo: ['bar', 'baz'],
	}), 'abc=abc&foo=bar&foo=baz');
});

test('stringifies large arrays without quadratic slowdown', () => {
	// The additive term below is a ceiling for garbage collection, not for the
	// stringify. These inputs are megabytes long, so collecting them costs a few
	// hundred milliseconds however the code is written. The factor is what
	// catches a quadratic slowdown, which on an input this size takes seconds.
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

		assert.ok(result.length > count);
		assert.ok(
			arrayElapsedTime < (objectElapsedTime * 10) + 1000,
			`Expected ${arrayFormat} stringify to stay near the scalar-object baseline. Array: ${arrayElapsedTime}ms. Object: ${objectElapsedTime}ms.`,
		);
	}
});

test('stringifies large separator arrays without quadratic slowdown', () => {
	// The additive term below is a ceiling for garbage collection, not for the
	// stringify. These inputs are megabytes long, so collecting them costs a few
	// hundred milliseconds however the code is written. The factor is what
	// catches a quadratic slowdown, which on an input this size takes seconds.
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

		assert.ok(result.length > count);
		assert.ok(
			arrayElapsedTime < (objectElapsedTime * 5) + 1000,
			`Expected ${arrayFormat} stringify to stay near the scalar-object baseline. Array: ${arrayElapsedTime}ms. Object: ${objectElapsedTime}ms.`,
		);
	}
});

test('array order', () => {
	assert.equal(queryString.stringify({
		abc: 'abc',
		foo: ['baz', 'bar'],
	}), 'abc=abc&foo=baz&foo=bar');
});

test('handle empty array value', () => {
	assert.equal(queryString.stringify({
		abc: 'abc',
		foo: [],
	}), 'abc=abc');
});

test('should not encode undefined values', () => {
	assert.equal(queryString.stringify({
		abc: undefined,
		foo: 'baz',
	}), 'foo=baz');
});

test('should encode null values as just a key', () => {
	assert.equal(queryString.stringify({
		'x y z': null,
		abc: null,
		foo: 'baz',
	}), 'abc&foo=baz&x%20y%20z');
});

test('handle null values in array', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: [null, 'baz'],
	}), 'bar&bar=baz&foo');
});

test('handle undefined values in array', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: [undefined, 'baz'],
	}), 'bar=baz&foo');
});

test('handle undefined and null values in array', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: [undefined, null, 'baz'],
	}), 'bar&bar=baz&foo');
});

test('strict encoding', () => {
	assert.equal(queryString.stringify({foo: '\'bar\''}), 'foo=%27bar%27');
	assert.equal(queryString.stringify({foo: ['\'bar\'', '!baz']}), 'foo=%27bar%27&foo=%21baz');
});

test('loose encoding', () => {
	assert.equal(queryString.stringify({foo: '\'bar\''}, {strict: false}), 'foo=\'bar\'');
	assert.equal(queryString.stringify({foo: ['\'bar\'', '!baz']}, {strict: false}), 'foo=\'bar\'&foo=!baz');
});

test('array stringify representation with array indexes', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'index',
	}), 'bar[0]=one&bar[1]=two&foo');
});

test('array stringify representation with array brackets', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'bracket',
	}), 'bar[]=one&bar[]=two&foo');
});

test('array stringify representation with array brackets and null value', () => {
	assert.equal(queryString.stringify({
		foo: ['a', null, ''],
		bar: [null],
	}, {
		arrayFormat: 'bracket',
	}), 'bar[]&foo[]=a&foo[]&foo[]=');
});

test('array stringify representation with array commas', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'comma',
	}), 'bar=one,two&foo');
});

test('array stringify representation with array commas, null & empty string', () => {
	assert.equal(queryString.stringify({
		c: [null, 'a', '', null],
		b: [null],
		a: [''],
	}, {
		arrayFormat: 'comma',
	}), 'a=&b=&c=,a,,');
});

test('array stringify representation with array commas, null & empty string (skip both)', () => {
	assert.equal(queryString.stringify({
		c: [null, 'a', '', null],
		b: [null],
		a: [''],
	}, {
		skipNull: true,
		skipEmptyString: true,
		arrayFormat: 'comma',
	}), 'c=a');
});

test('array stringify representation with array commas and 0 value', () => {
	assert.equal(queryString.stringify({
		foo: ['a', null, 0],
		bar: [null],
	}, {
		arrayFormat: 'comma',
	}), 'bar=&foo=a,,0');
});

test('array stringify representation with a bad array format', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'badinput',
	}), 'bar=one&bar=two&foo');
});

test('array stringify representation with array indexes and sparse array', () => {
	const fixture = ['one', 'two'];
	fixture[10] = 'three';
	assert.equal(queryString.stringify({bar: fixture}, {arrayFormat: 'index'}), 'bar[0]=one&bar[1]=two&bar[2]=three');
});

test('array stringify representation with brackets and separators with empty array', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: [],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]&foo');
});

test('array stringify representation with brackets and separators with single value', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one'],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=one&foo');
});

test('array stringify representation with brackets and separators with multiple values', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', 'two', 'three'],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=one,two,three&foo');
});

test('array stringify representation with brackets and separators with a single empty string', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: [''],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=&foo');
});

test('array stringify representation with brackets and separators with a multiple empty string', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['', 'two', ''],
	}, {
		arrayFormat: 'bracket-separator',
	}), 'bar[]=,two,&foo');
});

test('array stringify representation with brackets and separators with dropped empty strings', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['', 'two', ''],
	}, {
		arrayFormat: 'bracket-separator',
		skipEmptyString: true,
	}), 'bar[]=two&foo');
});

test('array stringify representation with brackets and separators with dropped null values', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', null, 'three', null, '', 'six'],
	}, {
		arrayFormat: 'bracket-separator',
		skipNull: true,
	}), 'bar[]=one,three,,six');
});

test('array stringify representation with brackets and separators when every item is skipped', () => {
	// After the items are skipped, the array is empty. An empty array is written as `bar[]`, like an empty array in the input, so the key is not lost.
	assert.equal(queryString.stringify({bar: [null]}, {arrayFormat: 'bracket-separator', skipNull: true}), 'bar[]');
	assert.equal(queryString.stringify({bar: [null, null]}, {arrayFormat: 'bracket-separator', skipNull: true}), 'bar[]');
	assert.equal(queryString.stringify({bar: ['']}, {arrayFormat: 'bracket-separator', skipEmptyString: true}), 'bar[]');
	assert.equal(queryString.stringify({bar: [null, '']}, {arrayFormat: 'bracket-separator', skipNull: true, skipEmptyString: true}), 'bar[]');
	assert.equal(queryString.stringify({bar: [undefined]}, {arrayFormat: 'bracket-separator'}), 'bar[]');
	assert.equal(queryString.stringify({bar: [undefined, undefined]}, {arrayFormat: 'bracket-separator'}), 'bar[]');
	assert.equal(queryString.stringify({bar: [1]}, {arrayFormat: 'bracket-separator', replacer: (key, value) => value === 1 ? undefined : value}), 'bar[]');
	assert.equal(queryString.stringify({bar: [null], foo: 'x'}, {arrayFormat: 'bracket-separator', skipNull: true}), 'bar[]&foo=x');
	assert.equal(queryString.stringify({bar: [null]}, {arrayFormat: 'bracket-separator', skipNull: true, encode: false}), 'bar[]');
	assert.equal(queryString.stringify({'a b': [null]}, {arrayFormat: 'bracket-separator', skipNull: true}), 'a%20b[]');

	const stringified = queryString.stringify({bar: [null]}, {arrayFormat: 'bracket-separator', skipNull: true});

	// The result round-trips to an empty array.
	assert.deepEqual(structuredClone(queryString.parse(stringified, {arrayFormat: 'bracket-separator'})), {bar: []});

	// The other array formats have no representation for an empty array, so the key is dropped there, like for an empty array in the input.
	for (const arrayFormat of ['none', 'bracket', 'index', 'comma', 'separator', 'colon-list-separator']) {
		assert.equal(queryString.stringify({bar: [null]}, {arrayFormat, skipNull: true}), '', `${arrayFormat}: skipNull`);
		assert.equal(queryString.stringify({bar: [undefined]}, {arrayFormat}), '', `${arrayFormat}: undefined item`);
		assert.equal(queryString.stringify({bar: []}, {arrayFormat}), '', `${arrayFormat}: empty array`);
	}
});

test('a plain value that contains the separator is percent-encoded with the comma and separator formats', () => {
	// `parse()` splits every value on a literal separator with `comma` and `separator`, so a plain value that contains it would come back as an array.
	assert.equal(queryString.stringify({foo: 'a,b'}, {arrayFormat: 'comma'}), 'foo=a%2Cb');
	assert.equal(queryString.stringify({foo: 'a|b'}, {arrayFormat: 'separator', arrayFormatSeparator: '|'}), 'foo=a%7Cb');

	// `encodeURIComponent` leaves `-`, `.`, `_`, and `~` as-is, so those are encoded by hand.
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=a%2Db');
	assert.equal(queryString.stringify({foo: 'a.b'}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=a%2Eb');
	assert.equal(queryString.stringify({foo: 'a_b'}, {arrayFormat: 'separator', arrayFormatSeparator: '_'}), 'foo=a%5Fb');
	assert.equal(queryString.stringify({foo: 'a~b'}, {arrayFormat: 'separator', arrayFormatSeparator: '~'}), 'foo=a%7Eb');
	assert.equal(queryString.stringify({foo: 'a.b'}, {arrayFormat: 'comma', arrayFormatSeparator: '.'}), 'foo=a%2Eb');

	// `!`, `'`, `(`, `)`, and `*` are only encoded by the strict encoding. As a separator, they are encoded in both modes.
	assert.equal(queryString.stringify({foo: 'a!b'}, {arrayFormat: 'separator', arrayFormatSeparator: '!', strict: false}), 'foo=a%21b');
	assert.equal(queryString.stringify({foo: 'a(b)'}, {arrayFormat: 'separator', arrayFormatSeparator: '(', strict: false}), 'foo=a%28b)');
	assert.equal(queryString.stringify({foo: 'a*b'}, {arrayFormat: 'separator', arrayFormatSeparator: '*'}), 'foo=a%2Ab');

	// Every occurrence is encoded, also at the start and the end, and when the value is only the separator.
	assert.equal(queryString.stringify({foo: '-a--b-'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2Da%2D%2Db%2D');
	assert.equal(queryString.stringify({foo: '-'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2D');

	// A number is converted to a string first, so a decimal point is encoded with a `.` separator.
	assert.equal(queryString.stringify({foo: 1.5}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=1%2E5');
	assert.equal(queryString.stringify({foo: 15}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=15');

	// A separator that is a hex digit is encoded too, and the rest of the value is not searched for it inside a `%XX` escape.
	assert.equal(queryString.stringify({foo: 'aCb'}, {arrayFormat: 'separator', arrayFormatSeparator: 'C'}), 'foo=a%43b');
	assert.equal(queryString.stringify({foo: 'a,b'}, {arrayFormat: 'separator', arrayFormatSeparator: 'C'}), 'foo=a%2Cb');

	// A separator outside ASCII is percent-encoded anyway.
	assert.equal(queryString.stringify({foo: 'aåb'}, {arrayFormat: 'separator', arrayFormatSeparator: 'å'}), 'foo=a%C3%A5b');

	// The key is not split by `parse()`, so the separator in the key follows the normal encoding.
	assert.equal(queryString.stringify({'a-b': 'c'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'a-b=c');

	// A plain value and an array item are encoded the same way in one object.
	assert.equal(queryString.stringify({a: ['x-y', 'z'], b: 'x-y'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'a=x%2Dy-z&b=x%2Dy');

	// A null value has no separator to encode. An empty string is unaffected too.
	assert.equal(queryString.stringify({foo: null, bar: ''}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'bar=&foo');
	assert.equal(queryString.stringify({foo: null, bar: ''}, {
		arrayFormat: 'separator', arrayFormatSeparator: '-', skipNull: true, skipEmptyString: true,
	}), '');

	// The replacer runs before the encoding, so its result is encoded too.
	assert.equal(queryString.stringify({foo: 'x'}, {arrayFormat: 'separator', arrayFormatSeparator: '-', replacer: () => 'a-b'}), 'foo=a%2Db');

	// Without encoding, the value is written as-is.
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'separator', arrayFormatSeparator: '-', encode: false}), 'foo=a-b');

	// The other array formats do not split a plain value, so it keeps the normal encoding.
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '-'}), 'foo=a-b');
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'bracket', arrayFormatSeparator: '-'}), 'foo=a-b');
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'index', arrayFormatSeparator: '-'}), 'foo=a-b');
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'none', arrayFormatSeparator: '-'}), 'foo=a-b');

	// The value round-trips as a plain value, not as an array.
	for (const arrayFormatSeparator of ['-', '.', '_', '~', '!', '*', 'å', ',', '|']) {
		for (const arrayFormat of ['comma', 'separator']) {
			const options = {arrayFormat, arrayFormatSeparator};
			for (const value of [`a${arrayFormatSeparator}b`, arrayFormatSeparator, `${arrayFormatSeparator}${arrayFormatSeparator}`]) {
				const stringified = queryString.stringify({foo: value}, options);
				assert.deepEqual(structuredClone(queryString.parse(stringified, options)), {foo: value}, `${arrayFormat} with ${JSON.stringify(arrayFormatSeparator)} and ${JSON.stringify(value)}`);
			}
		}
	}
});

test('array stringify representation with separators percent-encodes a separator inside an item', () => {
	// `parse()` only splits on a literal separator, so a separator inside an item must be percent-encoded, also when `encodeURIComponent` leaves it as-is, like `-`, `.`, `_`, and `~`.
	assert.equal(queryString.stringify({foo: ['a,b', 'c']}, {arrayFormat: 'comma'}), 'foo=a%2Cb,c');
	assert.equal(queryString.stringify({foo: ['a|b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '|'}), 'foo=a%7Cb|c');
	assert.equal(queryString.stringify({foo: ['a-b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=a%2Db-c');
	assert.equal(queryString.stringify({foo: ['a.b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=a%2Eb.c');
	assert.equal(queryString.stringify({foo: ['a_b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '_'}), 'foo=a%5Fb_c');
	assert.equal(queryString.stringify({foo: ['a~b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '~'}), 'foo=a%7Eb~c');
	assert.equal(queryString.stringify({foo: ['a-b', 'c']}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '-'}), 'foo[]=a%2Db-c');
	assert.equal(queryString.stringify({foo: ['a.b', 'c']}, {arrayFormat: 'comma', arrayFormatSeparator: '.'}), 'foo=a%2Eb.c');

	// Every occurrence is encoded, also at the start and the end of an item, and in a single-item array.
	assert.equal(queryString.stringify({foo: ['-a--b-']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2Da%2D%2Db%2D');
	assert.equal(queryString.stringify({foo: ['-', '-']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=%2D-%2D');
	assert.equal(queryString.stringify({foo: [1.5, 2]}, {arrayFormat: 'separator', arrayFormatSeparator: '.'}), 'foo=1%2E5.2');

	// `!`, `'`, `(`, `)`, and `*` are only encoded by the strict encoding. As a separator, they are encoded in both modes.
	assert.equal(queryString.stringify({foo: ['a!b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '!', strict: false}), 'foo=a%21b!c');
	assert.equal(queryString.stringify({foo: ['a*b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '*', strict: false}), 'foo=a%2Ab*c');
	assert.equal(queryString.stringify({foo: ['a!b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '!'}), 'foo=a%21b!c');

	// The key is not an item, so the separator in the key follows the normal encoding.
	assert.equal(queryString.stringify({'a-b': ['c', 'd']}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'a-b=c-d');

	// A scalar that contains the separator is encoded the same way, since `parse()` would otherwise split it into an array.
	assert.equal(queryString.stringify({foo: 'a-b'}, {arrayFormat: 'separator', arrayFormatSeparator: '-'}), 'foo=a%2Db');

	// Without encoding, the item is written as-is.
	assert.equal(queryString.stringify({foo: ['a-b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '-', encode: false}), 'foo=a-b-c');

	// A separator outside ASCII is always percent-encoded inside an item, so it is already distinct from the literal separator.
	assert.equal(queryString.stringify({foo: ['aåb', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: 'å'}), 'foo=a%C3%A5båc');

	// A separator that is a hex digit must not be confused with the same character inside a `%XX` escape of another character.
	assert.equal(queryString.stringify({foo: ['a,b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: 'C'}), 'foo=a%2CbCc');
	assert.equal(queryString.stringify({foo: ['a b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '2'}), 'foo=a%20b2c');
	assert.equal(queryString.stringify({foo: ['a2b', 'c d']}, {arrayFormat: 'separator', arrayFormatSeparator: '2'}), 'foo=a%32b2c%20d');
	assert.equal(queryString.stringify({foo: ['*', 'b']}, {arrayFormat: 'separator', arrayFormatSeparator: 'A'}), 'foo=%2AAb');
	assert.equal(queryString.stringify({foo: ['a%b', 'c']}, {arrayFormat: 'separator', arrayFormatSeparator: '%'}), 'foo=a%25b%c');

	// The result round-trips.
	for (const arrayFormatSeparator of ['-', '.', '_', '~', '!', '*', 'x', 'å', ',', '|']) {
		for (const arrayFormat of ['separator', 'bracket-separator']) {
			const value = [`a${arrayFormatSeparator}b`, 'c', arrayFormatSeparator];
			const options = {arrayFormat, arrayFormatSeparator};
			const stringified = queryString.stringify({foo: value}, options);
			assert.deepEqual(structuredClone(queryString.parse(stringified, options)), {foo: value}, `${arrayFormat} with ${arrayFormatSeparator}`);
			const stringifiedLoose = queryString.stringify({foo: value}, {...options, strict: false});
			assert.deepEqual(structuredClone(queryString.parse(stringifiedLoose, options)), {foo: value}, `${arrayFormat} with ${arrayFormatSeparator} and strict false`);
		}
	}
});

test('should sort keys in given order', () => {
	const fixture = ['c', 'a', 'b'];
	const sort = (key1, key2) => fixture.indexOf(key1) - fixture.indexOf(key2);

	assert.equal(queryString.stringify({a: 'foo', b: 'bar', c: 'baz'}, {sort}), 'c=baz&a=foo&b=bar');
});

test('should not sort when sort is false', () => {
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
	assert.equal(queryString.stringify(fixture, {sort: false}), 'story=a&patch=b&deployment=c&lat=10&lng=20&sb=d&sc=e&mn=f&ln=g&nf=h&srs=i&destination=g');
});

test('should disable sorting', () => {
	assert.equal(queryString.stringify({
		c: 'foo',
		b: 'bar',
		a: 'baz',
	}, {
		sort: false,
	}), 'c=foo&b=bar&a=baz');
});

test('should ignore null when skipNull is set', () => {
	assert.equal(queryString.stringify({
		a: 1,
		b: null,
		c: 3,
	}, {
		skipNull: true,
	}), 'a=1&c=3');
});

test('should ignore emptyString when skipEmptyString is set', () => {
	assert.equal(queryString.stringify({
		a: 1,
		b: '',
		c: 3,
	}, {
		skipEmptyString: true,
	}), 'a=1&c=3');
});

test('should ignore undefined when skipNull is set', () => {
	assert.equal(queryString.stringify({
		a: 1,
		b: undefined,
		c: 3,
	}, {
		skipNull: true,
	}), 'a=1&c=3');
});

test('should ignore both null and undefined when skipNull is set', () => {
	assert.equal(queryString.stringify({
		a: undefined,
		b: null,
	}, {
		skipNull: true,
	}), '');
});

test('should ignore both null and undefined when skipNull is set for arrayFormat', () => {
	assert.equal(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
	}), 'a=1&a=2&c=1');

	assert.equal(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
		arrayFormat: 'bracket',
	}), 'a[]=1&a[]=2&c=1');

	assert.equal(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
		arrayFormat: 'comma',
	}), 'a=1,2&c=1');

	assert.equal(queryString.stringify({
		a: [undefined, null, 1, undefined, 2, null],
		b: null,
		c: 1,
	}, {
		skipNull: true,
		arrayFormat: 'index',
	}), 'a[0]=1&a[1]=2&c=1');
});

test('should ignore empty string when skipEmptyString is set for arrayFormat', () => {
	assert.equal(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
	}), 'a=1&a=2&c=1');

	assert.equal(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
		arrayFormat: 'bracket',
	}), 'a[]=1&a[]=2&c=1');

	assert.equal(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
		arrayFormat: 'comma',
	}), 'a=1,2&c=1');

	assert.equal(queryString.stringify({
		a: ['', 1, '', 2],
		b: '',
		c: 1,
	}, {
		skipEmptyString: true,
		arrayFormat: 'index',
	}), 'a[0]=1&a[1]=2&c=1');

	assert.equal(queryString.stringify({
		a: ['', '', '', ''],
		c: 1,
	}, {
		skipEmptyString: true,
	}), 'c=1');
});

test('stringify throws TypeError for invalid arrayFormatSeparator', () => {
	assert.throws(_ => queryString.stringify({}, {arrayFormatSeparator: ',,'}), TypeError);
	assert.throws(_ => queryString.stringify({}, {arrayFormatSeparator: []}), TypeError);
});

test('array stringify representation with (:list) colon-list-separator', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', 'two'],
	}, {
		arrayFormat: 'colon-list-separator',
	}), 'bar:list=one&bar:list=two&foo');
});

test('array stringify representation with (:list) colon-list-separator with null values', () => {
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', ''],
	}, {
		arrayFormat: 'colon-list-separator',
	}), 'bar:list=one&bar:list=&foo');
	assert.equal(queryString.stringify({
		foo: null,
		bar: ['one', null],
	}, {
		arrayFormat: 'colon-list-separator',
	}), 'bar:list=one&bar:list&foo');
});

test('array stringify representation with (:list) colon-list-separator keeps null values distinct from empty strings', () => {
	const options = {arrayFormat: 'colon-list-separator'};

	assert.equal(queryString.stringify({foo: [null]}, options), 'foo:list');
	assert.equal(queryString.stringify({foo: [null, null]}, options), 'foo:list&foo:list');
	assert.equal(queryString.stringify({foo: [null, '', 'a']}, options), 'foo:list&foo:list=&foo:list=a');
	assert.equal(queryString.stringify({foo: ['a b', null]}, {...options, encode: false}), 'foo:list=a b&foo:list');
	assert.equal(queryString.stringify({foo: [null, 'a']}, {...options, skipNull: true}), 'foo:list=a');
	assert.equal(queryString.stringify({foo: [null, '', 'a']}, {...options, skipEmptyString: true}), 'foo:list&foo:list=a');
	assert.equal(queryString.stringify({foo: [undefined, null]}, options), 'foo:list');
});

test('array stringify representation with (:list) colon-list-separator round-trips null values', () => {
	const options = {arrayFormat: 'colon-list-separator'};
	const object = {foo: [null, '', 'a'], bar: null};
	const stringified = queryString.stringify(object, options);

	assert.equal(stringified, 'bar&foo:list&foo:list=&foo:list=a');
	assert.deepEqual(structuredClone(queryString.parse(stringified, options)), object);
});

test('replacer option transforms Date objects to ISO strings', () => {
	const date = new Date('2024-01-15T10:30:00.000Z');
	assert.equal(queryString.stringify({
		name: 'John',
		created: date,
	}, {
		replacer(key, value) {
			return value instanceof Date ? value.toISOString() : value;
		},
	}), 'created=2024-01-15T10%3A30%3A00.000Z&name=John');
});

test('replacer option can omit null values', () => {
	assert.equal(queryString.stringify({
		a: 1,
		b: null,
		c: 3,
	}, {
		replacer: (key, value) => value === null ? undefined : value,
	}), 'a=1&c=3');
});

test('replacer option can transform specific keys', () => {
	assert.equal(queryString.stringify({
		price: 10,
		quantity: 5,
	}, {
		replacer(key, value) {
			return key === 'price' && typeof value === 'number' ? `$${value}` : value;
		},
	}), 'price=%2410&quantity=5');
});

test('replacer option can filter array elements', () => {
	assert.equal(queryString.stringify({
		tags: ['one', 'two', 'three'],
	}, {
		replacer(key, value) {
			// Skip 'two'.
			return value === 'two' && key.startsWith('tags[') ? undefined : value;
		},
	}), 'tags=one&tags=three');
});

test('replacer option returning undefined for all values results in empty string', () => {
	assert.equal(queryString.stringify({
		a: 1,
		b: 2,
	}, {
		replacer: () => undefined,
	}), '');
});

test('replacer option can transform array to string', () => {
	assert.equal(queryString.stringify({
		tags: ['one', 'two', 'three'],
	}, {
		replacer(key, value) {
			return Array.isArray(value) ? value.join('|') : value;
		},
	}), 'tags=one%7Ctwo%7Cthree');
});

test('replacer option works with bracket array format', () => {
	assert.equal(queryString.stringify({
		items: [1, 2, 3],
	}, {
		arrayFormat: 'bracket',
		replacer(key, value) {
			return typeof value === 'number' ? value * 10 : value;
		},
	}), 'items[]=10&items[]=20&items[]=30');
});

test('replacer option handles edge cases correctly', () => {
	assert.equal(queryString.stringify({
		undefinedValue: undefined,
		nullValue: null,
		empty: '',
		zero: 0,
		false: false,
	}, {
		replacer: (key, value) => value,
	}), 'empty=&false=false&nullValue&zero=0');
});

test('replacer option can handle Symbol without crashing', () => {
	const symbol = Symbol('test');
	assert.equal(queryString.stringify({
		a: 1,
		b: symbol,
	}, {
		replacer(key, value) {
			return typeof value === 'symbol' ? 'symbol-value' : value;
		},
	}), 'a=1&b=symbol-value');
});

test('replacer option works with comma array format', () => {
	assert.equal(queryString.stringify({
		colors: ['red', 'green', 'blue'],
	}, {
		arrayFormat: 'comma',
		replacer(key, value) {
			return value === 'green' && key.startsWith('colors[') ? 'GREEN' : value;
		},
	}), 'colors=red,GREEN,blue');
});

test('replacer option is called with correct keys for index array format', () => {
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
	assert.deepEqual(structuredClone(replacerKeys), ['items', 'items[0]', 'items[1]']);
});

test('replacer option can transform objects to JSON strings', () => {
	assert.equal(queryString.stringify({
		data: {nested: 'value'},
	}, {
		replacer(key, value) {
			return typeof value === 'object' && value !== null && !Array.isArray(value) ? JSON.stringify(value) : value;
		},
	}), 'data=%7B%22nested%22%3A%22value%22%7D');
});

test('should sort keys when sort is true', () => {
	assert.equal(queryString.stringify({b: 1, c: 2, a: 3}, {sort: true}), 'a=3&b=1&c=2');
});

test('default sort compares keys in UTF-16 code unit order, not code point order', () => {
	// `Array#sort` compares UTF-16 code units, so the astral character is stored as a surrogate pair whose leading code unit is below U+E000 and therefore sorts before U+FFFD. Unicode code point order would place U+FFFD before the astral character.
	assert.equal(queryString.stringify({'\u{FFFD}': 'bmp', '\u{1F600}': 'astral'}), '%F0%9F%98%80=astral&%EF%BF%BD=bmp');
});

test('should sort keys when sort is true and values are arrays', () => {
	assert.equal(queryString.stringify({b: [2, 1], a: 'x'}, {sort: true, arrayFormat: 'bracket'}), 'a=x&b[]=2&b[]=1');
});

test('should sort keys when sort is true with skipNull and skipEmptyString', () => {
	assert.equal(queryString.stringify({c: '', b: null, a: 1}, {sort: true, skipNull: true, skipEmptyString: true}), 'a=1');
	assert.equal(queryString.stringify({c: '', b: null, a: 1}, {sort: true}), 'a=1&b&c=');
});

test('should sort keys when sort is true and the object has one key', () => {
	assert.equal(queryString.stringify({a: 1}, {sort: true}), 'a=1');
	assert.equal(queryString.stringify({}, {sort: true}), '');
});

test('throws a TypeError for unsupported value types', () => {
	// The class and the message are checked separately, because `assert.throws()`
	// cannot do both in one call.
	assert.throws(() => queryString.stringify({a: {}}), TypeError);
	assert.throws(() => queryString.stringify({a: {}}), {message: /Unsupported value type/v});
	assert.throws(() => queryString.stringify({a: new Date()}), TypeError);
	assert.throws(() => queryString.stringify({a: new Date()}), {message: /Unsupported value type/v});
	assert.throws(() => queryString.stringify({a: new Map()}), TypeError);
	assert.throws(() => queryString.stringify({a: new Map()}), {message: /Unsupported value type/v});
	assert.throws(() => queryString.stringify({a() {}}), TypeError);
	assert.throws(() => queryString.stringify({a() {}}), {message: /Unsupported value type/v});
	assert.throws(() => queryString.stringify({a: Symbol('a')}), TypeError);
	assert.throws(() => queryString.stringify({a: Symbol('a')}), {message: /Unsupported value type/v});
	assert.throws(() => queryString.stringify({a: {}}, {encode: false}), TypeError);
	assert.throws(() => queryString.stringify({a: {}}, {encode: false}), {message: /Unsupported value type/v});
	assert.throws(() => queryString.stringify({a: {}}, {strict: false}), TypeError);
	assert.throws(() => queryString.stringify({a: {}}, {strict: false}), {message: /Unsupported value type/v});
});

test('throws a TypeError for unsupported value types inside arrays', () => {
	for (const arrayFormat of ['none', 'bracket', 'index', 'comma', 'separator', 'bracket-separator', 'colon-list-separator']) {
		// The class and the message are checked separately, because `assert.throws()`
		// cannot do both in one call.
		assert.throws(() => queryString.stringify({a: [1, {}]}, {arrayFormat}), TypeError, `${arrayFormat}: object`);
		assert.throws(() => queryString.stringify({a: [1, {}]}, {arrayFormat}), {message: /Unsupported value type/v}, `${arrayFormat}: object`);
		assert.throws(() => queryString.stringify({a: [[1, 2]]}, {arrayFormat}), TypeError, `${arrayFormat}: nested array`);
		assert.throws(() => queryString.stringify({a: [[1, 2]]}, {arrayFormat}), {message: /Unsupported value type/v}, `${arrayFormat}: nested array`);
		assert.throws(() => queryString.stringify({a: [new Date()]}, {arrayFormat, encode: false}), TypeError, `${arrayFormat}: encode false`);
		assert.throws(() => queryString.stringify({a: [new Date()]}, {arrayFormat, encode: false}), {message: /Unsupported value type/v}, `${arrayFormat}: encode false`);
	}
});

test('does not throw for unsupported value types that the replacer transforms', () => {
	assert.equal(queryString.stringify({a: {b: 1}, c: [new Date(0)]}, {
		replacer(key, value) {
			if (value instanceof Date) {
				return value.getTime();
			}

			return typeof value === 'object' && value !== null && !Array.isArray(value) ? JSON.stringify(value) : value;
		},
	}), 'a=%7B%22b%22%3A1%7D&c=0');
});

test('does not throw for supported value types', () => {
	assert.equal(queryString.stringify({
		a: 'a',
		b: 1,
		c: 1n,
		d: true,
		e: null,
		f: undefined,
		g: ['a', 1, 1n, true, null, undefined],
	}), 'a=a&b=1&c=1&d=true&e&g=a&g=1&g=1&g=true&g');
});

test('drops a key named `__proto__`', () => {
	// Intentional: the keys are copied into a plain object, where assigning `__proto__` sets the prototype instead of a property.
	assert.equal(queryString.stringify({['__proto__']: 'a', b: 'c'}), 'b=c');
	assert.equal(queryString.stringify(queryString.parse('__proto__=a&b=c')), 'b=c');
	assert.equal(queryString.stringify({['__proto__']: ['a', 'b']}, {arrayFormat: 'bracket'}), '');
	assert.equal(queryString.stringify({['__proto__']: null}), '');
	assert.equal(queryString.stringify({['__proto__']: null, a: 1}, {skipNull: true}), 'a=1');
	assert.equal(queryString.stringify({['__proto__']: '', a: 1}, {skipEmptyString: true}), 'a=1');
	assert.deepEqual(Object.keys(queryString.parse('__proto__=a&b=c')), ['__proto__', 'b']);
});

test('skipNull and skipEmptyString apply to the value returned by the replacer', () => {
	assert.equal(queryString.stringify({a: 1, b: 2}, {skipNull: true, replacer: (key, value) => key === 'a' ? null : value}), 'b=2');
	assert.equal(queryString.stringify({a: 1, b: 2}, {skipEmptyString: true, replacer: (key, value) => key === 'a' ? '' : value}), 'b=2');
	assert.equal(queryString.stringify({a: null, b: ''}, {skipNull: true, skipEmptyString: true, replacer: (key, value) => value === null ? 'was-null' : (value === '' ? 'was-empty' : value)}), 'a=was-null&b=was-empty');
	assert.equal(queryString.stringify({a: undefined}, {skipNull: true, replacer: () => 'x'}), 'a=x');
	assert.equal(queryString.stringify({a: [1, 2]}, {skipNull: true, replacer: (key, value) => Array.isArray(value) ? value : (value === 1 ? null : value)}), 'a=2');
	assert.equal(queryString.stringify({a: [1, 2]}, {arrayFormat: 'bracket', skipEmptyString: true, replacer: (key, value) => Array.isArray(value) ? value : (value === 1 ? '' : value)}), 'a[]=2');
});

test('skipNull and skipEmptyString still apply without a replacer', () => {
	assert.equal(queryString.stringify({
		a: null,
		b: '',
		c: undefined,
		d: 1,
	}, {skipNull: true, skipEmptyString: true}), 'd=1');
	assert.equal(queryString.stringify({a: null, b: '', d: 1}, {skipNull: true}), 'b=&d=1');
	assert.equal(queryString.stringify({a: null, b: '', d: 1}, {skipEmptyString: true}), 'a&d=1');
	assert.equal(queryString.stringify({a: null, b: ''}, {
		skipNull: true,
		skipEmptyString: true,
		sort: false,
	}), '');
});

test('skipNull and skipEmptyString with a replacer and array formats', () => {
	assert.equal(queryString.stringify({a: [1, null, 2]}, {arrayFormat: 'bracket', skipNull: true, replacer: (key, value) => value}), 'a[]=1&a[]=2');
	assert.equal(queryString.stringify({a: [1, null, 2]}, {arrayFormat: 'comma', skipNull: true, replacer: (key, value) => value}), 'a=1,2');
	assert.equal(queryString.stringify({a: [1, 2, 3]}, {arrayFormat: 'index', skipNull: true, replacer: (key, value) => value === 2 ? null : value}), 'a[0]=1&a[1]=3');
	assert.equal(queryString.stringify({a: null, b: 1}, {skipNull: true, replacer: (key, value) => value === null ? 'rescued' : value}), 'a=rescued&b=1');
	assert.equal(queryString.stringify({a: 1, b: ''}, {skipEmptyString: true, replacer: (key, value) => key === 'a' ? '' : value}), '');
	assert.equal(queryString.stringify({a: 1, b: 2}, {skipNull: true, replacer: (key, value) => key === 'a' ? undefined : value}), 'b=2');
});

test('an option that is explicitly `undefined` uses its default', () => {
	// Passing through an optional setting, like `{encode: config.encode}`, must behave like leaving the option out.
	assert.equal(queryString.stringify({foo: 'a&b=c'}, {encode: undefined}), 'foo=a%26b%3Dc');
	assert.equal(queryString.stringify({foo: '!'}, {strict: undefined}), 'foo=%21');
	assert.equal(queryString.stringify({b: 1, a: 2}, {sort: undefined}), 'a=2&b=1');
	assert.equal(queryString.stringify({foo: [1, 2]}, {arrayFormat: undefined}), 'foo=1&foo=2');
	assert.equal(queryString.stringify({foo: [1, 2]}, {arrayFormat: 'comma', arrayFormatSeparator: undefined}), 'foo=1,2');
	assert.equal(queryString.stringify({foo: null, bar: ''}, {skipNull: undefined, skipEmptyString: undefined, replacer: undefined}), 'bar=&foo');
});

test('reads each value once', () => {
	// A getter or a `Proxy` trap runs once per key, so a value that changes on every read, like a counter, is written from the one read, and a costly getter is not called twice.
	let reads = 0;
	assert.equal(queryString.stringify({
		get foo() {
			reads++;
			return reads;
		},
	}), 'foo=1');
	assert.equal(reads, 1);

	reads = 0;
	assert.equal(queryString.stringify({
		get foo() {
			reads++;
			return [reads, 'x'];
		},
	}, {arrayFormat: 'comma'}), 'foo=1,x');
	assert.equal(reads, 1);

	reads = 0;
	assert.equal(queryString.stringify({
		get foo() {
			reads++;
			return reads;
		},
	}, {replacer: (key, value) => value * 10}), 'foo=10');
	assert.equal(reads, 1);

	const trapped = [];
	const proxy = new Proxy({b: 1, a: 2}, {
		get(target, key) {
			trapped.push(key);
			return target[key];
		},
	});
	assert.equal(queryString.stringify(proxy, {sort: false}), 'b=1&a=2');
	assert.deepEqual(structuredClone(trapped), ['b', 'a']);
});

test('replaces a lone surrogate with the replacement character instead of throwing', () => {
	// `encodeURIComponent` throws `URIError` for a lone surrogate, since it cannot be encoded as UTF-8. `URLSearchParams`, the `URL` hash setter, and `stringifyUrl()` for the fragment identifier write U+FFFD instead, so the query does the same.
	assert.equal(queryString.stringify({foo: 'x\u{D800}y'}), 'foo=x%EF%BF%BDy');
	assert.equal(queryString.stringify({foo: '\u{DC00}'}, {strict: false}), 'foo=%EF%BF%BD');
	assert.equal(queryString.stringify({'k\u{DC00}': 1}), 'k%EF%BF%BD=1');
	assert.equal(queryString.stringify({foo: ['x\u{D800}', 'y']}, {arrayFormat: 'comma'}), 'foo=x%EF%BF%BD,y');
	assert.equal(queryString.stringify({foo: ['a,\u{D800}']}, {arrayFormat: 'bracket-separator'}), 'foo[]=a%2C%EF%BF%BD');
	assert.equal(queryString.stringify({foo: ['\u{D800}']}, {arrayFormat: 'index'}), 'foo[0]=%EF%BF%BD');
	assert.equal(queryString.stringify({foo: 'x\u{D800}y'}, {replacer: (key, value) => value}), 'foo=x%EF%BF%BDy');
	// A surrogate pair is a valid character and is encoded as-is.
	assert.equal(queryString.stringify({foo: '😀'}), 'foo=%F0%9F%98%80');
	assert.equal(queryString.stringify({foo: ['😀', '😀']}, {arrayFormat: 'comma'}), 'foo=%F0%9F%98%80,%F0%9F%98%80');
	// With `encode: false`, the value is written as-is.
	assert.equal(queryString.stringify({foo: 'x\u{D800}y'}, {encode: false}), 'foo=x\u{D800}y');
});

test('rejects an invalid `arrayFormatSeparator`', () => {
	// A lone surrogate is one UTF-16 code unit, but it is not a character and cannot be percent-encoded. Whitespace cannot delimit a trailing empty item because `parse()` ignores it at the query boundary.
	const invalid = {
		'arrayFormatSeparator must be a single character': ['\u{1F600}', '', ',,', 1, null],
		'arrayFormatSeparator must not be whitespace, since parse() ignores leading and trailing whitespace in the query': [' ', '\t', '\n', '\r', '\u{A0}'],
		'arrayFormatSeparator must not be a lone surrogate, since it cannot be percent-encoded': ['\u{D800}', '\u{DC00}'],
	};

	for (const [message, arrayFormatSeparators] of Object.entries(invalid)) {
		for (const arrayFormatSeparator of arrayFormatSeparators) {
			const callback = () => queryString.stringify({foo: ['a', 'b']}, {arrayFormat: 'separator', arrayFormatSeparator});
			// The class and the message are checked separately, because `assert.throws()` cannot do both in one call.
			assert.throws(callback, TypeError);
			assert.throws(callback, {message});
		}
	}

	assert.throws(() => queryString.stringify({foo: ['\u{D800}x', 'y']}, {arrayFormat: 'comma', arrayFormatSeparator: '\u{D800}'}), TypeError);
	assert.throws(() => queryString.stringify({foo: ['a']}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '\u{DC00}'}), TypeError);
	// A separator outside the Basic Multilingual Plane is one character but two code units, so it is still rejected. A single-unit character is accepted.
	assert.equal(queryString.stringify({foo: ['a', 'b']}, {arrayFormat: 'separator', arrayFormatSeparator: '·'}), 'foo=a·b');
	assert.equal(queryString.stringify({foo: ['a', 'b']}, {arrayFormat: 'separator', arrayFormatSeparator: '|'}), 'foo=a|b');
});
