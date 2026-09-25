import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api'

export default function NewTest() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('instrument')

  const [instruments, setInstruments] = useState([])
  const [form, setForm] = useState({
    instrument_id: preselected || '',
    lab_name: '',
    lab_temperature_c: '',
    lab_humidity_pct: '',
    atmospheric_pressure_hpa: '',
    test_stage: 'initial_verification',
    test_date: new Date().toISOString().slice(0, 10),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/instruments').then((res) => setInstruments(res.data))
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const selected = instruments.find((i) => String(i.id) === String(form.instrument_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.instrument_id) {
      setError('Select an instrument to test.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        instrument_id: Number(form.instrument_id),
        lab_temperature_c: form.lab_temperature_c ? parseFloat(form.lab_temperature_c) : null,
        lab_humidity_pct: form.lab_humidity_pct ? parseFloat(form.lab_humidity_pct) : null,
        atmospheric_pressure_hpa: form.atmospheric_pressure_hpa ? parseFloat(form.atmospheric_pressure_hpa) : null,
      }
      const res = await api.post('/tests', payload)
      navigate(`/tests/${res.data.id}/observations`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create test report.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">New Test</h1>
        <p className="text-sm text-steel">Select an instrument and record laboratory conditions to begin.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6">
        <label className="field-label">Instrument *</label>
        <select required className="select" value={form.instrument_id}
                onChange={(e) => update('instrument_id', e.target.value)}>
          <option value="">— Select instrument —</option>
          {instruments.map((i) => (
            <option key={i.id} value={i.id}>
              {i.manufacturer_name} · {i.model_name} · {i.serial_number}
            </option>
          ))}
        </select>
        {instruments.length === 0 && (
          <p className="mt-2 text-xs text-steel">
            No instruments yet. <Link to="/instruments/new" className="text-brass hover:underline">Register one first</Link>.
          </p>
        )}

        {selected && (
          <div className="mt-3 grid grid-cols-4 gap-3 rounded bg-canvas px-4 py-3 text-xs text-steel">
            <div><span className="block text-steel/70">Max / Min</span><span className="data-num text-ink">{selected.max_capacity} / {selected.min_capacity} {selected.unit}</span></div>
            <div><span className="block text-steel/70">e</span><span className="data-num text-ink">{selected.e_value} {selected.unit}</span></div>
            <div><span className="block text-steel/70">Class</span><span className="text-ink">{selected.accuracy_class}</span></div>
            <div><span className="block text-steel/70">Type</span><span className="text-ink">{selected.instrument_type}</span></div>
          </div>
        )}

        <h2 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-steel">Laboratory &amp; Environmental Conditions</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Laboratory Name *</label>
            <input required className="input" value={form.lab_name} onChange={(e) => update('lab_name', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Test Date</label>
            <input type="date" className="input" value={form.test_date} onChange={(e) => update('test_date', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Ambient Temperature (°C)</label>
            <input type="number" step="any" className="input" value={form.lab_temperature_c}
                   onChange={(e) => update('lab_temperature_c', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Relative Humidity (%)</label>
            <input type="number" step="any" className="input" value={form.lab_humidity_pct}
                   onChange={(e) => update('lab_humidity_pct', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Atmospheric Pressure (hPa)</label>
            <input type="number" step="any" className="input" value={form.atmospheric_pressure_hpa}
                   onChange={(e) => update('atmospheric_pressure_hpa', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Test Stage</label>
            <select className="select" value={form.test_stage} onChange={(e) => update('test_stage', e.target.value)}>
              <option value="initial_verification">Initial Verification (Type Approval)</option>
              <option value="in_service">In-Service (Subsequent Verification)</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-4 rounded bg-failBg px-3 py-2 text-sm text-fail">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating…' : 'Continue to Observations'}
          </button>
        </div>
      </form>
    </div>
  )
}
