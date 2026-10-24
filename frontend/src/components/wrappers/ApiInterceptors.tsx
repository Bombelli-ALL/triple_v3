import api, { resolveApiBaseUrl } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'
import { useLayoutEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

export default function ApiInterceptors() {
	const { logout, setUser, setToken } = useAuthStore()
	const [ready, setReady] = useState<boolean>(false)

	useLayoutEffect(() => {
		const requestInterceptor = api.interceptors.request.use((config) => {
			const token = useAuthStore.getState().token
			if (token) {
				config.headers['Authorization'] = `Bearer ${token}`
			}
			return config
		})

		const responseInterceptor = api.interceptors.response.use(
			(response) => response,
			async (error) => {
				const originalRequest = error.config

				if (error.response?.status === 401 && !originalRequest._retry) {
					originalRequest._retry = true

					try {
						const response = await axios.post(resolveApiBaseUrl()+"/refresh", {}, { withCredentials: true })

						const { token: newToken, user: newUser } = response.data

						setToken(newToken)
						setUser(newUser)

						originalRequest.headers['Authorization'] = `Bearer ${newToken}`

						return api(originalRequest)
					} catch (refreshError) {
						logout()
						return Promise.reject(refreshError)
					}
				}

				return Promise.reject(error)
			},
		)

		setReady(true)

		return () => {
			api.interceptors.request.eject(requestInterceptor)
			api.interceptors.response.eject(responseInterceptor)
		}
	}, [])

	return ready && <Outlet />
}
