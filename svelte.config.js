import preprocess from 'svelte-preprocess';
import vercel from '@sveltejs/adapter-vercel';
import path from 'path'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: vercel(),
		files: {
			assets: 'static',
			hooks: 'src/hooks',
			lib: 'src/lib',
			routes: 'src/routes',
			serviceWorker: 'src/service-worker',
			template: 'src/app.html'
		},
		floc: false,
		hydrate: true,
		target: '#svelte',
		paths: {
			assets: '',
			base: ''
		},
		vite: {
			resolve: {
				alias: {
					'$assets': path.resolve(__dirname, './src/assets')
				}
			},
			css: {
				preprocessorOptions: {
					scss: {
						additionalData: `
							@import "src/assets/styles/sass/_variables.scss";
							@import "src/assets/styles/sass/_mixins.scss";
						`
					}
				}
			}
		}
	},

	preprocess: [
		preprocess({
			scss: {
				prependData: `
					@import "src/assets/styles/sass/_variables.scss";
					@import "src/assets/styles/sass/_mixins.scss";
				`
			}
		})
	]
};

export default config;
