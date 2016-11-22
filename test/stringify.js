import test from 'ava';
import fn from '../';

test('stringify', t => {
	t.is(fn.stringify({foo: 'bar'}), 'foo=bar');
	t.is(fn.stringify({
		foo: 'bar',
		bar: 'baz'
	}), 'bar=baz&foo=bar');
});

test('different types', t => {
	t.is(fn.stringify(), '');
	t.is(fn.stringify(0), '');
});

test('URI encode', t => {
	t.is(fn.stringify({'foo bar': 'baz faz'}), 'foo%20bar=baz%20faz');
	t.is(fn.stringify({'foo bar': 'baz\'faz'}), 'foo%20bar=baz%27faz');
});

test('no encoding', t => {
	t.is(fn.stringify({'foo:bar': 'baz:faz'}, {encode: false}), 'foo:bar=baz:faz');
});

test('handle array value', t => {
	t.is(fn.stringify({
		abc: 'abc',
		foo: ['bar', 'baz']
	}), 'abc=abc&foo=bar&foo=baz');
});

test('array order', t => {
	t.is(fn.stringify({
		abc: 'abc',
		foo: ['baz', 'bar']
	}), 'abc=abc&foo=baz&foo=bar');
});

test('handle empty array value', t => {
	t.is(fn.stringify({
		abc: 'abc',
		foo: []
	}), 'abc=abc');
});

test('should not encode undefined values', t => {
	t.is(fn.stringify({
		abc: undefined,
		foo: 'baz'
	}), 'foo=baz');
});

test('should encode null values as just a key', t => {
	t.is(fn.stringify({
		'x y z': null,
		'abc': null,
		'foo': 'baz'
	}), 'abc&foo=baz&x%20y%20z');
});

test('handle null values in array', t => {
	t.is(fn.stringify({
		foo: null,
		bar: [null, 'baz']
	}), 'bar&bar=baz&foo');
});

test('handle undefined values in array', t => {
	t.is(fn.stringify({
		foo: null,
		bar: [undefined, 'baz']
	}), 'bar=baz&foo');
});

test('handle undefined and null values in array', t => {
	t.is(fn.stringify({
		foo: null,
		bar: [undefined, null, 'baz']
	}), 'bar&bar=baz&foo');
});

test('strict encoding', t => {
	t.is(fn.stringify({foo: '\'bar\''}), 'foo=%27bar%27');
	t.is(fn.stringify({foo: ['\'bar\'', '!baz']}), 'foo=%27bar%27&foo=%21baz');
});

test('loose encoding', t => {
	t.is(fn.stringify({foo: '\'bar\''}, {strict: false}), 'foo=\'bar\'');
	t.is(fn.stringify({foo: ['\'bar\'', '!baz']}, {strict: false}), 'foo=\'bar\'&foo=!baz');
});

test('array of objects order', t => {
	t.is(fn.stringify([
		{a: 'b'},
		{x: 'y'},
		{y: 'z'}
	]), 'a=b&x=y&y=z');
	t.is(fn.stringify([
		{x: 'y'},
		{a: 'b'},
		{y: 'z'}
	]), 'x=y&a=b&y=z');
});
