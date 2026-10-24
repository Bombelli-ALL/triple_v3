import PremiumGate from '@/components/wrappers/PremiumGate'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout, UserLayout, Layout } from '@/components/layouts'
import { ApiInterceptors, RefreshWrapper, UnauthWrapper, RoleWrapper, AuthWrapper } from '@/components/wrappers'
import { Login, Register } from '@/pages/auth'
import { AdminAnalytics, AdminDashboard, AdminSettings, AdminTrips, AdminUsers, AdminReferrals } from '@/pages/admin'
import { UserDashboard, UserMaps, UserTrips, UserGroups, UserAI, UserMatch, UserSettings, UserTripPlan, UserLeaderboard, UserSpots, UserView360 } from '@/pages/user'
import UserHistory from '@/pages/user/triphistory'
import GroupChatPage from '@/pages/user/GroupChat'
import { TripPlanner, Itineraries, TravelGuides } from '@/pages/planning'
import { BeachEvents, FestivalGuide, RooftopParties } from '@/pages/summer-parties'
import Home from '@/pages/Home'
import Pricing from '@/pages/Pricing'
import FAQs from '@/pages/FAQs'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsOfService from '@/pages/TermsOfService'
import NotFound from '@/pages/NotFound'
import Maps from '@/pages/Maps'
import RuntimeTranslationBridge from '@/components/RuntimeTranslationBridge'

export default function AppContent() {
	return (
		<BrowserRouter>
			<RuntimeTranslationBridge />
			<Routes>
				<Route element={<RefreshWrapper />}>
					<Route element={<Layout />}>
						<Route index element={<Home />} />
						<Route path='pricing' element={<Pricing />} />
						<Route path='faqs' element={<FAQs />} />
						<Route path='privacy-policy' element={<PrivacyPolicy />} />
						<Route path='terms-of-service' element={<TermsOfService />} />

						{/* Planning */}
						<Route path='planning/trip-planner' element={<TripPlanner />} />
						<Route path='planning/itineraries' element={<Itineraries />} />
						<Route path='planning/travel-guides' element={<TravelGuides />} />

						{/* Summer Parties */}
						<Route path='summer-parties/beach-events' element={<BeachEvents />} />
						<Route path='summer-parties/festival-guide' element={<FestivalGuide />} />
						<Route path='summer-parties/rooftop-parties' element={<RooftopParties />} />
					</Route>
					<Route path='maps' element={<Maps />} />

					<Route element={<ApiInterceptors />}>
						<Route element={<AuthWrapper />}>
							<Route element={<RoleWrapper role='ADMIN' />}>
								<Route element={<AdminLayout />}>
									<Route path='admin/dashboard' element={<AdminDashboard />} />
									<Route path='admin/users' element={<AdminUsers />} />
									<Route path='admin/referrals' element={<AdminReferrals />} />
									<Route path='admin/trips' element={<AdminTrips />} />
									<Route path='admin/analytics' element={<AdminAnalytics />} />
									<Route path='admin/settings' element={<AdminSettings />} />
								</Route>
							</Route>

							<Route element={<RoleWrapper role='TRAVELER' />}>
								<Route element={<UserLayout />}>
									<Route path='user/dashboard' element={<UserDashboard />} />
									<Route path='user/maps' element={<UserMaps />} />
									<Route path='user/match' element={<UserMatch />} />
									<Route path='user/trip-plan' element={<UserTripPlan />} />
									<Route path='user/settings' element={<UserSettings />} />
									<Route path='user/history' element={<UserHistory />} />
									<Route path='user/spots' element={<UserSpots />} />
									{/* Premium-only pages */}
									<Route element={<PremiumGate />}>
										<Route path='user/trips' element={<UserTrips />} />
										<Route path='user/groups' element={<UserGroups />} />
										<Route path='user/groups/:id/chat' element={<GroupChatPage />} />
										<Route path='user/ai' element={<UserAI />} />
										<Route path='user/leaderboard' element={<UserLeaderboard />} />
										<Route path='user/view-360' element={<UserView360 />} />
									</Route>
								</Route>
							</Route>
						</Route>
					</Route>

					<Route element={<UnauthWrapper />}>
						<Route path='login' element={<Login />} />
						<Route path='register' element={<Register />} />
					</Route>
				</Route>

				<Route path='*' element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	)
}
