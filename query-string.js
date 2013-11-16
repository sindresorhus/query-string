/*!
	query-string
	Parse and stringify URL query strings
	https://github.com/sindresorhus/query-string
	by Sindre Sorhus
	MIT License
*/
(function () {
	'use strict';
	var queryString = {};

	queryString.parse = function (str) {
		if (typeof str !== 'string') {
			return {};
		}

		str = str.trim().replace(/^\?/, '');

		if (!str) {
			return {};
		}

		return str.trim().split('&').reduce(function (ret, param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			ret[parts[0]] = parts[1] === undefined ? null : decodeURIComponent(parts[1]);
			return ret;
		}, {});
	};

	queryString.stringify = function (obj) {
		return obj ? Object.keys(obj).map(function (key) {
			return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
		}).join('&') : '';
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = queryString;
	} else {
		window.queryString = queryString;
	}
})();
