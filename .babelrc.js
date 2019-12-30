const path = require("path")
/* if no targets are specified, @babel/preset-env
 * behaves exactly the same as @babel/preset-es2015, @babel/preset-es2016 and @babel/preset-es2017 together
 */
module.exports = {
	presets: ["@babel/preset-env"],
	plugins: [
		"@babel/plugin-proposal-object-rest-spread",
		"@babel/plugin-transform-arrow-functions",
		"@babel/proposal-class-properties"
	]
}
