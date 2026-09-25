import { useEffect, useState } from 'react'
import api from '../api'

const ROLES = ['admin', 'lab_manager', 'testing_officer', 'reviewer']
const ROLE_LABELS = {
  admin: 'Administrator', lab_manager: 'Lab Manager',
  testing_officer: 'Testing Officer', reviewer: 'Reviewer',
}

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'testing_officer' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await api.get('/auth/users')
    setUsers(res.data)
  }
  useEffect(() => { load() }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      await api.post('/auth/users', form)
      setForm({ username: '', password: '', full_name: '', role: 'testing_officer' })
      await load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Admin Panel</h1>
        <p className="text-sm text-steel">Manage laboratory users and their role-based permissions.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="panel col-span-2 overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Full Name</th><th>Username</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td className="data-num">{u.username}</td>
                  <td><span className="badge-neutral">{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td>{u.is_active ? <span className="badge-pass">Active</span> : <span className="badge-fail">Disabled</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit} className="panel h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel">Add User</h2>
          <div className="space-y-3">
            <div>
              <label className="field-label">Full Name</label>
              <input required className="input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Username</label>
              <input required className="input" value={form.username} onChange={(e) => update('username', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input required type="password" className="input" value={form.password} onChange={(e) => update('password', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Role</label>
              <select className="select" value={form.role} onChange={(e) => update('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="mt-3 rounded bg-failBg px-3 py-2 text-xs text-fail">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary mt-4 w-full">
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}
