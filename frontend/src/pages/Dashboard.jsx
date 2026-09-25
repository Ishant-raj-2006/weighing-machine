import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api'

function StatCard({ label, value, accent }) {
  return (
    <div className="panel p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</div>
      <div className={`data-num mt-2 text-3xl font-semibold ${accent || 'text-ink'}`}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load dashboard statistics.'))
  }, [])

  if (error) return <p className="text-fail">{error}</p>
  if (!stats) return <p className="text-steel">Loading dashboard…</p>

  const passFailData = [
    { name: 'PASS', value: stats.pass_count, fill: '#1F7A4D' },
    { name: 'FAIL', value: stats.fail_count, fill: '#B23A34' },
  ]
  const monthlyData = stats.reports_per_month.map((m) => ({ month: m.month.slice(5), count: m.count }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-steel">Overview of instruments, tests and compliance outcomes.</p>
        </div>
        <Link to="/tests/new" className="btn-brass">+ New Test</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Instruments" value={stats.total_instruments} />
        <StatCard label="Total Reports" value={stats.total_reports} />
        <StatCard label="Completed" value={stats.completed_reports} />
        <StatCard label="Pending" value={stats.pending_reports} accent="text-brass" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Pass vs Fail</h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-pass"><span className="h-2 w-2 rounded-full bg-pass" /> {stats.pass_count} Pass</span>
              <span className="flex items-center gap-1 text-fail"><span className="h-2 w-2 rounded-full bg-fail" /> {stats.fail_count} Fail</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={passFailData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8DCE2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4A5568' }} axisLine={{ stroke: '#D8DCE2' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4A5568' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F5F6F4' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={60}>
                {passFailData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-5">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Tests per Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8DCE2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#4A5568' }} axisLine={{ stroke: '#D8DCE2' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4A5568' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F5F6F4' }} />
              <Bar dataKey="count" fill="#14213D" radius={[3, 3, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
