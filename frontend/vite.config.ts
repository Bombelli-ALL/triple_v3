import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
	const env = loadEnv(mode, process.cwd(), '')

	if (!env.VITE_PUBLIC_API_URL) throw new Error('VITE_PUBLIC_API_URL is not defined in the environment variables')

	const useLocalApiProxy = env.VITE_PUBLIC_API_URL === '/api'
	const apiProxyTarget = env.VITE_API_PROXY_TARGET

	return {
		plugins: [react(), tailwindcss()],
		server: {
			host: true,
			allowedHosts: ['try-trippple.up.railway.app', 'localhost', '127.0.0.1'],
			proxy: {
				...(useLocalApiProxy && apiProxyTarget
					? {
						'/api': {
							target: apiProxyTarget,
							changeOrigin: true,
						},
					}
					: {}),
				'/osrm': {
					target: 'https://router.project-osrm.org',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/osrm/, ''),
				},
				// ── Google Places proxy (avoids CORS in dev) ──
				'/google-places': {
					target: 'https://maps.googleapis.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/google-places/, ''),
					secure: true,
					configure: (proxy, _options) => {
						proxy.on('proxyReq', (proxyReq, _req, _res) => {
							// Forcefully overwrite the origin/referer to bypass Google Maps referer restrictions locally
							proxyReq.setHeader('Origin', 'https://try-trippple.up.railway.app')
							proxyReq.setHeader('Referer', 'https://try-trippple.up.railway.app/')
						})
					},
				},
			},
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
			},
		},
	}
})