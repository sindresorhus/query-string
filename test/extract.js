import test from 'ava';
import qs from '../';

test('should extract qs from url', t => {
	t.is(qs.extract('http://foo.bar/?abc=def&hij=klm'), 'abc=def&hij=klm');
	t.is(qs.extract('http://foo.bar/?'), '');
	t.end();
});

test('should handle strings not containing qs', t => {
	t.is(qs.extract('http://foo.bar/'), '');
	t.is(qs.extract(''), '');
	t.end();
});

test('should throw for invalid values', t => {
	t.throws(qs.extract.bind(qs, null), TypeError);
	t.throws(qs.extract.bind(qs, undefined), TypeError);
	t.end();
});
