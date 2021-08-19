import test from 'ava';
import {extract} from '../index.js';

test('extracts query string from url', t => {
	t.is(extract('https://foo.bar/?abc=def&hij=klm'), 'abc=def&hij=klm');
	t.is(extract('https://foo.bar/?'), '');
	t.is(extract('https://foo.bar/?regex=ab?c'), 'regex=ab?c');
	t.is(extract('https://foo.bar#top?foo=bar'), '');
	t.is(extract('https://foo.bar?foo=bar#top'), 'foo=bar');
});

test('handles strings not containing query string', t => {
	t.is(extract('https://foo.bar'), '');
	t.is(extract('https://foo.bar#top'), '');
	t.is(extract(''), '');
});

test('throws for invalid values', t => {
	t.throws(() => {
		extract(null);
	}, TypeError);

	t.throws(() => {
		extract(undefined);
	}, TypeError);
});
