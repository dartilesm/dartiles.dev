import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import url from '@rollup/plugin-url';
import path from 'path';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import preprocess from 'svelte-preprocess';
import pkg from './package.json';
import { config as envConfig } from 'dotenv'


const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const onwarn = (warning, onwarn) =>
	(warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
	(warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) ||
	onwarn(warning);

const preprocessConfig = {
	preprocess: preprocess({
		scss: {
			includePaths: [path.resolve(__dirname, 'src/assets/styles')]
		}
	})
}

export default {
	client: {
		input: config.client.input(),
		output: config.client.output(),
		plugins: [
			replace({
				preventAssignment: true,
				process: JSON.stringify({
					env: {
						browser: true,
						NODE_ENV: mode,
					  ...envConfig().parsed // attached the .env config
					}
				  }),
			}),
			svelte({
				compilerOptions: {
					dev,
					hydratable: true
				},
				...preprocessConfig
			}),
			url({
				sourceDir: path.resolve(__dirname, 'src/node_modules/images'),
				publicPath: '/client/'
			}),
			resolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs(),

			babel({
				extensions: ['.js', '.mjs', '.html', '.svelte'],
				babelHelpers: 'runtime',
				exclude: ['node_modules/@babel/**'],
				presets: [
					['@babel/preset-env', {
						targets: '> 0.25%, not dead'
					}]
				],
				plugins: [
					'@babel/plugin-syntax-dynamic-import',
					['@babel/plugin-transform-runtime', {
						useESModules: true
					}]
				]
			}),

			!dev && terser({
				module: true
			}),
			json()
		],

		preserveEntrySignatures: false,
		onwarn,
	},

	server: {
		input: config.server.input(),
		output: config.server.output(),
		plugins: [
			replace({
				preventAssignment: true,
				values:{
					'process.browser': false,
					'process.env.NODE_ENV': JSON.stringify(mode)
				},
			}),
			svelte({
				compilerOptions: {
					dev,
					generate: 'ssr',
					hydratable: true
				},
				emitCss: false,
				...preprocessConfig
				
			}),
			url({
				sourceDir: path.resolve(__dirname, 'src/node_modules/images'),
				publicPath: '/client/',
				emitFiles: false // already emitted by client build
			}),
			resolve({
				dedupe: ['svelte']
			}),
			commonjs(),
			json()
		],
		external: Object.keys(pkg.dependencies).concat(require('module').builtinModules),
		preserveEntrySignatures: 'strict',
		onwarn,
	},

	serviceworker: {
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				preventAssignment: true,
				values:{
					'process.browser': true,
					'process.env.NODE_ENV': JSON.stringify(mode)
				},
			}),
			commonjs(),
			!dev && terser()
		],
		preserveEntrySignatures: false,
		onwarn,
	}
};
