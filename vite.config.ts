import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { vite as vidstack } from 'vidstack/plugins';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), vidstack(), sveltekit(), devtoolsJson()],
	server: {
		allowedHosts: ['.ngrok-free.dev']
	}
});
