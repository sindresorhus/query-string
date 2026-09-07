import decodeComponent from 'decode-uri-component';
import {includeKeys} from 'filter-obj';
import splitOnFirst from 'split-on-first';

// eslint-disable-next-line unicorn/prefer-code-point
const strictUriEncode = string => encodeURIComponent(string).replaceAll(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

function encoderForArrayFormat(options) {
	switch (options.arrayFormat) {
		case 'index': {
			return key => (result, value) => {
				const index = result.length;

				if (
					value === undefined
					|| (options.skipNull && value === null)
					|| (options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					result.push([encode(key, options), '[', index, ']'].join(''));
					return result;
				}

				result.push([encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join(''));
				return result;
			};
		}

		case 'bracket': {
			return key => (result, value) => {
				if (
					value === undefined
					|| (options.skipNull && value === null)
					|| (options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					result.push([encode(key, options), '[]'].join(''));
					return result;
				}

				result.push([encode(key, options), '[]=', encode(value, options)].join(''));
				return result;
			};
		}

		case 'colon-list-separator': {
			return key => (result, value) => {
				if (
					value === undefined
					|| (options.skipNull && value === null)
					|| (options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					result.push([encode(key, options), ':list'].join(''));
					return result;
				}

				result.push([encode(key, options), ':list=', encode(value, options)].join(''));
				return result;
			};
		}

		case 'comma':
		case 'separator':
		case 'bracket-separator': {
			const keyValueSeparator = options.arrayFormat === 'bracket-separator'
				? '[]='
				: '=';

			return key => (result, value) => {
				if (
					value === undefined
					|| (options.skipNull && value === null)
					|| (options.skipEmptyString && value === '')
				) {
					return result;
				}

				// Translate null to an empty string so that it doesn't serialize as 'null'
				value = value === null ? '' : value;

				if (result.length === 0) {
					result.push([encode(key, options), keyValueSeparator, encodeArrayItem(value, options)].join(''));
					return result;
				}

				result.push(encodeArrayItem(value, options));
				return result;
			};
		}

		default: {
			return key => (result, value) => {
				if (
					value === undefined
					|| (options.skipNull && value === null)
					|| (options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					result.push(encode(key, options));
					return result;
				}

				result.push([encode(key, options), '=', encode(value, options)].join(''));
				return result;
			};
		}
	}
}

function parserForArrayFormat(options) {
	let result;

	switch (options.arrayFormat) {
		case 'index': {
			// The next free index per key for an entry without one, like `foo[]`. That is what PHP and Rack write for an array item, and what `arrayFormat: 'bracket'` produces. It is appended after the highest index seen so far, like in PHP, instead of every such entry overriding the previous one.
			const nextIndexes = new Map();

			return (key, value, accumulator) => {
				result = /\[(\d*)]$/.exec(key);

				key = key.replace(/\[\d*]$/, '');

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

				const index = result?.[1] || (nextIndexes.get(key) ?? 0);
				accumulator[key][index] = value;
				nextIndexes.set(key, Math.max(nextIndexes.get(key) ?? 0, Number(index) + 1));
			};
		}

		case 'bracket': {
			return (key, value, accumulator) => {
				result = /(\[])$/.exec(key);
				key = key.replace(/\[]$/, '');

				// A repeated key adds its value whether or not it has the marker, like `arrayFormat: 'none'`, instead of silently dropping the earlier values.
				if (accumulator[key] === undefined) {
					accumulator[key] = result ? [value] : value;
					return;
				}

				if (!Array.isArray(accumulator[key])) {
					accumulator[key] = [accumulator[key], value];
					return;
				}

				accumulator[key].push(value);
			};
		}

		case 'colon-list-separator': {
			return (key, value, accumulator) => {
				result = /(:list)$/.exec(key);
				key = key.replace(/:list$/, '');

				if (accumulator[key] === undefined) {
					accumulator[key] = result ? [value] : value;
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
				const isArray = /(\[])$/.test(key);
				key = key.replace(/\[]$/, '');

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
	// A lone surrogate is one UTF-16 code unit, but it is not a character and cannot be percent-encoded, so it would make the encoder throw a `URIError` later instead. Whitespace cannot be a separator because `parse()` ignores leading and trailing whitespace in the query.
	if (typeof value !== 'string' || value.length !== 1) {
		throw new TypeError('arrayFormatSeparator must be a single character');
	}

	if (value.trim() === '') {
		throw new TypeError('arrayFormatSeparator must not be whitespace, since parse() ignores leading and trailing whitespace in the query');
	}

	if (/\p{Surrogate}/u.test(value)) {
		throw new TypeError('arrayFormatSeparator must not be a lone surrogate, since it cannot be percent-encoded');
	}
}

function encode(value, options) {
	const type = typeof value;
	if ((type === 'object' && value !== null) || type === 'function' || type === 'symbol') {
		throw new TypeError(`Unsupported value type: ${type}. Supported types are string, number, bigint, boolean, null, and undefined. Use the \`replacer\` option to transform other types.`);
	}

	if (options.encode) {
		try {
			return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
		} catch {
			// A lone surrogate cannot be encoded as UTF-8, so `encodeURIComponent` throws for it. It is replaced with U+FFFD, like `URLSearchParams` and the `URL` hash setter do. With the `u` flag, `\p{Surrogate}` only matches a surrogate that is not part of a pair.
			return encode(String(value).replaceAll(/\p{Surrogate}/gu, '\uFFFD'), options);
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

	const encodedSeparator = encodeURIComponent(arrayFormatSeparator) === arrayFormatSeparator ? `%${arrayFormatSeparator.codePointAt(0).toString(16).toUpperCase().padStart(2, '0')}` : encodeURIComponent(arrayFormatSeparator);
	return stringValue.split(arrayFormatSeparator).map(piece => encode(piece, options)).join(encodedSeparator);
}

function decode(value, options) {
	if (options.decode) {
		return decodeComponent(value);
	}

	return value;
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

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	}

	if (typeof input === 'object') {
		return keysSorter(Object.keys(input))
			.sort((a, b) => Number(a) - Number(b))
			.map(key => input[key]);
	}

	return input;
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

	if (type === 'number' && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
		return Number(value);
	}

	// An explicit type takes precedence over `parseNumbers` and `parseBooleans`. A value that does not match its type stays a string. With `arrayFormat: 'none'`, a single value with an array type is not an array and stays a string too.
	if (type === 'boolean' || type === 'number' || type === 'string[]' || type === 'number[]') {
		return value;
	}

	if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
		return value.toLowerCase() === 'true';
	}

	if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
		return Number(value);
	}

	return value;
}

export function extract(input) {
	input = removeHash(input);
	const queryStart = input.indexOf('?');
	if (queryStart === -1) {
		return '';
	}

	return input.slice(queryStart + 1);
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

	query = query.trim().replace(/^[?#&]/, '');

	if (!query) {
		return returnValue;
	}

	if (/^&+$/.test(query)) {
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
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		value = value === undefined ? null : (['comma', 'separator', 'bracket-separator'].includes(options.arrayFormat) ? value : decode(value, options));

		// The key is decoded before the array format looks for its marker, so a percent-encoded marker like `foo%5B%5D` is also an array item. This is intentional. `URLSearchParams` and HTML forms percent-encode `[`, `]`, and `:` in keys, and servers like Rack and PHP decode the key before they look for the marker. The trade-off is that a key that itself ends in a marker is not distinguishable from the marker after decoding, so `stringify({'foo[]': 'x'}, {arrayFormat: 'bracket'})` does not round-trip.
		formatter(decode(key, options), value, returnValue);

		parameterStart = index + 1;
	}

	for (let [key, value] of Object.entries(returnValue)) {
		// The `index` array format collects the items in an object keyed by index. Turn it into an array ordered by index.
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			value = keysSorter(value);
			returnValue[key] = value;
		}

		if (Array.isArray(value) && options.types[key] !== 'string') {
			for (const [index, item] of value.entries()) {
				const typeOption = options.types[key];
				const type = typeof typeOption === 'function' ? typeOption : (typeOption ? typeOption.replace('[]', '') : undefined);
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
	// eslint-disable-next-line unicorn/no-array-reduce
	return (options.sort === true ? Object.keys(returnValue).sort() : Object.keys(returnValue).sort(options.sort)).reduce((result, key) => {
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
		if (
			value === undefined
			|| (options.skipNull && value === null)
			|| (options.skipEmptyString && value === '')
		) {
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
		url: getUrlWithoutQuery(url_ ?? ''),
		query: parse(extract(url), options),
		...(options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}),
	};
}

export function stringifyUrl(object, options) {
	options = {
		encode: true,
		strict: true,
		...definedOptions(options),
	};

	const url = getUrlWithoutQuery(removeHash(object.url)) || '';
	const queryFromUrl = extract(object.url);

	// When the output is not encoded, keep the existing query as-is instead of decoding it. Decoding without re-encoding would corrupt it.
	let query = parse(queryFromUrl, {sort: false, ...options, decode: options.encode});

	const queryFromObject = Object.fromEntries(Object.entries(object.query ?? {}));

	if (!options.encode) {
		const overrides = new Map();

		for (const [key, value] of Object.entries(queryFromObject)) {
			const decodedKey = decodeComponent(key.replaceAll('+', ' '));
			if (!overrides.has(decodedKey)) {
				overrides.set(decodedKey, {key, value});
			}
		}

		const mergedQuery = {};

		for (const [key, value] of Object.entries(query)) {
			const override = overrides.get(decodeComponent(key.replaceAll('+', ' ')));
			if (override) {
				mergedQuery[override.key] = override.value;
			} else {
				mergedQuery[key] = value;
			}
		}

		query = mergedQuery;
	}

	let queryString = stringify({...query, ...queryFromObject}, options);
	queryString &&= `?${queryString}`;

	let hash = getHash(object.url);
	if (typeof object.fragmentIdentifier === 'string') {
		// An empty fragment identifier removes the fragment, like `url.hash = ''` does.
		hash = object.fragmentIdentifier === '' ? '' : `#${object.fragmentIdentifier}`;

		if (options.encode) {
			// The fragment identifier is a decoded value, like the query values, so `parseUrl()` reads it back unchanged. That is what the `fragment` component of Go's `net/url`, Java's `URI`, and Swift's `URLComponents` does too. The `URL` hash setter instead expects an already-encoded fragment: it leaves `%` as-is, which would turn `100%` into an invalid URL and `%23top` into `#top` after parsing. So `%` is encoded here first. The URL parser also silently strips ASCII tab and newline from its input, so those are encoded first too. The setter then encodes the rest of the WHATWG fragment percent-encode set (controls, space, `"`, `<`, `>`, and backtick) and keeps `/`, `?`, and `#`, so hash routes like `#/users?id=1` stay readable. With `encode: false`, the fragment identifier is written as-is, like the query.
			// The fragment percent-encode set does not depend on the scheme, so the caller's URL is deliberately not parsed here; it may not even be parseable.
			const throwawayUrl = new URL('https://query-string.invalid');
			throwawayUrl.hash = hash.replaceAll(/[%\t\n\r]/g, character => `%${character.codePointAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
			hash = throwawayUrl.hash;
		}
	}

	return `${url}${queryString}${hash}`;
}

export function pick(input, filter, options) {
	// The keys array is a filter, not an order. Filtering with a predicate keeps the parsed object's key order, which matters with `sort: false`. Integer-index keys are enumerated first in numeric order, and repeated keys are grouped together.
	if (Array.isArray(filter)) {
		const filterSet = new Set(filter);
		return pick(input, key => filterSet.has(key), options);
	}

	options = definedOptions(options);

	// `parseNumbers`, `parseBooleans`, `types`, and `decode` only apply to the `value` the predicate receives. The URL is written back from the plain string values, decoded only when they are encoded again, so a value like `007` is kept as-is instead of being rewritten as `7`, and a value like `a%20b` is not percent-encoded a second time. When the output is not encoded, the input is not decoded either, since decoding without re-encoding would corrupt it.
	const {url, query} = parseUrl(input, {
		...options,
		decode: options.encode ?? true,
		parseNumbers: false,
		parseBooleans: false,
		types: undefined,
	});
	const typedQuery = parse(extract(input), {decode: options.encode ?? true, ...options});

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
