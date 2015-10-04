import test from 'ava';
import qs from '../';

test('stringify', t => {
	t.same(qs.stringify({foo: 'bar'}), 'foo=bar');
	t.same(qs.stringify({foo: 'bar', bar: 'baz'}), 'bar=baz&foo=bar');
	t.end();
});

test('different types', t => {
	t.same(qs.stringify(), '');
	t.same(qs.stringify(0), '');
	t.end();
});

test('URI encode', t => {
	t.same(qs.stringify({'foo bar': 'baz faz'}), 'foo%20bar=baz%20faz');
	t.same(qs.stringify({'foo bar': 'baz\'faz'}), 'foo%20bar=baz%27faz');
	t.end();
});

test('handle array value', t => {
	t.same(qs.stringify({abc: 'abc', foo: ['bar', 'baz']}), 'abc=abc&foo=bar&foo=baz');
	t.end();
});

test('handle empty array value', t => {
	t.same(qs.stringify({abc: 'abc', foo: []}), 'abc=abc');
	t.end();
});
