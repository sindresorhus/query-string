import test from 'ava';
import fn from '../';

test('query strings starting with a `?`', t => {
	t.deepEqual(fn.parse('?foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `#`', t => {
	t.deepEqual(fn.parse('#foo=bar'), {foo: 'bar'});
});

test('query strings starting with a `&`', t => {
	t.deepEqual(fn.parse('&foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('parse a query string', t => {
	t.deepEqual(fn.parse('foo=bar'), {foo: 'bar'});
});

test('parse multiple query string', t => {
	t.deepEqual(fn.parse('foo=bar&key=val'), {
		foo: 'bar',
		key: 'val'
	});
});

test('parse query string without a value', t => {
	t.deepEqual(fn.parse('foo'), {foo: null});
	t.deepEqual(fn.parse('foo&key'), {
		foo: null,
		key: null
	});
	t.deepEqual(fn.parse('foo=bar&key'), {
		foo: 'bar',
		key: null
	});
	t.deepEqual(fn.parse('a&a'), {a: [null, null]});
	t.deepEqual(fn.parse('a=&a'), {a: ['', null]});
});

test('return empty object if no qss can be found', t => {
	t.deepEqual(fn.parse('?'), {});
	t.deepEqual(fn.parse('&'), {});
	t.deepEqual(fn.parse('#'), {});
	t.deepEqual(fn.parse(' '), {});
});

test('handle `+` correctly', t => {
	t.deepEqual(fn.parse('foo+faz=bar+baz++'), {'foo faz': 'bar baz  '});
});

test('handle multiple of the same key', t => {
	t.deepEqual(fn.parse('foo=bar&foo=baz'), {foo: ['bar', 'baz']});
});

test('query strings params including embedded `=`', t => {
	t.deepEqual(fn.parse('?param=http%3A%2F%2Fsomeurl%3Fid%3D2837'), {param: 'http://someurl?id=2837'});
});

test('query strings params including raw `=`', t => {
	t.deepEqual(fn.parse('?param=http://someurl?id=2837'), {param: 'http://someurl?id=2837'});
});

test('object properties', t => {
	t.falsy(fn.parse().prototype);
	t.deepEqual(fn.parse('hasOwnProperty=foo'), {hasOwnProperty: 'foo'});
});

test('query strings having indexed arrays', t => {
	t.deepEqual(fn.parse('foo[0]=bar&foo[1]=baz'), {'foo[0]': 'bar', 'foo[1]': 'baz'});
});

test('query strings having brackets arrays', t => {
	t.deepEqual(fn.parse('foo[]=bar&foo[]=baz'), {'foo[]': ['bar', 'baz']});
});

test('query strings having indexed arrays keeping index order', t => {
	t.deepEqual(fn.parse('foo[1]=bar&foo[0]=baz'), {'foo[1]': 'bar', 'foo[0]': 'baz'});
});

test('query strings having brackets arrays and format option as `bracket`', t => {
	t.deepEqual(fn.parse('foo[]=bar&foo[]=baz', {
		arrayFormat: 'bracket'
	}), {foo: ['bar', 'baz']});
});

test('query strings having indexed arrays and format option as `index`', t => {
	t.deepEqual(fn.parse('foo[0]=bar&foo[1]=baz', {
		arrayFormat: 'index'
	}), {foo: ['bar', 'baz']});
});

test('query strings having ordered index arrays and format option as `index`', t => {
	t.deepEqual(fn.parse('foo[1]=bar&foo[0]=baz&foo[3]=one&foo[2]=two', {
		arrayFormat: 'index'
	}), {foo: ['baz', 'bar', 'two', 'one']});

	t.deepEqual(fn.parse('foo[0]=bar&foo[1]=baz&foo[2]=one&foo[3]=two', {
		arrayFormat: 'index'
	}), {foo: ['bar', 'baz', 'one', 'two']});

	t.deepEqual(fn.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero', {
		arrayFormat: 'index'
	}), {foo: ['zero', 'one', 'two', 'three']});

	t.deepEqual(fn.parse('foo[3]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index'
	}), {foo: ['zero', 'one', 'two', 'three'], bat: 'buz'});

	t.deepEqual(fn.parse('foo[1]=bar&foo[0]=baz', {
		arrayFormat: 'index'
	}), {foo: ['baz', 'bar']});

	t.deepEqual(fn.parse('foo[102]=three&foo[2]=two&foo[1]=one&foo[0]=zero&bat=buz', {
		arrayFormat: 'index'
	}), {bat: 'buz', foo: ['zero', 'one', 'two', 'three']});

	t.deepEqual(fn.parse('foo[102]=three&foo[2]=two&foo[100]=one&foo[0]=zero&bat=buz', {
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

	t.deepEqual(fn.parse(original, options), expected);

	t.is(fn.stringify(expected, options), sortedOriginal);
});

test('circuit original -> parse - > stringify -> sorted original', t => {
	const original = 'foo[21474836471]=foo&foo[21474836470]&foo[1]=one&foo[0]=&bat=buz';
	const sortedOriginal = 'bat=buz&foo[0]=&foo[1]=one&foo[2]&foo[3]=foo';
	const options = {
		arrayFormat: 'index'
	};

	t.deepEqual(fn.stringify(fn.parse(original, options), options), sortedOriginal);
});
