import test from 'ava';
import queryString from '..';

test('stringify url not containing query string', t => {
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/'}), 'https://foo.bar/');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}}), 'https://foo.bar/');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {}}), 'https://foo.bar/#top');
	t.deepEqual(queryString.stringifyUrl({url: '', query: {}}), '');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {}}), 'https://foo.bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?foo=bar', query: {}}), 'https://foo.bar?foo=bar');
});

test('stringify url with query string', t => {
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {foo: 'bar'}}), 'https://foo.bar/?foo=bar#top');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', a: 'b'}}), 'https://foo.bar?a=b&foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: ['bar', 'baz']}}), 'https://foo.bar?foo=bar&foo=baz');
});
