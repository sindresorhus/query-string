import test from 'ava';
import queryString from '../index.js';

test('stringify URL without a query string', t => {
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/'}), 'https://foo.bar/');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}}), 'https://foo.bar/');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {}}), 'https://foo.bar/#top');
	t.is(queryString.stringifyUrl({url: '', query: {}}), '');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?', query: {}}), 'https://foo.bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?foo=bar', query: {}}), 'https://foo.bar?foo=bar');
});

test('stringify URL with a query string', t => {
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/#top', query: {foo: 'bar'}}), 'https://foo.bar/?foo=bar#top');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', a: 'b'}}), 'https://foo.bar?a=b&foo=bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?a=b', query: {foo: ['bar', 'baz']}}), 'https://foo.bar?a=b&foo=bar&foo=baz');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?foo=baz', query: {foo: 'bar'}}), 'https://foo.bar?foo=bar');
});

test('stringify URL with fragment identifier', t => {
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {top: 'foo'}, fragmentIdentifier: 'bar'}), 'https://foo.bar?top=foo#bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: ['bar', 'baz']}, fragmentIdentifier: 'top'}), 'https://foo.bar?foo=bar&foo=baz#top');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'top'}), 'https://foo.bar/#top');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/#abc', query: {}, fragmentIdentifier: 'top'}), 'https://foo.bar/#top');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {}}), 'https://foo.bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {}, fragmentIdentifier: 'foo bar'}), 'https://foo.bar#foo%20bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '/foo/bar'}), 'https://foo.bar/#/foo/bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/#foo', query: {}, fragmentIdentifier: ''}), 'https://foo.bar/');
});

test('stringify relative URL with fragment identifier', t => {
	t.is(queryString.stringifyUrl({url: '/users', query: {page: 1}, fragmentIdentifier: 'section'}), '/users?page=1#section');
});

test('stringify relative URL from the result of `parseUrl` with fragment identifier', t => {
	const url = '/users?page=1#section';
	const parsedUrl = queryString.parseUrl(url, {parseFragmentIdentifier: true});

	t.deepEqual(queryString.stringifyUrl(parsedUrl), url);
});

test('skipEmptyString:: stringify URL with a query string', t => {
	const config = {skipEmptyString: true};

	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', baz: ''}}, config), 'https://foo.bar?foo=bar');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar', baz: ['', 'qux']}}, config), 'https://foo.bar?baz=qux&foo=bar');
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

test('stringify URL without sorting existing query params', t => {
	t.is(queryString.stringifyUrl({url: 'https://foo.bar?C=3&A=1', query: {D: 4, B: 2}}, {sort: false}), 'https://foo.bar?C=3&A=1&D=4&B=2');
});

test('stringifyUrl uses parsing options when parsing existing query from url', t => {
	const currentUrl = 'https://localhost:3000/?array[]=item1';

	const result = queryString.stringifyUrl(
		{
			url: currentUrl,
			query: {
				array: [
					'item1',
					'item2',
				],
			},
		},
		{
			arrayFormat: 'bracket',
			skipEmptyString: true,
			skipNull: true,
		},
	);

	t.is(result, 'https://localhost:3000/?array[]=item1&array[]=item2');
});

test('stringify URL with a fragment identifier that starts with `#`', t => {
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '#top'}), 'https://foo.bar/##top');
});

test('stringify URL from the result of `parseUrl` with a `#` in the fragment identifier', t => {
	for (const url of ['https://foo.bar/?a=1#%23top', 'https://foo.bar/?a=1##top']) {
		const parsedUrl = queryString.parseUrl(url, {parseFragmentIdentifier: true});

		t.is(parsedUrl.fragmentIdentifier, '#top');
		t.is(queryString.stringifyUrl(parsedUrl), 'https://foo.bar/?a=1##top');
		t.is(queryString.parseUrl(queryString.stringifyUrl(parsedUrl), {parseFragmentIdentifier: true}).fragmentIdentifier, '#top');
	}
});

test('stringify URL does not double-encode a fragment identifier', t => {
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: '%23top'}), 'https://foo.bar/#%23top');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a%b'}), 'https://foo.bar/#a%b');
	t.is(queryString.stringifyUrl({url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'a?b'}), 'https://foo.bar/#a?b');
});

test('stringify URL with a fragment identifier does not parse the URL', t => {
	t.is(queryString.stringifyUrl({url: 'http://foo.com:99999/p', query: {a: 1}, fragmentIdentifier: 'frag'}), 'http://foo.com:99999/p?a=1#frag');
	t.is(queryString.stringifyUrl({url: 'http://x.com%23/p', query: {a: 1}, fragmentIdentifier: 'frag'}), 'http://x.com%23/p?a=1#frag');
	t.is(queryString.stringifyUrl({url: 'http://[bad/', query: {a: 1}, fragmentIdentifier: '#frag'}), 'http://[bad/?a=1##frag');
});
