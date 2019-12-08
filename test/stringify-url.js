import test from 'ava';
import queryString from '..';

test('stringify URL without a query string', t => {
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/'}), 'https://foo.bar/');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}}), 'https://foo.bar/');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {}}), 'https://foo.bar/#top');
	t.deepEqual(queryString.stringifyUrl({url: '', query: {}}), '');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {}}), 'https://foo.bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?foo=bar', query: {}}), 'https://foo.bar?foo=bar');
});

test('stringify URL with a query string', t => {
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {foo: 'bar'}}), 'https://foo.bar/?foo=bar#top');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', a: 'b'}}), 'https://foo.bar?a=b&foo=bar');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: ['bar', 'baz']}}), 'https://foo.bar?foo=bar&foo=baz');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?foo=baz', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
});

test('stringify URL from the result of `parseUrl` without query string', t => {
	const parsedUrl = queryString.parseUrl('https://foo.bar#top');
	t.deepEqual(queryString.stringifyUrl(parsedUrl), 'https://foo.bar');
});

test('stringify URL from the result of `parseUrl` with query string', t => {
	const parsedUrl = queryString.parseUrl('https://foo.bar?foo=bar&foo=baz#top');
	t.deepEqual(queryString.stringifyUrl(parsedUrl), 'https://foo.bar?foo=bar&foo=baz');
});

test('stringify URL from the result of `parseUrl` with query string that contains `=`', t => {
	const parsedUrl = queryString.parseUrl('https://foo.bar?foo=bar=&foo=baz=');
	t.deepEqual(queryString.stringifyUrl(parsedUrl, {encode: false}), 'https://foo.bar?foo=bar=&foo=baz=');
});
