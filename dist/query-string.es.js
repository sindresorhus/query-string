function r(t){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(t)}function t(r,t){return function(r){if(Array.isArray(r))return r}(r)||function(r,t){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(r)))return;var e=[],n=!0,o=!1,a=void 0;try{for(var i,c=r[Symbol.iterator]();!(n=(i=c.next()).done)&&(e.push(i.value),!t||e.length!==t);n=!0);}catch(r){o=!0,a=r}finally{try{n||null==c.return||c.return()}finally{if(o)throw a}}return e}(r,t)||n(r,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function e(r){return function(r){if(Array.isArray(r))return o(r)}(r)||function(r){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(r))return Array.from(r)}(r)||n(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function n(r,t){if(r){if("string"==typeof r)return o(r,t);var e=Object.prototype.toString.call(r).slice(8,-1);return"Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?o(r,t):void 0}}function o(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=new Array(t);e<t;e++)n[e]=r[e];return n}var a=new RegExp("%[a-f0-9]{2}","gi"),i=new RegExp("(%[a-f0-9]{2})+","gi");function c(r,t){try{return decodeURIComponent(r.join(""))}catch(r){}if(1===r.length)return r;t=t||1;var e=r.slice(0,t),n=r.slice(t);return Array.prototype.concat.call([],c(e),c(n))}function u(r){try{return decodeURIComponent(r)}catch(n){for(var t=r.match(a),e=1;e<t.length;e++)t=(r=c(t,e).join("")).match(a);return r}}var l,f,s=function(r){if("string"!=typeof r)throw new TypeError("Expected `encodedURI` to be of type `string`, got `"+typeof r+"`");try{return r=r.replace(/\+/g," "),decodeURIComponent(r)}catch(t){return function(r){for(var t={"%FE%FF":"��","%FF%FE":"��"},e=i.exec(r);e;){try{t[e[0]]=decodeURIComponent(e[0])}catch(r){var n=u(e[0]);n!==e[0]&&(t[e[0]]=n)}e=i.exec(r)}t["%C2"]="�";for(var o=Object.keys(t),a=0;a<o.length;a++){var c=o[a];r=r.replace(new RegExp(c,"g"),t[c])}return r}(r)}},y=(r,t)=>{if("string"!=typeof r||"string"!=typeof t)throw new TypeError("Expected the arguments to be of type `string`");if(""===t)return[r];const e=r.indexOf(t);return-1===e?[r]:[r.slice(0,e),r.slice(e+t.length)]},p=(function(o,a){function i(r){if("string"!=typeof r||1!==r.length)throw new TypeError("arrayFormatSeparator must be single character string")}function c(r,t){return t.encode?t.strict?encodeURIComponent(r).replace(/[!'()*]/g,(r=>"%"+r.charCodeAt(0).toString(16).toUpperCase())):encodeURIComponent(r):r}function u(r,t){return t.decode?s(r):r}function l(t){return Array.isArray(t)?t.sort():"object"===r(t)?l(Object.keys(t)).sort((function(r,t){return Number(r)-Number(t)})).map((function(r){return t[r]})):t}function f(r){var t=r.indexOf("#");return-1!==t&&(r=r.slice(0,t)),r}function p(r){var t=(r=f(r)).indexOf("?");return-1===t?"":r.slice(t+1)}function m(r,t){return t.parseNumbers&&!Number.isNaN(Number(r))&&"string"==typeof r&&""!==r.trim()?r=Number(r):!t.parseBooleans||null===r||"true"!==r.toLowerCase()&&"false"!==r.toLowerCase()||(r="true"===r.toLowerCase()),r}function d(e,o){i((o=Object.assign({decode:!0,sort:!0,arrayFormat:"none",arrayFormatSeparator:",",parseNumbers:!1,parseBooleans:!1},o)).arrayFormatSeparator);var a=function(r){var t;switch(r.arrayFormat){case"index":return function(r,e,n){t=/\[(\d*)\]$/.exec(r),r=r.replace(/\[\d*\]$/,""),t?(void 0===n[r]&&(n[r]={}),n[r][t[1]]=e):n[r]=e};case"bracket":return function(r,e,n){t=/(\[\])$/.exec(r),r=r.replace(/\[\]$/,""),t?void 0!==n[r]?n[r]=[].concat(n[r],e):n[r]=[e]:n[r]=e};case"comma":case"separator":return function(t,e,n){var o="string"==typeof e&&e.includes(r.arrayFormatSeparator),a="string"==typeof e&&!o&&u(e,r).includes(r.arrayFormatSeparator);e=a?u(e,r):e;var i=o||a?e.split(r.arrayFormatSeparator).map((function(t){return u(t,r)})):null===e?e:u(e,r);n[t]=i};default:return function(r,t,e){void 0!==e[r]?e[r]=[].concat(e[r],t):e[r]=t}}}(o),c=Object.create(null);if("string"!=typeof e)return c;if(!(e=e.trim().replace(/^[?#&]/,"")))return c;var f,s=function(r,t){var e;if("undefined"==typeof Symbol||null==r[Symbol.iterator]){if(Array.isArray(r)||(e=n(r))||t&&r&&"number"==typeof r.length){e&&(r=e);var o=0,a=function(){};return{s:a,n:function(){return o>=r.length?{done:!0}:{done:!1,value:r[o++]}},e:function(r){throw r},f:a}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,c=!0,u=!1;return{s:function(){e=r[Symbol.iterator]()},n:function(){var r=e.next();return c=r.done,r},e:function(r){u=!0,i=r},f:function(){try{c||null==e.return||e.return()}finally{if(u)throw i}}}}(e.split("&"));try{for(s.s();!(f=s.n()).done;){var p=f.value,d=t(y(o.decode?p.replace(/\+/g," "):p,"="),2),b=d[0],g=d[1];g=void 0===g?null:["comma","separator"].includes(o.arrayFormat)?g:u(g,o),a(u(b,o),g,c)}}catch(r){s.e(r)}finally{s.f()}for(var v=0,h=Object.keys(c);v<h.length;v++){var j=h[v],S=c[j];if("object"===r(S)&&null!==S)for(var w=0,O=Object.keys(S);w<O.length;w++){var x=O[w];S[x]=m(S[x],o)}else c[j]=m(S,o)}return!1===o.sort?c:(!0===o.sort?Object.keys(c).sort():Object.keys(c).sort(o.sort)).reduce((function(t,e){var n=c[e];return Boolean(n)&&"object"===r(n)&&!Array.isArray(n)?t[e]=l(n):t[e]=n,t}),Object.create(null))}a.extract=p,a.parse=d,a.stringify=function(r,t){if(!r)return"";i((t=Object.assign({encode:!0,strict:!0,arrayFormat:"none",arrayFormatSeparator:","},t)).arrayFormatSeparator);for(var n=function(e){return t.skipNull&&null==r[e]||t.skipEmptyString&&""===r[e]},o=function(r){switch(r.arrayFormat){case"index":return function(t){return function(n,o){var a=n.length;return void 0===o||r.skipNull&&null===o||r.skipEmptyString&&""===o?n:[].concat(e(n),null===o?[[c(t,r),"[",a,"]"].join("")]:[[c(t,r),"[",c(a,r),"]=",c(o,r)].join("")])}};case"bracket":return function(t){return function(n,o){return void 0===o||r.skipNull&&null===o||r.skipEmptyString&&""===o?n:[].concat(e(n),null===o?[[c(t,r),"[]"].join("")]:[[c(t,r),"[]=",c(o,r)].join("")])}};case"comma":case"separator":return function(t){return function(e,n){return null==n||0===n.length?e:0===e.length?[[c(t,r),"=",c(n,r)].join("")]:[[e,c(n,r)].join(r.arrayFormatSeparator)]}};default:return function(t){return function(n,o){return void 0===o||r.skipNull&&null===o||r.skipEmptyString&&""===o?n:[].concat(e(n),null===o?[c(t,r)]:[[c(t,r),"=",c(o,r)].join("")])}}}}(t),a={},u=0,l=Object.keys(r);u<l.length;u++){var f=l[u];n(f)||(a[f]=r[f])}var s=Object.keys(a);return!1!==t.sort&&s.sort(t.sort),s.map((function(e){var n=r[e];return void 0===n?"":null===n?c(e,t):Array.isArray(n)?n.reduce(o(e),[]).join("&"):c(e,t)+"="+c(n,t)})).filter((function(r){return r.length>0})).join("&")},a.parseUrl=function(r,e){e=Object.assign({decode:!0},e);var n=t(y(r,"#"),2),o=n[0],a=n[1];return Object.assign({url:o.split("?")[0]||"",query:d(p(r),e)},e&&e.parseFragmentIdentifier&&a?{fragmentIdentifier:u(a,e)}:{})},a.stringifyUrl=function(r,t){t=Object.assign({encode:!0,strict:!0},t);var e=f(r.url).split("?")[0]||"",n=a.extract(r.url),o=a.parse(n,{sort:!1}),i=Object.assign(o,r.query),u=a.stringify(i,t);u&&(u="?".concat(u));var l=function(r){var t="",e=r.indexOf("#");return-1!==e&&(t=r.slice(e)),t}(r.url);return r.fragmentIdentifier&&(l="#".concat(c(r.fragmentIdentifier,t))),"".concat(e).concat(u).concat(l)}}(f={path:l,exports:{},require:function(r,t){return function(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}(null==t&&f.path)}},f.exports),f.exports);export default p;
