import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

export default function UserWrapper() {
	const { token, user } = useAuthStore()
	const [ready, setReady] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		if (!token || !user) {
			navigate('/login', { replace: true })
		}
		setReady(true)
	}, [user, token])

	return ready && <Outlet />
}
