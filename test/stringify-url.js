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
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?a=b', query: {foo: ['bar', 'baz']}}), 'https://foo.bar?a=b&foo=bar&foo=baz');
	t.deepEqual(queryString.stringifyUrl({url: 'https://foo.bar?foo=baz', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
});

test('stringify URL from the result of `parseUrl` without query string', t => {
	const url = 'https://foo.bar';
	const parsedUrl = queryString.parseUrl(url);
	t.deepEqual(queryString.stringifyUrl(parsedUrl), url);
});

test('stringify URL from the result of `parseUrl` with query string', t => {
	const url = 'https://foo.bar?foo=bar&foo=baz';
	const parsedUrl = queryString.parseUrl(url);
	t.deepEqual(queryString.stringifyUrl(parsedUrl), url);
});

test('stringify URL from the result of `parseUrl` with query string that contains `=`', t => {
	const url = 'https://foo.bar?foo=bar=&foo=baz=';
	const parsedUrl = queryString.parseUrl(url);
	t.deepEqual(queryString.stringifyUrl(parsedUrl, {encode: false}), url);
});
