import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconScale } from '../components/icons'

const DEMO_LOGINS = [
  { role: 'Admin', username: 'admin', password: 'admin123' },
  { role: 'Lab Manager', username: 'labmanager', password: 'lab123' },
  { role: 'Testing Officer', username: 'tester', password: 'test123' },
  { role: 'Reviewer', username: 'reviewer', password: 'review123' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(u, p) {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded bg-white shadow-xl md:grid md:grid-cols-5">
        <div className="col-span-2 flex flex-col justify-between bg-ink p-8 text-white">
          <div>
            <div className="mb-6 flex items-center gap-2 text-brassLight">
              <IconScale />
              <span className="font-display text-lg font-semibold">NAWI Reports</span>
            </div>
            <h1 className="font-display text-2xl font-semibold leading-snug">
              Test report generation for Non-Automatic Weighing Instruments
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Digitizes OIML R-76 type-evaluation: observations in, permissible-error
              calculations and PASS/FAIL determination out, standardized PDF &amp; Word
              reports on demand.
            </p>
          </div>
          <div className="mt-10 text-xs text-white/40">
            Smart India Hackathon 2026 &middot; PS 26035
            <br />
            Department of Consumer Affairs
          </div>
        </div>

        <div className="col-span-3 p-8 md:p-10">
          <h2 className="font-display text-xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-steel">Enter your laboratory credentials to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="field-label">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded bg-failBg px-3 py-2 text-sm text-fail">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_LOGINS.map((d) => (
                <button
                  key={d.username}
                  onClick={() => fillDemo(d.username, d.password)}
                  className="rounded border border-line px-3 py-2 text-left text-xs hover:border-ink"
                  type="button"
                >
                  <div className="font-medium text-ink">{d.role}</div>
                  <div className="data-num text-steel">{d.username} / {d.password}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
