import { useAuthStore } from '@/stores/authStore'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '@/components/layouts/Navbar'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

interface LoginData {
	email: string
	password: string
}

export default function Login() {
	const { login, googleLogin } = useAuthStore()
	const navigate = useNavigate()

	const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' })
	const [errors, setErrors] = useState({ email: '', password: '' })
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	async function formLogin(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (loading) return

		const newErrors = { email: '', password: '' }
		let hasError = false

		if (!loginData.email.trim()) {
			newErrors.email = 'Email is required'
			hasError = true
		}
		if (!loginData.password) {
			newErrors.password = 'Password is required'
			hasError = true
		}

		setErrors(newErrors)
		if (hasError) return

		try {
			setLoading(true)
			await login(loginData)
		} catch (error: any) {
			console.error('Login failed:', error)
			if (axios.isAxiosError(error)) {
				const status = error.response?.status
				const data = error.response?.data
				const msg = data?.message || data

				if (msg?.email) {
					setErrors((prev) => ({ ...prev, email: msg.email === 'email_not_found' ? 'Email not found.' : msg.email }))
				} else if (msg?.password) {
					setErrors((prev) => ({ ...prev, password: msg.password === 'wrong_password' ? 'Incorrect password.' : msg.password }))
				} else if (status === 404) {
					setErrors((prev) => ({ ...prev, email: 'Email not found.' }))
				} else if (status === 401) {
					setErrors((prev) => ({ ...prev, password: 'Incorrect password.' }))
				} else {
					setErrors((prev) => ({ ...prev, email: 'An error occurred during login. Please try again.' }))
				}
			} else {
				setErrors((prev) => ({ ...prev, email: 'Network error. Please try again.' }))
			}
		} finally {
			setLoading(false)
		}
	}



	return (
		<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
			<div className='min-h-screen bg-white'>
				<Navbar />
				<main className='flex items-center justify-center w-full min-h-screen px-4 bg-white pt-16 flex-col'>
					<form className='flex w-full flex-col max-w-96' onSubmit={formLogin}>
						<Link to='/' className='flex items-center gap-2 mb-8 group' title='Go to Home'>
							<span className='text-orange-500 transition-transform duration-200 group-hover:scale-110'>
								<svg width='32' height='32' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
									<path d='M3 12L21 4L17 12L21 20L3 12Z' />
								</svg>
							</span>
							<span className='text-2xl font-bold text-gray-900 tracking-tight'>Trippple</span>
						</Link>

						<h2 className='text-4xl font-medium text-gray-900'>Sign in</h2>

						<p className='mt-4 text-base text-gray-500/90'>Please enter email and password to access.</p>

						<div className='mt-10'>
							<label className='font-medium text-gray-900'>Email</label>
							<input placeholder='Please enter your email' className={`mt-2 rounded-md ring text-base text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${errors.email ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`} type='email' name='email' value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
							{errors.email && <p className='mt-1 text-xs font-medium text-red-500'>{errors.email}</p>}
						</div>

						<div className='mt-6'>
							<label className='font-medium text-gray-900'>Password</label>
							<div className='relative'>
								<input placeholder='Please enter your password' className={`mt-2 rounded-md ring text-base text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${errors.password ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`} type={showPassword ? 'text' : 'password'} name='password' value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
								<button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-[60%] -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
							{errors.password && <p className='mt-1 text-xs font-medium text-red-500'>{errors.password}</p>}
						</div>

						<div className='flex justify-center items-center mt-8'>
							<GoogleLogin onSuccess={googleLogin} />
						</div>

						<button type='submit' disabled={loading} className='mt-8 py-3 w-full flex justify-center items-center gap-2 cursor-pointer rounded-md bg-orange-500 text-white font-semibold transition hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]'>
							{loading ? <Loader2 className='animate-spin size-5' /> : 'Login'}
						</button>
						<p className='text-center text-gray-600 py-8'>
							Don't have an account?{' '}
							<button type='button' onClick={() => navigate('/register')} className='text-orange-500 font-medium hover:underline'>
								Sign up
							</button>
						</p>
					</form>
				</main>
			</div>
		</GoogleOAuthProvider>
	)
}
