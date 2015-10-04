import test from 'ava';
import fn from '../';

test('stringify', t => {
	t.same(fn.stringify({foo: 'bar'}), 'foo=bar');
	t.same(fn.stringify({foo: 'bar', bar: 'baz'}), 'bar=baz&foo=bar');
	t.end();
});

test('different types', t => {
	t.same(fn.stringify(), '');
	t.same(fn.stringify(0), '');
	t.end();
});

test('URI encode', t => {
	t.same(fn.stringify({'foo bar': 'baz faz'}), 'foo%20bar=baz%20faz');
	t.same(fn.stringify({'foo bar': 'baz\'faz'}), 'foo%20bar=baz%27faz');
	t.end();
});

test('handle array value', t => {
	t.same(fn.stringify({abc: 'abc', foo: ['bar', 'baz']}), 'abc=abc&foo=bar&foo=baz');
	t.end();
});

test('handle empty array value', t => {
	t.same(fn.stringify({abc: 'abc', foo: []}), 'abc=abc');
	t.end();
});
