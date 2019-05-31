import test from 'ava';
import queryString from '..';

test('query strings starting with a `?`', t => {
	t.deepEqual(queryString.parse('?foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `#`', t => {
	t.deepEqual(queryString.parse('#foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `&`', t => {
	t.deepEqual(queryString.parse('&foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('parse a query string', t => {
	t.deepEqual(queryString.parse('foo=bar'), {foo: 'bar'});
});

test('parse multiple query string', t => {
	t.deepEqual(queryString.parse('foo=bar&key=val'), {
		foo: 'bar',
		key: 'val'
	});
});

test('parse multiple query string retain order when not sorted', t => {
	const expectedKeys = ['b', 'a', 'c'];
	const parsed = queryString.parse('b=foo&a=bar&c=yay', {sort: false});
	Object.keys(parsed).forEach((key, index) => {
		t.is(key, expectedKeys[index]);
	});
});

test('parse multiple query string sorted keys', t => {
	const fixture = ['a', 'b', 'c'];
	const parsed = queryString.parse('a=foo&c=bar&b=yay');
	Object.keys(parsed).forEach((key, index) => {
		t.is(key, fixture[index]);
	});
});

test('should sort parsed keys in given order', t => {
	const fixture = ['c', 'a', 'b'];
	const sort = (key1, key2) => fixture.indexOf(key1) - fixture.indexOf(key2);

	const parsed = queryString.parse('a=foo&b=bar&c=yay', {sort});
	Object.keys(parsed).forEach((key, index) => {
		t.is(key, fixture[index]);
	});
});

test('parse query string without a value', t => {
	t.deepEqual(queryString.parse('foo'), {foo: null});
	t.deepEqual(queryString.parse('foo&key'), {
		foo: null,
		key: null
	});
	t.deepEqual(queryString.parse('foo=bar&key'), {
		foo: 'bar',
		key: null
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
	t.deepEqual(queryString.parse('?param=https%3A%2F%2Fsomeurl%3Fid%3D2837'), {param: 'https://someurl?id=2837'});
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
		arrayFormat: 'bracket'
	}), {foo: ['bar', 'baz']});
});

test('query strings having comma separated arrays and format option as `comma`', t => {
	t.deepEqual(queryString.parse('foo=bar,baz', {
		arrayFormat: 'comma'
	}), {foo: ['bar', 'baz']});
});

test('query strings having brackets arrays with null and format option as `bracket`', t => {
	t.deepEqual(queryString.parse('bar[]&foo[]=a&foo[]&foo[]=', {
		arrayFormat: 'bracket'
	}), {
		foo: ['a', null, ''],
		bar: [null]
	});
});

test('query strings having comma separated arrays with null and format option as `comma`', t => {
	t.deepEqual(queryString.parse('bar&foo=a,', {
		arrayFormat: 'comma'
	}), {
		foo: ['a', ''],
		bar: null
	});
});

test('query strings having indexed arrays and format option as `index`', t => {
	t.deepEqual(queryString.parse('foo[0]=bar&foo[1]=baz', {
		arrayFormat: 'index'
	}), {foo: ['bar', 'baz']});
});

test('query strings having = within parameters (i.e. GraphQL IDs)', t => {
	t.deepEqual(queryString.parse('foo=bar=&foo=ba=z='), {foo: ['bar=', 'ba=z=']});
});

test('query strings having ordered index arrays and format option as `index`', t => {
	t.deepEqual(queryString.parse('foo[1]=bar&foo[0]=baz&foo[3]=one&foo[2]=two', {
		arrayFormat: 'index'
	}), {foo: ['baz', 'bar', 'two', 'one']});

	t.deepEqual(queryString.parse('foo[0]=bar&foo[1]=baz&foo[2]=one&foo[3]=two', {
		arrayFormat: 'index'
	}), {foo: ['bar', 'baz', 'one', 'two']});

	t.deepEqual(queryString.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero', {
		arrayFormat: 'index'
	}), {foo: ['zero', 'one', 'two', 'three']});

	t.deepEqual(queryString.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index'
	}), {foo: ['zero', 'one', 'two', 'three'], bat: 'buz'});

	t.deepEqual(queryString.parse('foo[1]=bar&foo[0]=baz', {
		arrayFormat: 'index'
	}), {foo: ['baz', 'bar']});

	t.deepEqual(queryString.parse('foo[102]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index'
	}), {bat: 'buz', foo: ['zero', 'one', 'two', 'three']});

	t.deepEqual(queryString.parse('foo[102]=three&foo[2]=two&foo[100]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index'
	}), {bat: 'buz', foo: ['zero', 'two', 'one', 'three']});
});

test('circuit parse -> stringify', t => {
	const original = 'foo[3]=foo&foo[2]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const expected = {bat: 'buz', foo: ['', 'one', null, 'foo']};
	const options = {
		arrayFormat: 'index'
	};

	t.deepEqual(queryString.parse(original, options), expected);

	t.is(queryString.stringify(expected, options), sortedOriginal);
});

test('circuit original -> parse - > stringify -> sorted original', t => {
	const original = 'foo[21474836471]=foo&foo[21474836470]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const options = {
		arrayFormat: 'index'
	};

	t.deepEqual(queryString.stringify(queryString.parse(original, options), options), sortedOriginal);
});

test('decode keys and values', t => {
	t.deepEqual(queryString.parse('st%C3%A5le=foo'), {ståle: 'foo'});
	t.deepEqual(queryString.parse('foo=%7B%ab%%7C%de%%7D+%%7Bst%C3%A5le%7D%'), {foo: '{%ab%|%de%} %{ståle}%'});
});

test('disable decoding of keys and values', t => {
	t.deepEqual(queryString.parse('tags=postal%20office,burger%2C%20fries%20and%20coke', {decode: false}), {tags: 'postal%20office,burger%2C%20fries%20and%20coke'});
});
