import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const ACCURACY_CLASSES = ['I', 'II', 'III', 'IIII']
const INSTRUMENT_CATEGORIES = [
  {
    category: "Home & Health Care Scales",
    types: ["Digital Body Scale", "Analog Spring Scale", "Smart Body Composition Scale", "Baby Weighing Scale", "Kitchen / Food Scale"]
  },
  {
    category: "Commercial & Retail Scales",
    types: ["Price Computing Scale", "Counter / Bench Scale", "Hanging / Luggage Scale", "POS Billing Scale"]
  },
  {
    category: "Scientific & Precision Scales",
    types: ["Analytical Balance", "Jewelry Scale", "Counting Scale"]
  },
  {
    category: "Heavy Industrial & Logistics Scales",
    types: ["Platform / Floor Scale", "Crane Scale", "Forklift Scale", "Conveyor Scale", "Tank & Silo Scale"]
  },
  {
    category: "Transport & Heavy Vehicle Scales",
    types: ["Weighbridge / Truck Scale", "Axle Scale"]
  }
]

const initial = {
  manufacturer_name: '', manufacturer_address: '', model_name: '', instrument_type: INSTRUMENT_CATEGORIES[0].types[0],
  serial_number: '', max_capacity: '', min_capacity: '', e_value: '', d_value: '', unit: 'kg', accuracy_class: 'III',
}

export default function NewInstrument() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        max_capacity: parseFloat(form.max_capacity),
        min_capacity: parseFloat(form.min_capacity),
        e_value: parseFloat(form.e_value),
        d_value: form.d_value ? parseFloat(form.d_value) : null,
      }
      const res = await api.post('/instruments', payload)

      if (photo) {
        const fd = new FormData()
        fd.append('file', photo)
        await api.post(`/instruments/${res.data.id}/photo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate(`/tests/new?instrument=${res.data.id}`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not save instrument.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">New Instrument</h1>
        <p className="text-sm text-steel">Register a NAWI unit before recording test observations.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel">Manufacturer</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Manufacturer Name *</label>
            <input required className="input" value={form.manufacturer_name}
                   onChange={(e) => update('manufacturer_name', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Manufacturer Address</label>
            <input className="input" value={form.manufacturer_address}
                   onChange={(e) => update('manufacturer_address', e.target.value)} />
          </div>
        </div>

        <h2 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-steel">Model &amp; Identification</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="field-label">Model Name *</label>
            <input required className="input" value={form.model_name}
                   onChange={(e) => update('model_name', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Instrument Type</label>
            <select className="select" value={form.instrument_type}
                    onChange={(e) => update('instrument_type', e.target.value)}>
              {INSTRUMENT_CATEGORIES.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.types.map((t) => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Serial Number *</label>
            <input required className="input" value={form.serial_number}
                   onChange={(e) => update('serial_number', e.target.value)} />
          </div>
        </div>

        <h2 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-steel">Technical Parameters</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="field-label">Max Capacity *</label>
            <input required type="number" step="any" className="input" value={form.max_capacity}
                   onChange={(e) => update('max_capacity', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Min Capacity *</label>
            <input required type="number" step="any" className="input" value={form.min_capacity}
                   onChange={(e) => update('min_capacity', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <select className="select" value={form.unit} onChange={(e) => update('unit', e.target.value)}>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="t">t</option>
            </select>
          </div>
          <div>
            <label className="field-label">Verification Scale Interval (e) *</label>
            <input required type="number" step="any" className="input" value={form.e_value}
                   onChange={(e) => update('e_value', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Actual Scale Interval (d)</label>
            <input type="number" step="any" className="input" value={form.d_value}
                   onChange={(e) => update('d_value', e.target.value)} placeholder="defaults to e" />
          </div>
          <div>
            <label className="field-label">Accuracy Class *</label>
            <select className="select" value={form.accuracy_class}
                    onChange={(e) => update('accuracy_class', e.target.value)}>
              {ACCURACY_CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="mt-4 rounded bg-failBg px-3 py-2 text-sm text-fail">{error}</p>}

        <h2 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-steel">Photograph (optional)</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          className="block w-full text-sm text-steel file:mr-3 file:rounded file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-line"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save & Continue to New Test'}
          </button>
        </div>
      </form>
    </div>
  )
}
