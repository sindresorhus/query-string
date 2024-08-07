import {defineConfig} from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';

const swcConfig = {
	swc: {
		env: {
			target: 'es5',
		},
	},
};
export default defineConfig({
	input: 'index.js',
	output: {
		file: 'dist/index.js',
		format: 'esm',
	},
	plugins: [
		resolve(),
		swc(swcConfig),
	],
});
