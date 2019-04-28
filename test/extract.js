import test from 'ava';
import queryString from '..';

test('extracts query string from url', t => {
	t.is(queryString.extract('https://foo.bar/?abc=def&hij=klm'), 'abc=def&hij=klm');
	t.is(queryString.extract('https://foo.bar/?'), '');
	t.is(queryString.extract('https://foo.bar/?regex=ab?c'), 'regex=ab?c');
	t.is(queryString.extract('https://foo.bar#top?foo=bar'), '');
	t.is(queryString.extract('https://foo.bar?foo=bar#top'), 'foo=bar');
});

test('handles strings not containing query string', t => {
	t.is(queryString.extract('https://foo.bar'), '');
	t.is(queryString.extract('https://foo.bar#top'), '');
	t.is(queryString.extract(''), '');
});

test('throws for invalid values', t => {
	t.throws(() => {
		queryString.extract(null);
	}, TypeError);

	t.throws(() => {
		queryString.extract(undefined);
	}, TypeError);
});
