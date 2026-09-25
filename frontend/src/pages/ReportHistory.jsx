import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import ResultBadge from '../components/ResultBadge'
import { IconSearch } from '../components/icons'

export default function ReportHistory() {
  const [reports, setReports] = useState([])
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (statusFilter) params.status_filter = statusFilter
      if (resultFilter) params.result_filter = resultFilter
      const res = await api.get('/tests', { params })
      setReports(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e) {
    e.preventDefault()
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Report History</h1>
        <p className="text-sm text-steel">Search and reopen previously generated test reports.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input className="input pl-9" placeholder="Report no., manufacturer, model, serial…"
                 value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="select w-40" value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
          <option value="">All Results</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
        </select>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report No.</th><th>Instrument</th><th>Serial No.</th>
              <th>Test Date</th><th>Status</th><th>Result</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="py-6 text-center text-steel">Loading…</td></tr>}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-steel">No reports found.</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="data-num font-medium text-ink">{r.report_number}</td>
                <td>{r.manufacturer_name} <span className="text-steel">· {r.model_name}</span></td>
                <td className="data-num">{r.serial_number}</td>
                <td className="data-num">{r.test_date}</td>
                <td><span className="badge-neutral">{r.status.replace('_', ' ')}</span></td>
                <td><ResultBadge value={r.overall_result} /></td>
                <td className="text-right">
                  <Link to={`/tests/${r.id}/result`} className="text-sm font-medium text-brass hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
