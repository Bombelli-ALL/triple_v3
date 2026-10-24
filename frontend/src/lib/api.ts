import axios from 'axios'

const FALLBACK_HOSTED_API_URL = 'https://trippple-backend-production-1f87.up.railway.app/api'
const LOCAL_API_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/?$/i

export const resolveApiBaseUrl = () => {
	const envBaseURL = import.meta.env.VITE_PUBLIC_API_URL?.trim()

	if (typeof window !== 'undefined') {
		const host = window.location.hostname
		const isLocalFrontend = host === 'localhost' || host === '127.0.0.1'

		if (isLocalFrontend) {
			if (!envBaseURL) {
				return '/api'
			}
		} else if (!envBaseURL || LOCAL_API_PATTERN.test(envBaseURL)) {
			return FALLBACK_HOSTED_API_URL
		}
	}

	return envBaseURL || FALLBACK_HOSTED_API_URL
}

if (!import.meta.env.VITE_PUBLIC_API_URL) throw new Error('VITE_PUBLIC_API_URL is not defined')

const api = axios.create({
	baseURL: resolveApiBaseUrl(),
	withCredentials: true,
})

export default api
