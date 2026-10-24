import RoleBasedNavigation from '@/lib/RoleBasedNavigation'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

export default function RoleWrapper({ role }: { role: 'ADMIN' | 'TRAVELER' | 'GUIDE' }) {
	const { user, token } = useAuthStore()
	const [ready, setReady] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		if (user?.role !== role) {
			RoleBasedNavigation(navigate)
		}
		setReady(true)
	}, [user, token])

	return ready && <Outlet />
}
