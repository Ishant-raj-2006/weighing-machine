import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Scale, Loader2 } from 'lucide-react'
import loginBg from '../assets/Login.jpg'

const loginSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: '', username: '', password: '' }
  })

  async function onSubmit(data) {
    try {
      await login(data.username, data.password, data.role)
      toast.success('Successfully logged in!')
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="flex min-h-screen bg-canvas font-body text-ink selection:bg-brass selection:text-white">
      {/* LEFT PANEL: Animated & Dynamic */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-ink/70" />
        {/* Subtle colour accents on top of photo */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brass opacity-10 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600 opacity-10 blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3 text-brassLight">
          <Scale size={32} strokeWidth={2.5} />
          <span className="font-display text-2xl font-bold tracking-tight text-white">NAWI Reports</span>
        </div>

        <div className="relative z-10 mt-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="font-display text-5xl font-bold leading-[1.1] text-white">
              Precision in every <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brassLight to-brass">test report.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/70 leading-relaxed">
              Digitizing OIML R-76 type-evaluation with automated permissible-error calculations, ensuring compliance and speed.
            </p>
          </motion.div>
        </div>

        {/* Floating Abstract Element */}
        <motion.div
          className="absolute right-10 top-1/3 flex h-48 w-48 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Scale size={64} className="text-white/40" />
        </motion.div>

        <div className="relative z-10 mt-20 flex items-center gap-4 text-sm font-medium text-white/40">
          <span>SIH 2026 &middot; PS 26035</span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span>Dept. of Consumer Affairs</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          {/* Mobile Logo */}
          <div className="mb-10 flex items-center gap-2 text-ink lg:hidden">
            <Scale size={28} className="text-brass" />
            <span className="font-display text-xl font-bold">NAWI Reports</span>
          </div>

          <div className="mb-10">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-2 text-steel">Enter your laboratory credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-steel">Role</label>
              <div className="relative">
                <select
                  {...register('role')}
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-ink transition-all focus:outline-none focus:ring-2 focus:ring-ink/20 ${errors.role ? 'border-fail focus:border-fail' : 'border-line focus:border-ink'}`}
                >
                  <option value="">Select your role</option>
                  <option value="admin">Administrator</option>
                  <option value="lab_manager">Lab Manager</option>
                  <option value="testing_officer">Testing Officer</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
              {errors.role && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-sm font-medium text-fail">
                  {errors.role.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-steel">Username</label>
              <div className="relative">
                <input
                  {...register('username')}
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-ink transition-all placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-ink/20 ${errors.username ? 'border-fail focus:border-fail' : 'border-line focus:border-ink'}`}
                  placeholder="admin"
                  autoFocus
                />
              </div>
              {errors.username && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-sm font-medium text-fail">
                  {errors.username.message}
                </motion.p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-steel">Password</label>
                <a href="#" className="text-xs font-semibold text-brass hover:text-brassLight transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full rounded-lg border bg-white px-4 py-3 pr-12 text-ink transition-all placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-ink/20 ${errors.password ? 'border-fail focus:border-fail' : 'border-line focus:border-ink'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-sm font-medium text-fail">
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-line text-ink focus:ring-ink" />
              <label htmlFor="remember" className="text-sm font-medium text-steel cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ink/90 hover:shadow-lg hover:shadow-ink/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  )
}
