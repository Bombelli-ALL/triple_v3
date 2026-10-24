import { create } from 'zustand'
import axios from 'axios'
import type { CredentialResponse } from '@react-oauth/google'
import { resolveApiBaseUrl } from '@/lib/api'
import { clearHeroSession } from '@/lib/heroGeneratedTrip'

const authHttp = axios.create({
	baseURL: resolveApiBaseUrl(),
	withCredentials: true,
})

interface LoginData {
	email: string
	password: string
}

interface RegisterData {
	name: string
	email: string
	password: string
	referralCode?: string
}

interface User {
	id: string
	name: string
	email: string
	role: 'ADMIN' | 'TRAVELER' | 'GUIDE'
	preferences?: string | null
	plan?: 'FREE' | 'PREMIUM'
	premiumUntil?: string | null
}

interface AuthStoreInterface {
	user: User | null
	token: string | null
	setUser: (user: User) => void
	setToken: (token: string) => void
	register: (data: RegisterData) => Promise<void>
	login: (data: LoginData) => Promise<void>
	googleLogin: (credentialResponse: CredentialResponse) => Promise<void>
	refresh: () => Promise<void>
	logout: () => Promise<void>
}
export const useAuthStore = create<AuthStoreInterface>()((set) => ({
	user: null,
	token: null,
	setUser: (user) => {
		set({ user })
	},
	setToken: (token) => {
		set({ token })
	},
	register: async (data) => {
		await authHttp.post('/register', data)
	},
	login: async (data) => {
		const res = await authHttp.post<{ user: User; token: string }>('/login', data)
		set({ token: res.data.token, user: res.data.user })
	},
	googleLogin: async (credentialResponse: CredentialResponse) => {
		const res = await authHttp.post<{ user: any; token: string }>('/auth/google', { token: credentialResponse.credential }, { withCredentials: true })
		set({ token: res.data.token, user: res.data.user })
	},
	refresh: async () => {
		try {
			const res = await authHttp.post<{ user: User; token: string }>('/refresh', {})
			set({ token: res.data.token, user: res.data.user })
		} catch {
			set({ token: null, user: null })
		}
	},
	logout: async () => {
		try {
			await authHttp.post('/logout', {})
		} catch {
		} finally {
			clearHeroSession()
			set({ user: null, token: null })
		}
	},
}))
