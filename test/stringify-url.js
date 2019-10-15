import test from 'ava';
import queryString from '..';

test('stringify URL without query string', t => {
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/'}), 'https://foo.bar/');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}}), 'https://foo.bar/');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {}}), 'https://foo.bar/#top');
	t.deepEqual(queryString.stringifyUrl({url: '', query: {}}), '');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {}}), 'https://foo.bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?foo=bar', query: {}}), 'https://foo.bar?foo=bar');
});

test('stringify URL with query string', t => {
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {foo: 'bar'}}), 'https://foo.bar/?foo=bar#top');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', a: 'b'}}), 'https://foo.bar?a=b&foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: ['bar', 'baz']}}), 'https://foo.bar?foo=bar&foo=baz');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?foo=baz', query: {foo: 'bar'}}), 'https://foo.bar?foo=baz&foo=bar');
});
