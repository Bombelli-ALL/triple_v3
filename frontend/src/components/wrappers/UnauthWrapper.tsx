import { useAuthStore } from '@/stores/authStore'
import { Navigate, Outlet } from 'react-router-dom'
import { HERO_POST_LOGIN_ROUTE_KEY, readHeroStorage, removeHeroStorage } from '@/lib/heroGeneratedTrip'

export default function UnauthWrapper() {
	const { user, token } = useAuthStore()
	if (user || token) {
		const pendingHeroRoute = readHeroStorage(HERO_POST_LOGIN_ROUTE_KEY)
		if (pendingHeroRoute) {
			removeHeroStorage(HERO_POST_LOGIN_ROUTE_KEY)
			return <Navigate to={pendingHeroRoute} replace />
		}

		const destination = user?.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
		return <Navigate to={destination} replace />
	}

	return <Outlet />
}
