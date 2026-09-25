import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import ResultBadge from '../components/ResultBadge'
import { IconPlus, IconTrash, IconChevronRight } from '../components/icons'

const TABS = [
  { key: 'weighing', label: '1. Accuracy (Weighing) Test' },
  { key: 'repeatability', label: '2. Repeatability Test' },
  { key: 'eccentricity', label: '3. Eccentricity Test' },
]
const POSITIONS = ['Center', 'Front-Left', 'Front-Right', 'Rear-Left', 'Rear-Right']

export default function TestObservations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('weighing')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [weighingRows, setWeighingRows] = useState([])
  const [repRows, setRepRows] = useState([])
  const [eccRows, setEccRows] = useState([])

  const load = useCallback(async () => {
    const res = await api.get(`/tests/${id}`)
    setData(res.data)
    setWeighingRows(res.data.weighing_observations.length
      ? res.data.weighing_observations.map((w) => ({ ...w }))
      : [])
    setRepRows(res.data.repeatability_tests.length
      ? res.data.repeatability_tests.map((r) => ({ ...r, readingsText: r.readings.join(', ') }))
      : [])
    setEccRows(res.data.eccentricity_observations.length
      ? res.data.eccentricity_observations.map((e) => ({ ...e }))
      : [])
  }, [id])

  useEffect(() => { load() }, [load])

  if (!data) return <p className="text-steel">Loading…</p>
  const { instrument, test_report } = data

  // ---- Weighing ----
  function addWeighingRow() {
    setWeighingRows((rows) => [...rows, { test_load: '', indicated_value: '' }])
  }
  function suggestWeighingRows() {
    const max = instrument.max_capacity, min = instrument.min_capacity
    const points = [min, max * 0.25, max * 0.5, max * 0.75, max].map((v) => Math.round(v / instrument.e_value) * instrument.e_value)
    setWeighingRows(points.map((p) => ({ test_load: p, indicated_value: p })))
  }
  function updateWeighingRow(i, field, value) {
    setWeighingRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  function removeWeighingRow(i) {
    setWeighingRows((rows) => rows.filter((_, idx) => idx !== i))
  }
  async function saveWeighing() {
    setError(''); setNotice('')
    try {
      const observations = weighingRows.map((r) => ({ test_load: Number(r.test_load), indicated_value: Number(r.indicated_value) }))
      const res = await api.post(`/tests/${id}/weighing`, { observations })
      setWeighingRows(res.data)
      setNotice('Accuracy test observations saved and calculated.')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save observations.')
    }
  }

  // ---- Repeatability ----
  function addRepRow() {
    setRepRows((rows) => [...rows, { test_load: '', readingsText: '' }])
  }
  function updateRepRow(i, field, value) {
    setRepRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  function removeRepRow(i) {
    setRepRows((rows) => rows.filter((_, idx) => idx !== i))
  }
  async function saveRepeatability() {
    setError(''); setNotice('')
    try {
      const tests = repRows.map((r) => ({
        test_load: Number(r.test_load),
        readings: r.readingsText.split(',').map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v)),
      }))
      const res = await api.post(`/tests/${id}/repeatability`, { tests })
      setRepRows(res.data.map((r) => ({ ...r, readingsText: r.readings.join(', ') })))
      setNotice('Repeatability test saved and calculated.')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save repeatability test.')
    }
  }

  // ---- Eccentricity ----
  function addEccRow() {
    const used = eccRows.map((r) => r.position)
    const next = POSITIONS.find((p) => !used.includes(p)) || POSITIONS[0]
    setEccRows((rows) => [...rows, { position: next, test_load: '', indicated_value: '' }])
  }
  function suggestEccRows() {
    const load = Math.round((instrument.max_capacity / 3) / instrument.e_value) * instrument.e_value
    setEccRows(POSITIONS.map((p) => ({ position: p, test_load: load, indicated_value: load })))
  }
  function updateEccRow(i, field, value) {
    setEccRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  function removeEccRow(i) {
    setEccRows((rows) => rows.filter((_, idx) => idx !== i))
  }
  async function saveEccentricity() {
    setError(''); setNotice('')
    try {
      const observations = eccRows.map((r) => ({
        position: r.position, test_load: Number(r.test_load), indicated_value: Number(r.indicated_value),
      }))
      const res = await api.post(`/tests/${id}/eccentricity`, { observations })
      setEccRows(res.data)
      setNotice('Eccentricity test saved and calculated.')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save eccentricity test.')
    }
  }

  async function handleFinalize() {
    setError('')
    try {
      await api.post(`/tests/${id}/finalize`)
      navigate(`/tests/${id}/result`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not finalize this test.')
    }
  }

  const unit = instrument.unit

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{test_report.report_number}</h1>
          <p className="text-sm text-steel">
            {instrument.manufacturer_name} · {instrument.model_name} · {instrument.serial_number}
            {' '}&middot; Class {instrument.accuracy_class} &middot; e = {instrument.e_value} {unit}
          </p>
        </div>
        <Link to={`/tests/${id}/result`} className="btn-outline">
          View Result <IconChevronRight />
        </Link>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'border-brass text-ink' : 'border-transparent text-steel hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded bg-failBg px-3 py-2 text-sm text-fail">{error}</p>}
      {notice && <p className="rounded bg-passBg px-3 py-2 text-sm text-pass">{notice}</p>}

      {tab === 'weighing' && (
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-steel">Apply known test loads across the instrument's range and record the indication.</p>
            <button onClick={suggestWeighingRows} className="btn-outline">Suggest Test Points</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Test Load ({unit})</th><th>Indication ({unit})</th>
                <th>Error</th><th>MPE</th><th>m = load/e</th><th>Result</th><th></th>
              </tr>
            </thead>
            <tbody>
              {weighingRows.map((r, i) => (
                <tr key={i}>
                  <td className="data-num">{i + 1}</td>
                  <td><input type="number" step="any" className="input data-num" value={r.test_load}
                             onChange={(e) => updateWeighingRow(i, 'test_load', e.target.value)} /></td>
                  <td><input type="number" step="any" className="input data-num" value={r.indicated_value}
                             onChange={(e) => updateWeighingRow(i, 'indicated_value', e.target.value)} /></td>
                  <td className="data-num">{r.error !== undefined ? r.error?.toFixed?.(3) ?? r.error : '—'}</td>
                  <td className="data-num">{r.mpe !== undefined && r.mpe !== null ? `± ${r.mpe}` : '—'}</td>
                  <td className="data-num">{r.verification_intervals ?? '—'}</td>
                  <td>{r.result ? <ResultBadge value={r.result} /> : '—'}</td>
                  <td><button onClick={() => removeWeighingRow(i)} className="text-mist hover:text-fail"><IconTrash /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between">
            <button onClick={addWeighingRow} className="btn-outline"><IconPlus /> Add Row</button>
            <button onClick={saveWeighing} disabled={weighingRows.length === 0} className="btn-primary">
              Save &amp; Calculate
            </button>
          </div>
        </div>
      )}

      {tab === 'repeatability' && (
        <div className="panel p-5">
          <p className="mb-4 text-sm text-steel">
            Weigh the same load repeatedly (comma-separated readings). The spread between readings must stay within the applicable MPE.
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Test Load ({unit})</th><th>Readings (comma-separated)</th><th>Mean</th><th>Range</th><th>MPE</th><th>Result</th><th></th></tr>
            </thead>
            <tbody>
              {repRows.map((r, i) => (
                <tr key={i}>
                  <td><input type="number" step="any" className="input data-num" value={r.test_load}
                             onChange={(e) => updateRepRow(i, 'test_load', e.target.value)} /></td>
                  <td><input className="input data-num" placeholder="e.g. 250.1, 250.0, 250.15" value={r.readingsText}
                             onChange={(e) => updateRepRow(i, 'readingsText', e.target.value)} /></td>
                  <td className="data-num">{r.mean_value ?? '—'}</td>
                  <td className="data-num">{r.range_value ?? '—'}</td>
                  <td className="data-num">{r.mpe !== undefined && r.mpe !== null ? `± ${r.mpe}` : '—'}</td>
                  <td>{r.result ? <ResultBadge value={r.result} /> : '—'}</td>
                  <td><button onClick={() => removeRepRow(i)} className="text-mist hover:text-fail"><IconTrash /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between">
            <button onClick={addRepRow} className="btn-outline"><IconPlus /> Add Test Load</button>
            <button onClick={saveRepeatability} disabled={repRows.length === 0} className="btn-primary">
              Save &amp; Calculate
            </button>
          </div>
        </div>
      )}

      {tab === 'eccentricity' && (
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-steel">Apply an off-centre load at each corner position and record the indication.</p>
            <button onClick={suggestEccRows} className="btn-outline">Suggest Test Points</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Position</th><th>Test Load ({unit})</th><th>Indication ({unit})</th><th>Error</th><th>MPE</th><th>Result</th><th></th></tr>
            </thead>
            <tbody>
              {eccRows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <select className="select" value={r.position} onChange={(e) => updateEccRow(i, 'position', e.target.value)}>
                      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td><input type="number" step="any" className="input data-num" value={r.test_load}
                             onChange={(e) => updateEccRow(i, 'test_load', e.target.value)} /></td>
                  <td><input type="number" step="any" className="input data-num" value={r.indicated_value}
                             onChange={(e) => updateEccRow(i, 'indicated_value', e.target.value)} /></td>
                  <td className="data-num">{r.error !== undefined ? r.error : '—'}</td>
                  <td className="data-num">{r.mpe !== undefined && r.mpe !== null ? `± ${r.mpe}` : '—'}</td>
                  <td>{r.result ? <ResultBadge value={r.result} /> : '—'}</td>
                  <td><button onClick={() => removeEccRow(i)} className="text-mist hover:text-fail"><IconTrash /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between">
            <button onClick={addEccRow} className="btn-outline"><IconPlus /> Add Position</button>
            <button onClick={saveEccentricity} disabled={eccRows.length === 0} className="btn-primary">
              Save &amp; Calculate
            </button>
          </div>
        </div>
      )}

      <div className="panel flex items-center justify-between p-5">
        <p className="text-sm text-steel">
          Once all applicable tests are recorded, finalize to compute the overall PASS/FAIL result and lock the report.
        </p>
        <button onClick={handleFinalize} className="btn-brass">Finalize &amp; Calculate Result</button>
      </div>
    </div>
  )
}
