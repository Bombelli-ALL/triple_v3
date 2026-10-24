import { useAuthStore } from '@/stores/authStore'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import Navbar from '@/components/layouts/Navbar'
import { apiErrorMessage } from '@/lib/plan'

interface RegisterData {
    name: string
    email: string
    password: string
    confirmPassword: string
}

export default function Register() {
    const { register } = useAuthStore()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const inviteFromLink = searchParams.get('ref')?.trim() ?? ''
    const [referralCode, setReferralCode] = useState(inviteFromLink)
    const [showCode, setShowCode] = useState(Boolean(inviteFromLink))
    const [codeError, setCodeError] = useState('')

    const [registerData, setRegisterData] = useState<RegisterData>({ name: '', email: '', password: '', confirmPassword: '' })
    const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    async function formRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (loading) return

        const newErrors = { name: '', email: '', password: '', confirmPassword: '' }
        let hasError = false

        if (!registerData.name.trim()) {
            newErrors.name = "Name is required"
            hasError = true
        }
        if (!registerData.email.trim()) {
            newErrors.email = "Email is required"
            hasError = true
        }
        if (!registerData.password) {
            newErrors.password = "Password is required"
            hasError = true
        } else if (registerData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
            hasError = true
        }

        if (!registerData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password"
            hasError = true
        } else if (registerData.password !== registerData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
            hasError = true
        }

        setErrors(newErrors)
        setCodeError('')
        if (hasError) return

        try {
            setLoading(true)
            await register({
                name: registerData.name,
                email: registerData.email,
                password: registerData.password,
                ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
            })
            navigate('/login') // Redirect to login after successful registration
        } catch (error: any) {
            console.error('Registration failed:', error)
            if (axios.isAxiosError(error)) {
                const status = error.response?.status
                const data = error.response?.data
                const msg = data?.message || data
                if (referralCode.trim() && status === 400 && typeof msg === 'string' && /code/i.test(msg)) {
                    setShowCode(true)
                    setCodeError(apiErrorMessage(error, 'This code is not valid.'))
                } else if (typeof msg === 'string' && msg.includes('email is already registered')) {
                    setErrors(prev => ({ ...prev, email: 'Email is already registered. Please login.' }))
                } else if (status === 409) {
                    setErrors(prev => ({ ...prev, email: 'Email is already registered. Please login.' }))
                } else {
                    setErrors(prev => ({ ...prev, email: 'Registration failed. Please try again.' }))
                }
            } else {
                setErrors(prev => ({ ...prev, email: 'Network error. Please try again.' }))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="flex items-center justify-center w-full min-h-screen px-4 bg-white pt-16">
                <form className="flex w-full flex-col max-w-96" onSubmit={formRegister}>
                    <Link to="/" className="flex items-center gap-2 mb-8 group" title="Go to Home">
                        <span className="text-orange-500 transition-transform duration-200 group-hover:scale-110">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M3 12L21 4L17 12L21 20L3 12Z" />
                            </svg>
                        </span>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">
                            Trippple
                        </span>
                    </Link>

                    <h2 className="text-4xl font-medium text-gray-900">Create an account</h2>

                    <p className="mt-4 text-base text-gray-500/90">
                        Please enter your details to register.
                    </p>

                    <div className="mt-10">
                        <label className="font-medium text-gray-900">Name</label>
                        <input
                            placeholder="Please enter your name"
                            className={`mt-2 rounded-md ring text-base text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${errors.name ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`}
                            type="text"
                            name="name"
                            value={registerData.name}
                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <label className="font-medium text-gray-900">Email</label>
                        <input
                            placeholder="Please enter your email"
                            className={`mt-2 rounded-md ring text-base text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${errors.email ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`}
                            type="email"
                            name="email"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs font-medium text-red-500">{errors.email}</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <label className="font-medium text-gray-900">Password</label>
                        <div className="relative">
                            <input
                                placeholder="Please enter your password"
                                className={`mt-2 rounded-md ring text-base text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${errors.password ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`}
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[60%] -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs font-medium text-red-500">{errors.password}</p>
                        )}
                    </div>

                    <div className="mt-6">
                        <label className="font-medium text-gray-900">Confirm Password</label>
                        <div className="relative">
                            <input
                                placeholder="Please confirm your password"
                                className={`mt-2 rounded-md ring text-base text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${errors.confirmPassword ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`}
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={registerData.confirmPassword}
                                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[60%] -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <div className="mt-6">
                        {showCode ? (
                            <>
                                <label className="font-medium text-gray-900">Invite code</label>
                                <input
                                    placeholder="TRIP-XXXX-XXXX"
                                    className={`mt-2 rounded-md ring text-base uppercase tracking-wider text-gray-900 focus:ring-2 outline-none px-3 py-3 w-full bg-white ${codeError ? 'ring-red-500 focus:ring-red-600' : 'ring-gray-200 focus:ring-orange-500'}`}
                                    type="text"
                                    name="referralCode"
                                    autoComplete="off"
                                    value={referralCode}
                                    onChange={(e) => { setReferralCode(e.target.value); setCodeError('') }}
                                />
                                {codeError ? (
                                    <p className="mt-1 text-xs font-medium text-red-500">{codeError}</p>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-500">A valid code gives you 1 month of Premium.</p>
                                )}
                            </>
                        ) : (
                            <button type="button" onClick={() => setShowCode(true)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                Have an invite code?
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-8 py-3 w-full flex justify-center items-center gap-2 cursor-pointer rounded-md bg-orange-500 text-white font-semibold transition hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin size-5" /> : 'Sign up'}
                    </button>
                    <p className='text-center text-gray-600 py-8'>
                        Already have an account?{' '}
                        <button type="button" onClick={() => navigate('/login')} className="text-orange-500 font-medium hover:underline">
                            Sign in
                        </button>
                    </p>
                </form>
            </main>
        </div>
    )
}
