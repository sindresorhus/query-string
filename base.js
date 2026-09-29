import {includeKeys} from 'filter-obj';
import splitOnFirst from 'split-on-first';

// eslint-disable-next-line unicorn/prefer-code-point
const strictUriEncode = string => encodeURIComponent(string).replaceAll(/[!'\(\)*]/gv, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

// A value that is left out of the query string. `undefined` is always left out, and `skipNull` and `skipEmptyString` leave out the two others.
function isSkipped(value, options) {
	return (
		value === undefined
		|| (options.skipNull && value === null)
		|| (options.skipEmptyString && value === '')
	);
}

// The suffix of the parameter name that `parse()` looks for. `index` numbers it, `bracket` and `colon-list-separator` use a fixed one, and the other formats use none.
function itemMarkerFor(arrayFormat) {
	switch (arrayFormat) {
		case 'index': {
			return index => `[${index}]`;
		}

		case 'bracket': {
			return () => '[]';
		}

		case 'colon-list-separator': {
			return () => ':list';
		}

		default: {
			return () => '';
		}
	}
}

function encoderForArrayFormat(options) {
	const {arrayFormat} = options;

	if (['comma', 'separator', 'bracket-separator'].includes(arrayFormat)) {
		const keyValueSeparator = arrayFormat === 'bracket-separator' ? '[]=' : '=';

		return key => (result, value) => {
			if (isSkipped(value, options)) {
				return result;
			}

			// Translate null to an empty string so that it doesn't serialize as 'null'
			const item = encodeArrayItem(value === null ? '' : value, options);

			if (result.length === 0) {
				result.push([encode(key, options), keyValueSeparator, item].join(''));
				return result;
			}

			result.push(item);
			return result;
		};
	}

	// These formats write one parameter per item, with the marker in the name.
	const marker = itemMarkerFor(arrayFormat);

	return key => (result, value) => {
		if (isSkipped(value, options)) {
			return result;
		}

		const name = encode(key, options) + marker(result.length);

		if (value === null) {
			result.push(name);
			return result;
		}

		result.push([name, '=', encode(value, options)].join(''));
		return result;
	};
}

function parserForArrayFormat(options) {
	switch (options.arrayFormat) {
		case 'index': {
			// The next free index per key for an entry without one, like `foo[]`. That is what PHP and Rack write for an array item, and what `arrayFormat: 'bracket'` produces. It is appended after the highest index seen so far, like in PHP, instead of every such entry overriding the previous one.
			const nextIndexes = new Map();

			return (key, value, accumulator) => {
				const result = /\[(?<index>\d*)\]$/v.exec(key);

				key = key.replace(/\[(?<index>\d*)\]$/v, '');

				// A repeated key adds its value whether or not it has an index, like the other array formats, instead of silently dropping the earlier values. A plain entry after the first is appended like `foo[]`. A repeated index keeps the last value, like in PHP.
				if (!result && accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				} else if (typeof accumulator[key] !== 'object' || accumulator[key] === null) {
					// A scalar seen before the indexed entries becomes the first item, like in the other array formats. The empty key sorts before any index.
					accumulator[key] = {'': accumulator[key]};
					nextIndexes.set(key, 1);
				}

				const index = result?.groups?.index || (nextIndexes.get(key) ?? 0);
				accumulator[key][index] = value;
				nextIndexes.set(key, Math.max(nextIndexes.get(key) ?? 0, Number(index) + 1));
			};
		}

		case 'bracket':
		case 'colon-list-separator': {
			const marker = options.arrayFormat === 'bracket' ? /\[\]$/v : /:list$/v;

			return (key, value, accumulator) => {
				const isArray = marker.test(key);
				key = key.replace(marker, '');

				// A repeated key adds its value whether or not it has the marker, like `arrayFormat: 'none'`, instead of silently dropping the earlier values.
				if (accumulator[key] === undefined) {
					accumulator[key] = isArray ? [value] : value;
					return;
				}

				if (!Array.isArray(accumulator[key])) {
					accumulator[key] = [accumulator[key], value];
					return;
				}

				accumulator[key].push(value);
			};
		}

		case 'comma':
		case 'separator': {
			return (key, value, accumulator) => {
				// Split the raw value before decoding. A percent-encoded separator (`%2C`) is part of an item, only a literal separator delimits items. This follows RFC 6570 §3.2.8, where list members are percent-encoded and joined with a literal `,`, and matches `stringify()`, `qs`, and OpenAPI clients such as swagger-js and openapi-fetch.
				const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
				const newValue = isArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : (value === null ? value : decode(value, options));

				if (accumulator[key] === undefined) {
					accumulator[key] = newValue;
					return;
				}

				// A repeated key adds its items, like in the other array formats. The items are appended in place, since rebuilding the array for every repetition is quadratic.
				if (!Array.isArray(accumulator[key])) {
					accumulator[key] = [accumulator[key]];
				}

				const items = Array.isArray(newValue) ? newValue : [newValue];
				for (const item of items) {
					accumulator[key].push(item);
				}
			};
		}

		case 'bracket-separator': {
			return (key, value, accumulator) => {
				const isArray = /\[\]$/v.test(key);
				key = key.replace(/\[\]$/v, '');

				// Split the raw value before decoding, like `comma` and `separator`, so an item that contains the separator round-trips: `stringify({foo: ['a,b', 'c']})` gives `foo[]=a%2Cb,c`, which must parse back to `['a,b', 'c']`. Decoding first would make the separator ambiguous, which is also why swagger-js rejected encoding the separator (swagger-api/swagger-ui#9289). A value where the client percent-encoded everything, including the separators, is therefore a single item. See https://github.com/sindresorhus/query-string/issues/398
				// A key without the marker is a single item. A repeated key adds its items either way, like `arrayFormat: 'none'`, instead of silently dropping the earlier values.
				let items;
				if (!isArray) {
					items = [value === null ? value : decode(value, options)];
				} else if (value === null) {
					items = [];
				} else {
					items = value.split(options.arrayFormatSeparator).map(item => decode(item, options));
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = isArray ? items : items[0];
					return;
				}

				if (!Array.isArray(accumulator[key])) {
					accumulator[key] = [accumulator[key]];
				}

				for (const item of items) {
					accumulator[key].push(item);
				}
			};
		}

		default: {
			return (key, value, accumulator) => {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				if (Array.isArray(accumulator[key])) {
					accumulator[key].push(value);
					return;
				}

				accumulator[key] = [accumulator[key], value];
			};
		}
	}
}

function validateArrayFormatSeparator(value) {
	// A lone surrogate is one UTF-16 code unit, but it is not a character and cannot be percent-encoded, so it would make the encoder throw a `URIError` later instead. Whitespace cannot be a separator because `parse()` ignores leading and trailing whitespace in the query. A separator that only works sometimes, like `%` or a hexadecimal digit, is documented as unsupported instead, so that the encoder can keep its best-effort behavior for it.
	if (typeof value !== 'string' || value.length !== 1) {
		throw new TypeError('arrayFormatSeparator must be a single character');
	}

	if (value.trim() === '') {
		throw new TypeError('arrayFormatSeparator must not be whitespace, since parse() ignores leading and trailing whitespace in the query');
	}

	if (/\p{Surrogate}/v.test(value)) {
		throw new TypeError('arrayFormatSeparator must not be a lone surrogate, since it cannot be percent-encoded');
	}
}

function encode(value, options) {
	const type = typeof value;
	if (type === 'function' || type === 'symbol' || (type === 'object' && value !== null)) {
		throw new TypeError(`Unsupported value type: ${type}. Supported types are string, number, bigint, boolean, null, and undefined. Use the \`replacer\` option to transform other types.`);
	}

	if (options.encode) {
		try {
			return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
		} catch {
			// A lone surrogate cannot be encoded as UTF-8, so `encodeURIComponent` throws for it. It is replaced with U+FFFD, like `URLSearchParams` and the `URL` hash setter do. With the `u` flag, `\p{Surrogate}` only matches a surrogate that is not part of a pair.
			return encode(String(value).replaceAll(/\p{Surrogate}/gv, '\u{FFFD}'), options);
		}
	}

	return value;
}

// `parse()` only splits on a literal separator, so a separator inside an item is percent-encoded. `encodeURIComponent` leaves some ASCII characters as-is, like `-`, `.`, `_`, and `~`, so the pieces of the item between the separators are encoded separately and joined with the percent-encoded separator. The encoded item is not searched for the separator, since a separator that is a hex digit would clash with the `%XX` escapes.
function encodeArrayItem(value, options) {
	// `encode()` validates the value type first, since `String()` would hide an unsupported type.
	const encodedValue = encode(value, options);
	const stringValue = String(value);
	const {arrayFormatSeparator} = options;
	if (!options.encode || !stringValue.includes(arrayFormatSeparator)) {
		return encodedValue;
	}

	const percentEncodedSeparator = encodeURIComponent(arrayFormatSeparator);
	// `encodeURIComponent` leaves a few characters as-is, like `-`, `.`, `_`, `~`, and `*`, so the separator has to be encoded by hand for those.
	const encodedSeparator = percentEncodedSeparator === arrayFormatSeparator
		? `%${arrayFormatSeparator.codePointAt(0).toString(16).toUpperCase().padStart(2, '0')}`
		: percentEncodedSeparator;

	return stringValue.split(arrayFormatSeparator).map(piece => encode(piece, options)).join(encodedSeparator);
}

// One percent sign, anywhere. Text between two of these is copied in one go, so a value with no escapes in it costs a single native scan instead of a step per character. A value that holds no escape at all, which is the common case, is returned as it is.
// The `lastIndex` of this and `percentEscape` is shared state, which is only safe because nothing that a caller controls runs while `decodeComponent()` is on the stack. Every user callback, which is a `types` function, a `sort` comparator, a `pick()` filter, and a `replacer`, runs after the loop that decodes the parameters. A callback, a comparator, or an `await` inside `decodeComponent()` would corrupt the two regexes, so set `lastIndex` right before each `exec` and do not reach for a `matchAll` or a `String#replace` here.
const percentSign = /%/gv;

// One percent escape, like `%C3`. The `y` flag makes it match only where it is anchored, so a `%` that starts nothing is not skipped over. The hexadecimal digits may be in either case, like in `%c3`.
const percentEscape = /%[\da-f]{2}/ivy;

// What a byte that cannot be decoded becomes, like the `URL` parser and `URLSearchParams` do.
const replacementCharacter = '�';

// The byte that the percent escape at `position` stands for, or -1 when there is no escape there. A `%` that is not followed by two hexadecimal digits is not an escape, and neither is one that starts the value.
function readPercentByte(value, position) {
	percentEscape.lastIndex = position;
	const match = percentEscape.exec(value);
	return match === null ? -1 : Number.parseInt(match[0].slice(1), 16);
}

// The number of bytes in the UTF-8 sequence that starts with this lead byte, or zero when the byte cannot start one. That is a continuation byte (0x80 to 0xBF), and the lead bytes that are only ever invalid: 0xC0 and 0xC1 can only start an overlong encoding, and 0xF5 to 0xFF can only start a code point above U+10FFFF.
function utf8SequenceLength(leadByte) {
	if (leadByte < 0x80) {
		return 1;
	}

	if (leadByte < 0xC2) {
		return 0;
	}

	if (leadByte < 0xE0) {
		return 2;
	}

	if (leadByte < 0xF0) {
		return 3;
	}

	return leadByte <= 0xF4 ? 4 : 0;
}

// Whether the second byte of a UTF-8 sequence is valid for this lead byte. Any later byte only has to be a continuation byte. The range is narrower for the lead bytes that would otherwise allow an overlong encoding, a surrogate, or a code point above U+10FFFF.
function isValidSecondByte(leadByte, byte) {
	if (byte < 0x80 || byte > 0xBF) {
		return false;
	}

	switch (leadByte) {
		case 0xE0: {
			return byte >= 0xA0;
		}

		case 0xED: {
			return byte <= 0x9F;
		}

		case 0xF0: {
			return byte >= 0x90;
		}

		case 0xF4: {
			return byte <= 0x8F;
		}

		default: {
			return true;
		}
	}
}

// Decode the UTF-8 sequence that starts with the percent escape at `position`. The decoded text and the position just past the sequence are returned.
function decodeSequence(value, position) {
	const leadByte = readPercentByte(value, position);

	// A `%` that is not followed by two hexadecimal digits is not an escape, so it is kept as it is.
	if (leadByte === -1) {
		return ['%', position + 1];
	}

	const length = utf8SequenceLength(leadByte);

	// A continuation byte with no lead byte in front of it, or a lead byte that can only ever start an invalid sequence.
	if (length === 0) {
		return [replacementCharacter, position + 3];
	}

	// An ASCII byte is its own character.
	if (length === 1) {
		return [String.fromCodePoint(leadByte), position + 3];
	}

	// The lead byte holds the top bits of the code point, and each continuation byte holds six more. The sequence stops when a byte is missing, because the value ends, or is not valid where it sits.
	// eslint-disable-next-line no-bitwise -- Unpacking a UTF-8 sequence is bit arithmetic by definition.
	let codePoint = leadByte & (0x7F >> length);
	let offset = 1;

	while (offset < length) {
		const byte = readPercentByte(value, position + (offset * 3));
		if (!(offset === 1 ? isValidSecondByte(leadByte, byte) : (byte >= 0x80 && byte <= 0xBF))) {
			// What was read before the sequence stopped is consumed together with it, so `%E4%80%41` is one replacement character and then `A` rather than a replacement character for every byte.
			return [replacementCharacter, position + (offset * 3)];
		}

		// eslint-disable-next-line no-bitwise -- Unpacking a UTF-8 sequence is bit arithmetic by definition.
		codePoint = (codePoint << 6) | (byte & 0x3F);
		offset++;
	}

	return [String.fromCodePoint(codePoint), position + (length * 3)];
}

// Decode the percent escapes in `value`, like `URLSearchParams` does.
//
// `decodeURIComponent()` is not used on its own because it throws away the whole string as soon as it sees one byte that is not valid UTF-8, and a query string from the network often has one. `decodeSequence()` is what runs then, using the algorithm the `URL` parser uses: a byte that cannot be decoded becomes U+FFFD, and the bytes around it are still decoded.
//
// It is a single left-to-right pass, so the cost is linear in the length of the value. It replaces `decode-uri-component`, whose fallback for a string that `decodeURIComponent()` rejects collected every distinct percent-encoded run into a replacement map and then replaced each entry across the whole string, so a value with N distinct runs cost N passes over N bytes.
function decodeComponent(value) {
	try {
		// Almost every value is valid percent-encoded UTF-8, and the built-in decoder handles those in one pass in C++, which is far faster than the step at a time above. It gives the same answer, so this only decides which of the two paths runs.
		return decodeURIComponent(value);
	} catch {
		// One byte that cannot be decoded makes the built-in decoder throw away the whole value, so the value is decoded the lenient way instead.
	}

	percentSign.lastIndex = 0;

	let output = '';
	let position = 0;
	let match = percentSign.exec(value);

	while (match !== null) {
		// Everything between the last escape and this one is copied as it is.
		output += value.slice(position, match.index);

		const [decoded, nextPosition] = decodeSequence(value, match.index);
		output += decoded;
		position = nextPosition;

		percentSign.lastIndex = position;
		match = percentSign.exec(value);
	}

	return output + value.slice(position);
}

function decode(value, options) {
	return options.decode ? decodeComponent(value) : value;
}

// The key as `parse()` would decode it, so two spellings of the same key, like `a+b` and `a%20b`, can be compared.
function decodeQueryKey(key) {
	return decodeComponent(key.replaceAll('+', ' '));
}

// An option that is explicitly `undefined` uses its default, like an omitted option. That is what a caller passes through with an optional setting, like `{decode: config.decode}`. Spreading it over the defaults would instead override the default with `undefined`, so `{encode: undefined}` would write the values unencoded.
function definedOptions(options) {
	const result = {};

	for (const [key, value] of Object.entries(options ?? {})) {
		if (value !== undefined) {
			result[key] = value;
		}
	}

	return result;
}

// The `index` array format collects the items in an object keyed by the index. The keys are sorted as strings first, so that two spellings of the same index, like `01` and `1`, always come out in the same order, and then numerically. The empty key is the item of a scalar seen before the indexed entries, and it sorts before any index.
function arrayFromIndexes(object) {
	return Object.keys(object)
		// eslint-disable-next-line unicorn/require-array-sort-compare -- The default string sort is what puts `01` and `1` in the same order.
		.toSorted()
		.toSorted((a, b) => Number(a) - Number(b))
		.map(key => object[key]);
}

function removeHash(input) {
	const hashStart = input.indexOf('#');
	if (hashStart !== -1) {
		input = input.slice(0, hashStart);
	}

	return input;
}

function getHash(url) {
	let hash = '';
	const hashStart = url.indexOf('#');
	if (hashStart !== -1) {
		hash = url.slice(hashStart);
	}

	return hash;
}

function getUrlWithoutQuery(url) {
	// Avoid `split('?')` so query-heavy URLs don't allocate large arrays.
	const queryStart = url.indexOf('?');
	return queryStart === -1 ? url : url.slice(0, queryStart);
}

function parseValue(value, options, type) {
	if (type === 'string' && typeof value === 'string') {
		return value;
	}

	if (typeof type === 'function' && typeof value === 'string') {
		return type(value);
	}

	if (type === 'boolean' && value === null) {
		return true;
	}

	if (type === 'boolean' && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
		return value.toLowerCase() === 'true';
	}

	if (type === 'boolean' && value !== null && (value.toLowerCase() === '1' || value.toLowerCase() === '0')) {
		return value.toLowerCase() === '1';
	}

	if ((type === 'string[]' || type === 'number[]') && options.arrayFormat !== 'none' && (typeof value === 'string' || value === null)) {
		// A single value is still an array. The item is parsed with the element type, so a value that is not a number stays a string. A valueless key is an array with a `null` item, like a valueless item of a repeated key.
		return [parseValue(value, options, type.slice(0, -2))];
	}

	if (type === 'number' && typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
		return Number(value);
	}

	// An explicit type takes precedence over `parseNumbers` and `parseBooleans`. A value that does not match its type stays a string. With `arrayFormat: 'none'`, a single value with an array type is not an array and stays a string too.
	if (['boolean', 'number', 'string[]', 'number[]'].includes(type)) {
		return value;
	}

	if (value !== null && options.parseBooleans && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
		return value.toLowerCase() === 'true';
	}

	return typeof value === 'string' && options.parseNumbers && value.trim() !== '' && !Number.isNaN(Number(value)) ? Number(value) : value;
}

export function extract(input) {
	input = removeHash(input);
	const queryStart = input.indexOf('?');
	return queryStart === -1 ? '' : input.slice(queryStart + 1);
}

export function parse(query, options) {
	options = {
		decode: true,
		sort: true,
		arrayFormat: 'none',
		arrayFormatSeparator: ',',
		parseNumbers: false,
		parseBooleans: false,
		...definedOptions(options),
		types: {__proto__: null, ...options?.types},
	};

	validateArrayFormatSeparator(options.arrayFormatSeparator);

	const formatter = parserForArrayFormat(options);

	// Create an object with no prototype
	const returnValue = Object.create(null);

	if (typeof query !== 'string') {
		return returnValue;
	}

	query = query.trim().replace(/^[#&?]/v, '');

	if (!query || /^&+$/v.test(query)) {
		return returnValue;
	}

	let parameterStart = 0;
	let firstSeparator = query.indexOf('&');
	if (firstSeparator === -1) {
		firstSeparator = query.length;
	}

	for (let index = firstSeparator; index <= query.length; index++) {
		if (index < query.length && query[index] !== '&') {
			continue;
		}

		if (index === parameterStart) {
			parameterStart = index + 1;
			continue;
		}

		const parameter = query.slice(parameterStart, index);
		const parameter_ = options.decode ? parameter.replaceAll('+', ' ') : parameter;

		let [key, value] = splitOnFirst(parameter_, '=');

		if (key === undefined) {
			key = parameter_;
		}

		// Missing `=` should be `null`:
		// https://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		value = value === undefined ? null : (['comma', 'separator', 'bracket-separator'].includes(options.arrayFormat) ? value : decode(value, options));

		// The key is decoded before the array format looks for its marker, so a percent-encoded marker like `foo%5B%5D` is also an array item. This is intentional. `URLSearchParams` and HTML forms percent-encode `[`, `]`, and `:` in keys, and servers like Rack and PHP decode the key before they look for the marker. The trade-off is that a key that itself ends in a marker is not distinguishable from the marker after decoding, so `stringify({'foo[]': 'x'}, {arrayFormat: 'bracket'})` does not round-trip.
		formatter(decode(key, options), value, returnValue);

		parameterStart = index + 1;
	}

	for (let [key, value] of Object.entries(returnValue)) {
		// Only the `index` array format collects the items in an object instead of an array.
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			value = arrayFromIndexes(value);
			returnValue[key] = value;
		}

		if (Array.isArray(value) && options.types[key] !== 'string') {
			// The items are parsed with the element type. A type that is not a string, like a function, is passed through, and anything else is ignored, like it is for a scalar value.
			const typeOption = options.types[key];
			const type = typeof typeOption === 'string' ? typeOption.replace('[]', '') : typeOption;

			for (const [index, item] of value.entries()) {
				value[index] = parseValue(item, options, type);
			}
		} else if (Array.isArray(value) && options.types[key] === 'string') {
			returnValue[key] = value.join(options.arrayFormatSeparator);
		} else {
			returnValue[key] = parseValue(value, options, options.types[key]);
		}
	}

	if (options.sort === false) {
		return returnValue;
	}

	// TODO: Remove the use of `reduce`.
	// The default sort is the documented one, and a test covers its code-unit ordering.
	// eslint-disable-next-line unicorn/no-array-reduce, unicorn/require-array-sort-compare
	return (options.sort === true ? Object.keys(returnValue).toSorted() : Object.keys(returnValue).toSorted(options.sort)).reduce((result, key) => {
		result[key] = returnValue[key];
		return result;
	}, Object.create(null));
}

export function stringify(object, options) {
	if (!object) {
		return '';
	}

	options = {
		encode: true,
		strict: true,
		arrayFormat: 'none',
		arrayFormatSeparator: ',',
		...definedOptions(options),
	};

	validateArrayFormatSeparator(options.arrayFormatSeparator);

	const formatter = encoderForArrayFormat(options);

	// Copying into a plain object intentionally drops a key named `__proto__`, since assigning it sets the prototype instead of a property.
	const objectCopy = {};

	// `Object.fromEntries()` would define the key as a real own property instead,
	// which would keep a `__proto__` key that is meant to be dropped here.
	// eslint-disable-next-line unicorn/prefer-object-from-entries
	for (const [key, value] of Object.entries(object)) {
		objectCopy[key] = value;
	}

	const keys = Object.keys(objectCopy);

	if (options.sort !== false) {
		keys.sort(typeof options.sort === 'function' ? options.sort : undefined);
	}

	return keys.map(key => {
		let value = objectCopy[key];

		// Apply replacer function if provided
		if (options.replacer) {
			value = options.replacer(key, value);
		}

		// `skipNull` and `skipEmptyString` look at the replaced value, like they do for array items. A replacer that returns `undefined` skips the key.
		if (isSkipped(value, options)) {
			return '';
		}

		if (value === null) {
			return encode(key, options);
		}

		if (Array.isArray(value)) {
			// Apply replacer to array elements if provided
			// Note: The replacer was already applied to the array itself above. Here it is applied to each element.
			let processedArray = value;
			if (options.replacer) {
				processedArray = value.map((item, index) =>
					options.replacer(`${key}[${index}]`, item),
				).filter(item => item !== undefined);
			}

			const result = processedArray.reduce(formatter(key), []);

			// An array with no items left after skipping is empty. `bracket-separator` writes an empty array as `foo[]`, which `parse()` reads back as `[]`. The other formats have no representation for an empty array, so the key is dropped.
			if (result.length === 0) {
				return options.arrayFormat === 'bracket-separator' ? encode(key, options) + '[]' : '';
			}

			const arrayFormatSeparator = ['comma', 'separator', 'bracket-separator'].includes(options.arrayFormat) ? options.arrayFormatSeparator : '&';
			return result.join(arrayFormatSeparator);
		}

		// With `comma` and `separator`, `parse()` splits any value on the separator, so a scalar that contains it is encoded like an array item. `bracket-separator` only splits a value with the array marker.
		const encodedValue = options.arrayFormat === 'comma' || options.arrayFormat === 'separator' ? encodeArrayItem(value, options) : encode(value, options);
		return encode(key, options) + '=' + encodedValue;
	}).filter(x => x.length > 0).join('&');
}

export function parseUrl(url, options) {
	options = {
		decode: true,
		...definedOptions(options),
	};

	// Leading and trailing whitespace is ignored, like `parse()` does for the query and the URL parser does for the whole URL. Otherwise a newline from pasted input would end up in `fragmentIdentifier`.
	url = url.trim();

	let [url_, hash] = splitOnFirst(url, '#');

	if (url_ === undefined) {
		url_ = url;
	}

	return {
		url: getUrlWithoutQuery(url_),
		query: parse(extract(url), options),
		...(options.parseFragmentIdentifier && hash && {fragmentIdentifier: decode(hash, options)}),
	};
}

export function stringifyUrl(object, options) {
	options = {
		encode: true,
		strict: true,
		...definedOptions(options),
	};

	// Leading and trailing whitespace is ignored, like `parseUrl()` does. `parse()` already trims the query, so whitespace after it disappeared, while whitespace before it or after the fragment identifier was written back, like `https://foo.bar/ ?a=1`.
	const inputUrl = object.url.trim();

	const url = getUrlWithoutQuery(removeHash(inputUrl));
	const queryFromUrl = extract(inputUrl);

	// When the output is not encoded, keep the existing query as-is instead of decoding it. Decoding without re-encoding would corrupt it.
	// The query in the URL is written back from the plain string values, so `parseNumbers`, `parseBooleans`, and `types` passed along with the stringify options, like when the same options object is shared with `parseUrl()`, do not rewrite a value like `007` as `7`.
	let query = parse(queryFromUrl, {
		sort: false,
		...options,
		decode: options.encode,
		parseNumbers: false,
		parseBooleans: false,
		types: undefined,
	});

	const queryFromObject = Object.fromEntries(Object.entries(object.query ?? {}));

	// The query in the URL is not decoded without encoding, so its keys are compared in their decoded form instead, like they are when the output is encoded. Otherwise a key like `%61` in the URL would not be overridden by an `a` in `query`.
	if (!options.encode) {
		const overrides = new Map();

		for (const [key, value] of Object.entries(queryFromObject)) {
			const decodedKey = decodeQueryKey(key);
			if (!overrides.has(decodedKey)) {
				overrides.set(decodedKey, {key, value});
			}
		}

		query = Object.fromEntries(Object.entries(query).map(([key, value]) => {
			const override = overrides.get(decodeQueryKey(key));
			return override ? [override.key, override.value] : [key, value];
		}));
	}

	let queryString = stringify({...query, ...queryFromObject}, options);
	queryString &&= `?${queryString}`;

	let hash = getHash(inputUrl);
	if (typeof object.fragmentIdentifier === 'string') {
		// An empty fragment identifier removes the fragment, like `url.hash = ''` does.
		hash = object.fragmentIdentifier === '' ? '' : `#${object.fragmentIdentifier}`;

		if (options.encode) {
			// The fragment identifier is a decoded value, like the query values, so `parseUrl()` reads it back unchanged. That is what the `fragment` component of Go's `net/url`, Java's `URI`, and Swift's `URLComponents` does too. The `URL` hash setter instead expects an already-encoded fragment: it leaves `%` as-is, which would turn `100%` into an invalid URL and `%23top` into `#top` after parsing. So `%` is encoded here first. The URL parser also silently strips ASCII tab and newline from its input, so those are encoded first too. The setter then encodes the rest of the WHATWG fragment percent-encode set (controls, space, `"`, `<`, `>`, and backtick) and keeps `/`, `?`, and `#`, so hash routes like `#/users?id=1` stay readable. With `encode: false`, the fragment identifier is written as-is, like the query.
			// The fragment percent-encode set does not depend on the scheme, so the caller's URL is deliberately not parsed here; it may not even be parseable.
			const throwawayUrl = new URL('https://query-string.invalid');
			throwawayUrl.hash = hash.replaceAll(/[\t\n\r%]/gv, character => `%${character.codePointAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
			hash = throwawayUrl.hash;
		}
	}

	return `${url}${queryString}${hash}`;
}

export function pick(input, filter, options) {
	// The keys array is a filter, not an order. Filtering with a predicate keeps the parsed object's key order, which matters with `sort: false`. Integer-index keys are enumerated first in numeric order, and repeated keys are grouped together.
	if (Array.isArray(filter)) {
		const filterSet = new Set(filter);
		// eslint-disable-next-line unicorn/no-useless-recursion -- The array case is the same operation as the predicate case, so it delegates instead of duplicating the loop.
		return pick(input, key => filterSet.has(key), options);
	}

	options = definedOptions(options);

	// `parseNumbers`, `parseBooleans`, and `types` only apply to the `value` the predicate receives. The URL is written back from the plain string values, so a value like `007` is kept as-is instead of being rewritten as `7`.
	// The query is decoded exactly when it is encoded again, so a value like `a%20b` is not percent-encoded a second time. When the output is not encoded, the input is not decoded either, since decoding without re-encoding would corrupt it. The `decode` option is ignored: decoding the predicate's view differently from the output would give the two views different keys, so a percent-encoded key, or a `+` in a key, would not find its value.
	// An `encode` that is not a boolean is read for its truthiness, the same way `stringify()` reads it, so that `null` turns encoding off. Reading it as nullish instead would decode the query and then write it back unencoded, which puts a decoded `&` or `#` into the URL. `definedOptions()` has already dropped an `encode` that is `undefined`, so that is the only way to mean the default.
	const shouldDecode = options.encode === undefined ? true : Boolean(options.encode);
	const {url, query} = parseUrl(input, {
		...options,
		decode: shouldDecode,
		parseNumbers: false,
		parseBooleans: false,
		types: undefined,
	});
	const typedQuery = parse(extract(input), {...options, decode: shouldDecode});

	// Keep the fragment identifier as-is. Decoding and re-encoding it could change it.
	return stringifyUrl({
		url: url + getHash(input),
		query: includeKeys(query, key => filter(key, typedQuery[key])),
	}, options);
}

export function exclude(input, filter, options) {
	if (Array.isArray(filter)) {
		const filterSet = new Set(filter);
		return pick(input, key => !filterSet.has(key), options);
	}

	return pick(input, (key, value) => !filter(key, value), options);
}
