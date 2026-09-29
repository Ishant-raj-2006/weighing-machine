import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Settings, FileText, Database, Shield, Microscope, Clock, Building, History } from 'lucide-react'
import api from '../api'

const ROLES = ['admin', 'lab_manager', 'testing_officer', 'reviewer']
const ROLE_LABELS = {
  admin: 'Administrator', lab_manager: 'Lab Manager',
  testing_officer: 'Testing Officer', reviewer: 'Reviewer',
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row -m-6">
      {/* Sidebar for Admin Navigation */}
      <div className="w-full lg:w-64 border-r border-line bg-canvas p-4 flex flex-col gap-2">
        <div className="mb-4 px-2">
          <h2 className="font-display text-lg font-bold text-ink">Admin Dashboard</h2>
          <p className="text-xs text-steel">System management</p>
        </div>
        
        <NavButton icon={Users} label="User Management" tab="users" active={activeTab} onClick={setActiveTab} />
        <NavButton icon={Building} label="Laboratory Details" tab="lab" active={activeTab} onClick={setActiveTab} />
        <NavButton icon={Settings} label="System Settings" tab="settings" active={activeTab} onClick={setActiveTab} />
        <NavButton icon={Shield} label="OIML Rules & Configs" tab="oiml" active={activeTab} onClick={setActiveTab} />
        
        <div className="mt-4 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-mist">Data & Logs</div>
        
        <NavButton icon={Microscope} label="All Instruments" tab="instruments" active={activeTab} onClick={setActiveTab} />
        <NavButton icon={FileText} label="Test Reports" tab="reports" active={activeTab} onClick={setActiveTab} />
        <NavButton icon={History} label="Report History" tab="history" active={activeTab} onClick={setActiveTab} />
        <NavButton icon={Database} label="Audit Logs" tab="logs" active={activeTab} onClick={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-white p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'lab' && <PlaceholderPanel title="Laboratory Details" icon={Building} desc="Manage laboratory name, location, contact, and certifications." />}
            {activeTab === 'settings' && <PlaceholderPanel title="System-Level Settings" icon={Settings} desc="Global system configurations, email SMTP, and integrations." />}
            {activeTab === 'oiml' && <PlaceholderPanel title="OIML R-76 Rules & Configurations" icon={Shield} desc="Manage active versions of OIML rules, permissible error formulas, and evaluation constants." />}
            {activeTab === 'instruments' && <PlaceholderPanel title="All Instruments Database" icon={Microscope} desc="Master list of all registered weighing instruments across the laboratory." />}
            {activeTab === 'reports' && <PlaceholderPanel title="All Test Reports" icon={FileText} desc="Central repository of all generated and drafted test reports." />}
            {activeTab === 'history' && <PlaceholderPanel title="Complete Report History" icon={History} desc="Version history and change logs for all finalized reports." />}
            {activeTab === 'logs' && <PlaceholderPanel title="Audit Logs" icon={Database} desc="System-wide security and action audit trail." />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function NavButton({ icon: Icon, label, tab, active, onClick }) {
  const isActive = active === tab
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        isActive ? 'bg-ink text-white shadow-md' : 'text-steel hover:bg-canvas/80 hover:text-ink'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-brass' : 'text-mist'} />
      {label}
    </button>
  )
}

function PlaceholderPanel({ title, icon: Icon, desc }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-canvas p-6 text-mist shadow-inner">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-steel">{desc}</p>
      <button className="btn-outline mt-6">Configure Module</button>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'testing_officer' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  async function load() {
    const res = await api.get('/auth/users')
    setUsers(res.data)
  }
  
  async function deleteUser(userId) {
    if(!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/auth/${userId}`)
      load()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete')
    }
  }
  
  useEffect(() => { load() }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleEdit(u) {
    setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role, id: u.id })
    setEditMode(true)
  }

  function cancelEdit() {
    setForm({ username: '', password: '', full_name: '', role: 'testing_officer' })
    setEditMode(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      if (editMode) {
        // Assume PUT /auth/users/:id exists or handle it gracefully if it doesn't
        alert("User update functionality (API) needs to be implemented. Creating new user logic for now.");
      } else {
        await api.post('/auth/users', form)
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">User Management</h1>
        <p className="text-sm text-steel">Create, update, and manage role assignments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel col-span-1 lg:col-span-2 overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="group">
                  <td className="font-medium text-ink">{u.full_name}</td>
                  <td className="data-num text-steel">{u.username}</td>
                  <td><span className="badge-neutral">{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td>{u.is_active ? <span className="badge-pass">Active</span> : <span className="badge-fail">Disabled</span>}</td>
                  <td className="text-right space-x-2">
                    <button onClick={() => handleEdit(u)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Edit</button>
                    <button onClick={() => deleteUser(u.id)} className="text-xs font-semibold text-fail hover:text-red-700 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit} className="panel h-fit p-5 sticky top-6 shadow-lg border border-line">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel">{editMode ? 'Update User' : 'Add New User'}</h2>
          <div className="space-y-3.5">
            <div>
              <label className="field-label">Full Name</label>
              <input required className="input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Username</label>
              <input required disabled={editMode} className="input disabled:bg-canvas disabled:text-mist" value={form.username} onChange={(e) => update('username', e.target.value)} />
            </div>
            <div>
              <label className="field-label">{editMode ? 'New Password (Optional)' : 'Password'}</label>
              <input required={!editMode} type="password" className="input" value={form.password} onChange={(e) => update('password', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Assign Role</label>
              <select className="select" value={form.role} onChange={(e) => update('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="mt-3 rounded bg-failBg px-3 py-2 text-xs font-medium text-fail">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : editMode ? 'Update User' : 'Create User'}
            </button>
            {editMode && (
              <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
