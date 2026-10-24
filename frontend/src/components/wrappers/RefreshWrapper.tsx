import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

export default function RefreshWrapper() {
	const { refresh } = useAuthStore()
	const [ready, setReady] = useState(false)

	useEffect(() => {
		(async () => {
			await refresh()
			setReady(true)
		})()
	}, [])

	return ready && <Outlet />
}
