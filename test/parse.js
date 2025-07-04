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
	const key = 'foo[]';
	const value = 'a,b,c,d,e,f';
	t.deepEqual(queryString.parse(`?${encodeURIComponent(key)}=${encodeURIComponent(value)}`, {
		arrayFormat: 'bracket-separator',
	}), {
		foo: ['a', 'b', 'c', 'd', 'e', 'f'],
	});
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
		id: [1, 2, 3],
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
