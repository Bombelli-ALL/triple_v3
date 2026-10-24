import { useAuthStore } from '@/stores/authStore'
import type { NavigateFunction } from 'react-router-dom'

export default function RoleBasedNavigation(navigate: NavigateFunction) {
	const { user } = useAuthStore.getState()
	if (!!user) {
		switch (user.role) {
			case 'ADMIN':
				navigate('/admin/dashboard')
				break
			case 'TRAVELER':
				navigate('/user/dashboard')
				break
			case 'GUIDE':
				navigate('/user/dashboard')
				break
		}
	}
}
