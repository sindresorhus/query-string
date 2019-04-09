import test from 'ava';
import queryString from '..';

test('stringify', t => {
	t.is(queryString.stringify({foo: 'bar'}), 'foo=bar');
	t.is(queryString.stringify({
		foo: 'bar',
		bar: 'baz'
	}), 'bar=baz&foo=bar');
});

test('different types', t => {
	t.is(queryString.stringify(), '');
	t.is(queryString.stringify(0), '');
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
		foo: ['bar', 'baz']
	}), 'abc=abc&foo=bar&foo=baz');
});

test('array order', t => {
	t.is(queryString.stringify({
		abc: 'abc',
		foo: ['baz', 'bar']
	}), 'abc=abc&foo=baz&foo=bar');
});

test('handle empty array value', t => {
	t.is(queryString.stringify({
		abc: 'abc',
		foo: []
	}), 'abc=abc');
});

test('should not encode undefined values', t => {
	t.is(queryString.stringify({
		abc: undefined,
		foo: 'baz'
	}), 'foo=baz');
});

test('should encode null values as just a key', t => {
	t.is(queryString.stringify({
		'x y z': null,
		abc: null,
		foo: 'baz'
	}), 'abc&foo=baz&x%20y%20z');
});

test('handle null values in array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [null, 'baz']
	}), 'bar&bar=baz&foo');
});

test('handle undefined values in array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [undefined, 'baz']
	}), 'bar=baz&foo');
});

test('handle undefined and null values in array', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: [undefined, null, 'baz']
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
		bar: ['one', 'two']
	}, {
		arrayFormat: 'index'
	}), 'bar[0]=one&bar[1]=two&foo');
});

test('array stringify representation with array brackets', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two']
	}, {
		arrayFormat: 'bracket'
	}), 'bar[]=one&bar[]=two&foo');
});

test('array stringify representation with array brackets and null value', t => {
	t.is(queryString.stringify({
		foo: ['a', null, ''],
		bar: [null]
	}, {
		arrayFormat: 'bracket'
	}), 'bar[]&foo[]=a&foo[]&foo[]=');
});

test('array stringify representation with array commas', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two']
	}, {
		arrayFormat: 'comma'
	}), 'bar=one,two&foo');
});

test('array stringify representation with array commas and null value', t => {
	t.is(queryString.stringify({
		foo: ['a', null, ''],
		bar: [null]
	}, {
		arrayFormat: 'comma'
	}), 'foo=a');
});

test('array stringify representation with array commas and 0 value', t => {
	t.is(queryString.stringify({
		foo: ['a', null, 0],
		bar: [null]
	}, {
		arrayFormat: 'comma'
	}), 'foo=a,0');
});

test('array stringify representation with a bad array format', t => {
	t.is(queryString.stringify({
		foo: null,
		bar: ['one', 'two']
	}, {
		arrayFormat: 'badinput'
	}), 'bar=one&bar=two&foo');
});

test('array stringify representation with array indexes and sparse array', t => {
	const fixture = ['one', 'two'];
	fixture[10] = 'three';
	t.is(queryString.stringify({bar: fixture}, {arrayFormat: 'index'}), 'bar[0]=one&bar[1]=two&bar[2]=three');
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
		destination: 'g'
	};
	t.is(queryString.stringify(fixture, {sort: false}), 'story=a&patch=b&deployment=c&lat=10&lng=20&sb=d&sc=e&mn=f&ln=g&nf=h&srs=i&destination=g');
});

test('should disable sorting', t => {
	t.is(queryString.stringify({
		c: 'foo',
		b: 'bar',
		a: 'baz'
	}, {
		sort: false
	}), 'c=foo&b=bar&a=baz');
});
