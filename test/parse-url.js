import test from 'node:test';
import assert from 'node:assert/strict';
import queryString from '../index.js';

test('handles strings with query string', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar#top?foo=bar')), {url: 'https://foo.bar', query: {}});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz#top')), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz')), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=null')), {url: 'https://foo.bar', query: {foo: 'null'}});
});

test('handles strings not containing query string', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/')), {url: 'https://foo.bar/', query: {}});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/#top')), {url: 'https://foo.bar/', query: {}});
	assert.deepEqual(structuredClone(queryString.parseUrl('')), {url: '', query: {}});
});

test('handles an empty fragment identifier', () => {
	// A bare trailing `#` is an empty fragment, which the URL parser keeps, so `stringifyUrl()` writes it back as-is. `parseUrl()` treats an empty fragment as no fragment, the same as `fragmentIdentifier: ''` removing one, so there is no `fragmentIdentifier` property.
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar#', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {}});
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar#'}), 'https://foo.bar#');
	assert.equal(queryString.stringifyUrl({url: 'https://foo.bar#', query: {a: 1}}), 'https://foo.bar?a=1#');
});

test('handles strings with query string that contain =', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=baz=bar&foo=baz#top')), {url: 'https://foo.bar', query: {foo: ['baz=bar', 'baz']}});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=bar=&foo=baz=')), {url: 'https://foo.bar', query: {foo: ['bar=', 'baz=']}});
});

test('handles query-heavy URLs without splitting the whole URL', () => {
	const count = 10_000_000;
	const url = `https://foo.bar?${'?'.repeat(count)}`;
	const startTime = performance.now();
	const parsed = queryString.parseUrl(url, {sort: false});
	const elapsedTime = performance.now() - startTime;

	assert.equal(parsed.url, 'https://foo.bar');
	// This is a ceiling, not a target. The URL is 10 MB, so collecting it costs a
	// few hundred milliseconds on a busy machine no matter how the parsing is
	// written, which is what the old 120 ms budget was measuring. Splitting the
	// whole URL is quadratic in the length, which at this size takes minutes, so
	// there is still a wide gap between passing and failing.
	assert.ok(elapsedTime < 2000, `Expected URL parsing to avoid splitting the whole URL. Took ${elapsedTime}ms.`);
});

test('handles strings with fragment identifier', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?top=foo#bar', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {top: 'foo'}, fragmentIdentifier: 'bar'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo=bar&foo=baz#top', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {foo: ['bar', 'baz']}, fragmentIdentifier: 'top'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/#top', {parseFragmentIdentifier: true})), {url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'top'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/#st%C3%A5le', {parseFragmentIdentifier: true})), {url: 'https://foo.bar/', query: {}, fragmentIdentifier: 'ståle'});
});

test('throws for invalid values', () => {
	assert.throws(() => {
		queryString.parseUrl(null);
	}, TypeError);

	assert.throws(() => {
		queryString.parseUrl(undefined);
	}, TypeError);
});

test('handles index array format without sorting', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?foo[1]=b&foo[0]=a', {arrayFormat: 'index', sort: false})), {url: 'https://foo.bar', query: {foo: ['a', 'b']}});
});

test('a `?` inside the fragment identifier does not start a query string', () => {
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar#/users?id=1', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {}, fragmentIdentifier: '/users?id=1'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?a=1#b?c=2', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {a: '1'}, fragmentIdentifier: 'b?c=2'});
	assert.equal(queryString.extract('https://foo.bar#/users?id=1'), '');
});

test('ignores leading and trailing whitespace, like `parse()` and the URL parser do', () => {
	// `parse()` already trims the query, so the query and the rest of the URL agreed only when nothing followed the query. Trailing whitespace after the fragment identifier, like a newline from pasted input, ended up in `fragmentIdentifier` and was percent-encoded by `stringifyUrl()`.
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?a=1#top ', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {a: '1'}, fragmentIdentifier: 'top'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar?a=1#top\n', {parseFragmentIdentifier: true})), {url: 'https://foo.bar', query: {a: '1'}, fragmentIdentifier: 'top'});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/ ')), {url: 'https://foo.bar/', query: {}});
	assert.deepEqual(structuredClone(queryString.parseUrl(' https://foo.bar?a=1')), {url: 'https://foo.bar', query: {a: '1'}});
	assert.deepEqual(structuredClone(queryString.parseUrl('\thttps://foo.bar?a=1\t')), {url: 'https://foo.bar', query: {a: '1'}});
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/#\t', {parseFragmentIdentifier: true})), {url: 'https://foo.bar/', query: {}});
	assert.deepEqual(structuredClone(queryString.parseUrl(' ')), {url: '', query: {}});
	// Whitespace inside the URL is kept.
	assert.deepEqual(structuredClone(queryString.parseUrl('https://foo.bar/a b?c=1#d e', {parseFragmentIdentifier: true})), {url: 'https://foo.bar/a b', query: {c: '1'}, fragmentIdentifier: 'd e'});
	assert.equal(queryString.stringifyUrl(queryString.parseUrl('https://foo.bar?a=1#top ', {parseFragmentIdentifier: true})), 'https://foo.bar?a=1#top');
});
