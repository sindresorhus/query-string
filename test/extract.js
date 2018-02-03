import test from 'ava';
import m from '..';

test('extracts query string from url', t => {
	t.is(m.extract('https://foo.bar/?abc=def&hij=klm'), 'abc=def&hij=klm');
	t.is(m.extract('https://foo.bar/?'), '');
	t.is(m.extract('https://foo.bar/?regex=ab?c'), 'regex=ab?c');
});

test('handles strings not containing query string', t => {
	t.is(m.extract('https://foo.bar'), '');
	t.is(m.extract(''), '');
});

test('throws for invalid values', t => {
	t.throws(() => {
		m.extract(null);
	}, TypeError);

	t.throws(() => {
		m.extract(undefined);
	}, TypeError);
});
