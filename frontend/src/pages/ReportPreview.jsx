import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import ResultBadge from '../components/ResultBadge'
import { useAuth } from '../context/AuthContext'
import { IconDownload, IconCheck } from '../components/icons'

async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export default function ReportPreview() {
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [remarks, setRemarks] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const load = useCallback(async () => {
    const res = await api.get(`/tests/${id}`)
    setData(res.data)
    setRemarks(res.data.test_report.remarks || '')
  }, [id])

  useEffect(() => { load() }, [load])

  if (!data) return <p className="text-steel">Loading…</p>
  const { test_report: report, instrument, weighing_observations, repeatability_tests, eccentricity_observations } = data
  const unit = instrument.unit
  const fileBase = report.report_number.replace(/\//g, '-')

  async function handleReview() {
    setReviewing(true); setError('')
    try {
      await api.post(`/tests/${id}/review`, null, { params: { remarks } })
      await load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not submit review.')
    } finally {
      setReviewing(false)
    }
  }

  const canReview = ['reviewer', 'admin', 'lab_manager'].includes(user?.role) && report.status === 'completed'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{report.report_number}</h1>
          <p className="text-sm text-steel">
            {instrument.manufacturer_name} · {instrument.model_name} · {instrument.serial_number}
          </p>
        </div>
        <div className="flex gap-2">
          {report.status !== 'completed' && (
            <Link to={`/tests/${id}/observations`} className="btn-outline">Continue Entry</Link>
          )}
          <button onClick={() => downloadFile(`/reports/${id}/pdf`, `${fileBase}.pdf`)} className="btn-outline">
            <IconDownload /> PDF
          </button>
          <button onClick={() => downloadFile(`/reports/${id}/docx`, `${fileBase}.docx`)} className="btn-outline">
            <IconDownload /> Word
          </button>
        </div>
      </div>

      {report.status === 'completed' ? (
        <div className={`panel flex items-center justify-between p-5 ${
          report.overall_result === 'PASS' ? 'bg-passBg' : 'bg-failBg'
        }`}>
          <div className="flex items-center gap-3">
            {report.overall_result === 'PASS' && <IconCheck className={report.overall_result === 'PASS' ? 'text-pass' : 'text-fail'} />}
            <span className={`font-display text-xl font-semibold ${report.overall_result === 'PASS' ? 'text-pass' : 'text-fail'}`}>
              OVERALL RESULT: {report.overall_result}
            </span>
          </div>
          <span className="text-sm text-steel">
            Test Stage: {report.test_stage.replace('_', ' ')}
          </span>
        </div>
      ) : (
        <div className="panel bg-canvas p-5 text-sm text-steel">
          This report is still <strong>{report.status.replace('_', ' ')}</strong> — finalize it from the observations page to see the overall result.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['Laboratory', report.lab_name],
          ['Test Date', report.test_date],
          ['Temperature', report.lab_temperature_c != null ? `${report.lab_temperature_c} °C` : '—'],
          ['Humidity', report.lab_humidity_pct != null ? `${report.lab_humidity_pct} %` : '—'],
        ].map(([label, val]) => (
          <div key={label} className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</div>
            <div className="mt-1 text-sm text-ink">{val}</div>
          </div>
        ))}
      </div>

      {weighing_observations.length > 0 && (
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Accuracy (Weighing) Test</h2>
          <table className="data-table">
            <thead><tr><th>#</th><th>Test Load</th><th>Indication</th><th>Error</th><th>MPE</th><th>m</th><th>Result</th></tr></thead>
            <tbody>
              {weighing_observations.map((w, i) => (
                <tr key={w.id}>
                  <td className="data-num">{i + 1}</td>
                  <td className="data-num">{w.test_load} {unit}</td>
                  <td className="data-num">{w.indicated_value} {unit}</td>
                  <td className="data-num">{w.error > 0 ? '+' : ''}{w.error} {unit}</td>
                  <td className="data-num">± {w.mpe} {unit}</td>
                  <td className="data-num">{w.verification_intervals}</td>
                  <td><ResultBadge value={w.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {repeatability_tests.length > 0 && (
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Repeatability Test</h2>
          <table className="data-table">
            <thead><tr><th>Test Load</th><th>Readings</th><th>Mean</th><th>Range</th><th>MPE</th><th>Result</th></tr></thead>
            <tbody>
              {repeatability_tests.map((r) => (
                <tr key={r.id}>
                  <td className="data-num">{r.test_load} {unit}</td>
                  <td className="data-num">{r.readings.join(', ')}</td>
                  <td className="data-num">{r.mean_value} {unit}</td>
                  <td className="data-num">{r.range_value} {unit}</td>
                  <td className="data-num">± {r.mpe} {unit}</td>
                  <td><ResultBadge value={r.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {eccentricity_observations.length > 0 && (
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Eccentricity (Corner Load) Test</h2>
          <table className="data-table">
            <thead><tr><th>Position</th><th>Test Load</th><th>Indication</th><th>Error</th><th>MPE</th><th>Result</th></tr></thead>
            <tbody>
              {eccentricity_observations.map((e) => (
                <tr key={e.id}>
                  <td>{e.position}</td>
                  <td className="data-num">{e.test_load} {unit}</td>
                  <td className="data-num">{e.indicated_value} {unit}</td>
                  <td className="data-num">{e.error > 0 ? '+' : ''}{e.error} {unit}</td>
                  <td className="data-num">± {e.mpe} {unit}</td>
                  <td><ResultBadge value={e.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canReview && (
        <div className="panel p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Reviewer Remarks</h2>
          <textarea className="input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional remarks for this report" />
          <div className="mt-3 flex items-center justify-between">
            {report.reviewed_by
              ? <span className="text-xs text-pass">Already reviewed — resubmitting will update remarks.</span>
              : <span className="text-xs text-steel">Not yet reviewed.</span>}
            <button onClick={handleReview} disabled={reviewing} className="btn-primary">
              {reviewing ? 'Submitting…' : 'Mark as Reviewed'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="rounded bg-failBg px-3 py-2 text-sm text-fail">{error}</p>}
    </div>
  )
}
