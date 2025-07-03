export type ParseOptions = {
	/**
	Decode the keys and values. URI components are decoded with [`decode-uri-component`](https://github.com/SamVerschueren/decode-uri-component).

	@default true
	*/
	readonly decode?: boolean;

	/**
	@default 'none'

	- `bracket`: Parse arrays with bracket representation:

		```
		import queryString from 'query-string';

		queryString.parse('foo[]=1&foo[]=2&foo[]=3', {arrayFormat: 'bracket'});
		//=> {foo: ['1', '2', '3']}
		```

	- `index`: Parse arrays with index representation:

		```
		import queryString from 'query-string';

		queryString.parse('foo[0]=1&foo[1]=2&foo[3]=3', {arrayFormat: 'index'});
		//=> {foo: ['1', '2', '3']}
		```

	- `comma`: Parse arrays with elements separated by comma:

		```
		import queryString from 'query-string';

		queryString.parse('foo=1,2,3', {arrayFormat: 'comma'});
		//=> {foo: ['1', '2', '3']}
		```

	- `separator`: Parse arrays with elements separated by a custom character:

		```
		import queryString from 'query-string';

		queryString.parse('foo=1|2|3', {arrayFormat: 'separator', arrayFormatSeparator: '|'});
		//=> {foo: ['1', '2', '3']}
		```

	- `bracket-separator`: Parse arrays (that are explicitly marked with brackets) with elements separated by a custom character:

		```
		import queryString from 'query-string';

		queryString.parse('foo[]', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> {foo: []}

		queryString.parse('foo[]=', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> {foo: ['']}

		queryString.parse('foo[]=1', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
	 	//=> {foo: ['1']}

		queryString.parse('foo[]=1|2|3', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> {foo: ['1', '2', '3']}

		queryString.parse('foo[]=1||3|||6', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> {foo: ['1', '', 3, '', '', '6']}

		queryString.parse('foo[]=1|2|3&bar=fluffy&baz[]=4', {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> {foo: ['1', '2', '3'], bar: 'fluffy', baz:['4']}
		```

	- `colon-list-separator`: Parse arrays with parameter names that are explicitly marked with `:list`:

		```
		import queryString from 'query-string';

		queryString.parse('foo:list=one&foo:list=two', {arrayFormat: 'colon-list-separator'});
		//=> {foo: ['one', 'two']}
		```

	- `none`: Parse arrays with elements using duplicate keys:

		```
		import queryString from 'query-string';

		queryString.parse('foo=1&foo=2&foo=3');
		//=> {foo: ['1', '2', '3']}
		```
	*/
	readonly arrayFormat?:
	| 'bracket'
	| 'index'
	| 'comma'
	| 'separator'
	| 'bracket-separator'
	| 'colon-list-separator'
	| 'none';

	/**
	The character used to separate array elements when using `{arrayFormat: 'separator'}`.

	@default ,
	*/
	readonly arrayFormatSeparator?: string;

	/**
	Supports both `Function` as a custom sorting function or `false` to disable sorting.

	If omitted, keys are sorted using `Array#sort`, which means, converting them to strings and comparing strings in Unicode code point order.

	@default true

	@example
	```
	import queryString from 'query-string';

	const order = ['c', 'a', 'b'];

	queryString.parse('?a=one&b=two&c=three', {
		sort: (itemLeft, itemRight) => order.indexOf(itemLeft) - order.indexOf(itemRight)
	});
	//=> {c: 'three', a: 'one', b: 'two'}
	```

	@example
	```
	import queryString from 'query-string';

	queryString.parse('?a=one&c=three&b=two', {sort: false});
	//=> {a: 'one', c: 'three', b: 'two'}
	```
	*/
	readonly sort?: ((itemLeft: string, itemRight: string) => number) | false;

	/**
	Parse the value as a number type instead of string type if it's a number.

	@default false

	@example
	```
	import queryString from 'query-string';

	queryString.parse('foo=1', {parseNumbers: true});
	//=> {foo: 1}
	```
	*/
	readonly parseNumbers?: boolean;

	/**
	Parse the value as a boolean type instead of string type if it's a boolean.

	@default false

	@example
	```
	import queryString from 'query-string';

	queryString.parse('foo=true', {parseBooleans: true});
	//=> {foo: true}
	```
	*/
	readonly parseBooleans?: boolean;

	/**
	Parse the fragment identifier from the URL and add it to result object.

	@default false

	@example
	```
	import queryString from 'query-string';

	queryString.parseUrl('https://foo.bar?foo=bar#xyz', {parseFragmentIdentifier: true});
	//=> {url: 'https://foo.bar', query: {foo: 'bar'}, fragmentIdentifier: 'xyz'}
	```
	*/
	readonly parseFragmentIdentifier?: boolean;

	/**
	Specifies a schema for parsing query values with explicit type declarations. When defined, the types provided here take precedence over general parsing options such as `parseNumbers`, `parseBooleans`, and `arrayFormat`.

	Use this option to explicitly define the type of a specific parameter—particularly useful in cases where the type might otherwise be ambiguous (e.g., phone numbers or IDs).

	You can also provide a custom function to transform the value. The function will receive the raw string and should return the desired parsed result (see Example 4).

	NOTE: Array types (`string[]`, `number[]`) are ignored if `arrayFormat` is set to `'none'`. (See Example 5.)

	@default {}

	@example
	Parse `phoneNumber` as a string, overriding the `parseNumber` option:
	```
	import queryString from 'query-string';

	queryString.parse('?phoneNumber=%2B380951234567&id=1', {
		parseNumbers: true,
		types: {
			phoneNumber: 'string',
		}
	});
	//=> {phoneNumber: '+380951234567', id: 1}
	```

	@example
	Parse `items` as an array of strings, overriding the `parseNumber` option:
	```
	import queryString from 'query-string';

	queryString.parse('?age=20&items=1%2C2%2C3', {
		parseNumber: true,
		types: {
			items: 'string[]',
		}
	});
	//=> {age: 20, items: ['1', '2', '3']}
	```

	@example
	Force `age` to be parsed as a number even when `parseNumbers` is false:
	```
	import queryString from 'query-string';

	queryString.parse('?age=20&id=01234&zipcode=90210', {
		types: {
			age: 'number',
		}
	});
	//=> {age: 20, id: '01234', zipcode: '90210'}
	```

	@example
	Use a custom parser function to transform the value of `age`:
	```
	import queryString from 'query-string';

	queryString.parse('?age=20&id=01234&zipcode=90210', {
		types: {
			age: (value) => value * 2,
		}
	});
	//=> {age: 40, id: '01234', zipcode: '90210'}
	```

	@example
	Array types are ignored when `arrayFormat` is set to `'none'`:
	```
	queryString.parse('ids=001%2C002%2C003&foods=apple%2Corange%2Cmango', {
		arrayFormat: 'none',
		types: {
			ids: 'number[]',
			foods: 'string[]',
		},
	}
	//=> {ids:'001,002,003', foods:'apple,orange,mango'}
	```

	@example
	Parse a query using multiple type definitions:
	```
	import queryString from 'query-string';

	queryString.parse('?ids=001%2C002%2C003&items=1%2C2%2C3&price=22%2E00&numbers=1%2C2%2C3&double=5&number=20', {
		arrayFormat: 'comma',
		types: {
			ids: 'string',
			items: 'string[]',
			price: 'string',
			numbers: 'number[]',
			double: (value) => value * 2,
			number: 'number',
		},
	});
	//=> {ids: '001,002,003', items: ['1', '2', '3'], price: '22.00', numbers: [1, 2, 3], double: 10, number: 20}
	```

	@example
	Force `flagged` to be parsed as a boolean even when `parseBooleans` is false:
	```
	queryString.parse('?isAdmin=true&flagged=true&isOkay=0', {
			parseBooleans: false,
			types: {
					flagged: 'boolean',
					isOkay: 'boolean',
			},
	});
	//=> {isAdmin: 'true', flagged: true, isOkay: false}
	```

	Note: The `'boolean'` type also converts `'0'` and `'1'` to booleans, and treats valueless keys (e.g. `?flag`) as `true`.
	*/
	readonly types?: Record<
	string,
	'boolean' | 'number' | 'string' | 'string[]' | 'number[]' | ((value: string) => unknown)
	>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ParsedQuery<T = string> = Record<string, T | null | Array<T | null>>;

/**
Parse a query string into an object. Leading `?` or `#` are ignored, so you can pass `location.search` or `location.hash` directly.

The returned object is created with [`Object.create(null)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create) and thus does not have a `prototype`.

@param query - The query string to parse.
*/
export function parse(query: string, options: {parseBooleans: true; parseNumbers: true} & ParseOptions): ParsedQuery<string | boolean | number>;
export function parse(query: string, options: {parseBooleans: true} & ParseOptions): ParsedQuery<string | boolean>;
export function parse(query: string, options: {parseNumbers: true} & ParseOptions): ParsedQuery<string | number>;
export function parse(query: string, options?: ParseOptions): ParsedQuery;

export type ParsedUrl = {
	readonly url: string;
	readonly query: ParsedQuery;

	/**
	The fragment identifier of the URL.

	Present when the `parseFragmentIdentifier` option is `true`.
	*/
	readonly fragmentIdentifier?: string;
};

/**
Extract the URL and the query string as an object.

If the `parseFragmentIdentifier` option is `true`, the object will also contain a `fragmentIdentifier` property.

@param url - The URL to parse.

@example
```
import queryString from 'query-string';

queryString.parseUrl('https://foo.bar?foo=bar');
//=> {url: 'https://foo.bar', query: {foo: 'bar'}}

queryString.parseUrl('https://foo.bar?foo=bar#xyz', {parseFragmentIdentifier: true});
//=> {url: 'https://foo.bar', query: {foo: 'bar'}, fragmentIdentifier: 'xyz'}
```
*/
export function parseUrl(url: string, options?: ParseOptions): ParsedUrl;

export type StringifyOptions = {
	/**
	Strictly encode URI components. It uses [`encodeURIComponent`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) if set to `false`. You probably [don't care](https://github.com/sindresorhus/query-string/issues/42) about this option.

	@default true
	*/
	readonly strict?: boolean;

	/**
	[URL encode](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) the keys and values.

	@default true
	*/
	readonly encode?: boolean;

	/**
	@default 'none'

	- `bracket`: Serialize arrays using bracket representation:

		```
		import queryString from 'query-string';

		queryString.stringify({foo: [1, 2, 3]}, {arrayFormat: 'bracket'});
		//=> 'foo[]=1&foo[]=2&foo[]=3'
		```

	- `index`: Serialize arrays using index representation:

		```
		import queryString from 'query-string';

		queryString.stringify({foo: [1, 2, 3]}, {arrayFormat: 'index'});
		//=> 'foo[0]=1&foo[1]=2&foo[2]=3'
		```

	- `comma`: Serialize arrays by separating elements with comma:

		```
		import queryString from 'query-string';

		queryString.stringify({foo: [1, 2, 3]}, {arrayFormat: 'comma'});
		//=> 'foo=1,2,3'

		queryString.stringify({foo: [1, null, '']}, {arrayFormat: 'comma'});
		//=> 'foo=1,,'
		// Note that typing information for null values is lost
		// and `.parse('foo=1,,')` would return `{foo: [1, '', '']}`.
		```

	- `separator`: Serialize arrays by separating elements with character:

		```
		import queryString from 'query-string';

		queryString.stringify({foo: [1, 2, 3]}, {arrayFormat: 'separator', arrayFormatSeparator: '|'});
		//=> 'foo=1|2|3'
		```

	- `bracket-separator`: Serialize arrays by explicitly post-fixing array names with brackets and separating elements with a custom character:

		```
		import queryString from 'query-string';

		queryString.stringify({foo: []}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> 'foo[]'

		queryString.stringify({foo: ['']}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> 'foo[]='

		queryString.stringify({foo: [1]}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> 'foo[]=1'

		queryString.stringify({foo: [1, 2, 3]}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> 'foo[]=1|2|3'

		queryString.stringify({foo: [1, '', 3, null, null, 6]}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> 'foo[]=1||3|||6'

		queryString.stringify({foo: [1, '', 3, null, null, 6]}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|', skipNull: true});
		//=> 'foo[]=1||3|6'

		queryString.stringify({foo: [1, 2, 3], bar: 'fluffy', baz: [4]}, {arrayFormat: 'bracket-separator', arrayFormatSeparator: '|'});
		//=> 'foo[]=1|2|3&bar=fluffy&baz[]=4'
		```

	- `colon-list-separator`: Serialize arrays with parameter names that are explicitly marked with `:list`:

		```js
		import queryString from 'query-string';

		queryString.stringify({foo: ['one', 'two']}, {arrayFormat: 'colon-list-separator'});
		//=> 'foo:list=one&foo:list=two'
		```

	- `none`: Serialize arrays by using duplicate keys:

		```
		import queryString from 'query-string';

		queryString.stringify({foo: [1, 2, 3]});
		//=> 'foo=1&foo=2&foo=3'
		```
	*/
	readonly arrayFormat?: 'bracket' | 'index' | 'comma' | 'separator' | 'bracket-separator' | 'colon-list-separator' | 'none';

	/**
	The character used to separate array elements when using `{arrayFormat: 'separator'}`.

	@default ,
	*/
	readonly arrayFormatSeparator?: string;

	/**
	Supports both `Function` as a custom sorting function or `false` to disable sorting.

	If omitted, keys are sorted using `Array#sort`, which means, converting them to strings and comparing strings in Unicode code point order.

	@default true

	@example
	```
	import queryString from 'query-string';

	const order = ['c', 'a', 'b'];

	queryString.stringify({a: 1, b: 2, c: 3}, {
		sort: (itemLeft, itemRight) => order.indexOf(itemLeft) - order.indexOf(itemRight)
	});
	//=> 'c=3&a=1&b=2'
	```

	@example
	```
	import queryString from 'query-string';

	queryString.stringify({b: 1, c: 2, a: 3}, {sort: false});
	//=> 'b=1&c=2&a=3'
	```
	*/
	readonly sort?: ((itemLeft: string, itemRight: string) => number) | false;

	/**
	Skip keys with `null` as the value.

	Note that keys with `undefined` as the value are always skipped.

	@default false

	@example
	```
	import queryString from 'query-string';

	queryString.stringify({a: 1, b: undefined, c: null, d: 4}, {
		skipNull: true
	});
	//=> 'a=1&d=4'

	queryString.stringify({a: undefined, b: null}, {
		skipNull: true
	});
	//=> ''
	```
	*/
	readonly skipNull?: boolean;

	/**
	Skip keys with an empty string as the value.

	@default false

	@example
	```
	import queryString from 'query-string';

	queryString.stringify({a: 1, b: '', c: '', d: 4}, {
		skipEmptyString: true
	});
	//=> 'a=1&d=4'
	```

	@example
	```
	import queryString from 'query-string';

	queryString.stringify({a: '', b: ''}, {
		skipEmptyString: true
	});
	//=> ''
	```
	*/
	readonly skipEmptyString?: boolean;
};

export type Stringifiable = string | boolean | number | bigint | null | undefined; // eslint-disable-line @typescript-eslint/ban-types

export type StringifiableRecord = Record<
string,
Stringifiable | readonly Stringifiable[]
>;

/**
Stringify an object into a query string and sort the keys.
*/
export function stringify(
	// TODO: Use the below instead when the following TS issues are fixed:
	// - https://github.com/microsoft/TypeScript/issues/15300
	// - https://github.com/microsoft/TypeScript/issues/42021
	// Context: https://github.com/sindresorhus/query-string/issues/298
	// object: StringifiableRecord,
	object: Record<string, any>,
	options?: StringifyOptions
): string;

/**
Extract a query string from a URL that can be passed into `.parse()`.

Note: This behaviour can be changed with the `skipNull` option.
*/
export function extract(url: string): string;

export type UrlObject = {
	readonly url: string;

	/**
	Overrides queries in the `url` property.
	*/
	readonly query?: StringifiableRecord;

	/**
	Overrides the fragment identifier in the `url` property.
	*/
	readonly fragmentIdentifier?: string;
};

/**
Stringify an object into a URL with a query string and sorting the keys. The inverse of [`.parseUrl()`](https://github.com/sindresorhus/query-string#parseurlstring-options)

Query items in the `query` property overrides queries in the `url` property.

The `fragmentIdentifier` property overrides the fragment identifier in the `url` property.

@example
```
queryString.stringifyUrl({url: 'https://foo.bar', query: {foo: 'bar'}});
//=> 'https://foo.bar?foo=bar'

queryString.stringifyUrl({url: 'https://foo.bar?foo=baz', query: {foo: 'bar'}});
//=> 'https://foo.bar?foo=bar'

queryString.stringifyUrl({
	url: 'https://foo.bar',
	query: {
		top: 'foo'
	},
	fragmentIdentifier: 'bar'
});
//=> 'https://foo.bar?top=foo#bar'
```
*/
export function stringifyUrl(
	object: UrlObject,
	options?: StringifyOptions
): string;

/**
Pick query parameters from a URL.

@param url - The URL containing the query parameters to pick.
@param keys - The names of the query parameters to keep. All other query parameters will be removed from the URL.
@param filter - A filter predicate that will be provided the name of each query parameter and its value. The `parseNumbers` and `parseBooleans` options also affect `value`.

@returns The URL with the picked query parameters.

@example
```
queryString.pick('https://foo.bar?foo=1&bar=2#hello', ['foo']);
//=> 'https://foo.bar?foo=1#hello'

queryString.pick('https://foo.bar?foo=1&bar=2#hello', (name, value) => value === 2, {parseNumbers: true});
//=> 'https://foo.bar?bar=2#hello'
```
*/
export function pick(
	url: string,
	keys: readonly string[],
	options?: ParseOptions & StringifyOptions
): string;
export function pick(
	url: string,
	filter: (key: string, value: string | boolean | number) => boolean,
	options?: {parseBooleans: true; parseNumbers: true} & ParseOptions & StringifyOptions
): string;
export function pick(
	url: string,
	filter: (key: string, value: string | boolean) => boolean,
	options?: {parseBooleans: true} & ParseOptions & StringifyOptions
): string;
export function pick(
	url: string,
	filter: (key: string, value: string | number) => boolean,
	options?: {parseNumbers: true} & ParseOptions & StringifyOptions
): string;

/**
Exclude query parameters from a URL. Like `.pick()` but reversed.

@param url - The URL containing the query parameters to exclude.
@param keys - The names of the query parameters to remove. All other query parameters will remain in the URL.
@param filter - A filter predicate that will be provided the name of each query parameter and its value. The `parseNumbers` and `parseBooleans` options also affect `value`.

@returns The URL without the excluded the query parameters.

@example
```
queryString.exclude('https://foo.bar?foo=1&bar=2#hello', ['foo']);
//=> 'https://foo.bar?bar=2#hello'

queryString.exclude('https://foo.bar?foo=1&bar=2#hello', (name, value) => value === 2, {parseNumbers: true});
//=> 'https://foo.bar?foo=1#hello'
```
*/
export function exclude(
	url: string,
	keys: readonly string[],
	options?: ParseOptions & StringifyOptions
): string;
export function exclude(
	url: string,
	filter: (key: string, value: string | boolean | number) => boolean,
	options?: {parseBooleans: true; parseNumbers: true} & ParseOptions & StringifyOptions
): string;
export function exclude(
	url: string,
	filter: (key: string, value: string | boolean) => boolean,
	options?: {parseBooleans: true} & ParseOptions & StringifyOptions
): string;
export function exclude(
	url: string,
	filter: (key: string, value: string | number) => boolean,
	options?: {parseNumbers: true} & ParseOptions & StringifyOptions
): string;
