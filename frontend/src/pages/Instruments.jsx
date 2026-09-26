import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { uploadsBase } from '../api'
import { IconSearch, IconPlus } from '../components/icons'

export default function Instruments() {
  const [instruments, setInstruments] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(query) {
    setLoading(true)
    try {
      const res = await api.get('/instruments', { params: query ? { q: query } : {} })
      setInstruments(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('') }, [])

  function handleSearch(e) {
    e.preventDefault()
    load(q)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Instruments</h1>
          <p className="text-sm text-steel">Registered NAWI units and their declared specifications.</p>
        </div>
        <Link to="/instruments/new" className="btn-primary"><IconPlus /> New Instrument</Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input
            className="input pl-9"
            placeholder="Search manufacturer, model or serial no."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Manufacturer / Model</th>
              <th>Serial No.</th>
              <th>Type</th>
              <th>Max / Min</th>
              <th>e</th>
              <th>Class</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="py-6 text-center text-steel">Loading…</td></tr>
            )}
            {!loading && instruments.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-steel">No instruments found.</td></tr>
            )}
            {instruments.map((inst) => (
              <tr key={inst.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {inst.photo_path && (
                      <img src={`${uploadsBase}/${inst.photo_path}`} alt=""
                           className="h-9 w-9 rounded border border-line object-cover" />
                    )}
                    <div>
                      <div className="font-medium text-ink">{inst.manufacturer_name}</div>
                      <div className="text-xs text-steel">{inst.model_name}</div>
                    </div>
                  </div>
                </td>
                <td className="data-num">{inst.serial_number}</td>
                <td className="text-steel">{inst.instrument_type}</td>
                <td className="data-num">{inst.max_capacity} / {inst.min_capacity} {inst.unit}</td>
                <td className="data-num">{inst.e_value} {inst.unit}</td>
                <td>
                  <span className="badge-neutral">Class {inst.accuracy_class}</span>
                </td>
                <td className="text-right flex items-center justify-end gap-3">
                  <Link to={`/tests/new?instrument=${inst.id}`} className="text-sm font-medium text-brass hover:underline">
                    New Test
                  </Link>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this instrument?')) {
                        try {
                          await api.delete(`/instruments/${inst.id}`)
                          setInstruments(instruments.filter(i => i.id !== inst.id))
                        } catch(err) {
                          alert('Failed to delete instrument.')
                        }
                      }
                    }}
                    className="text-sm font-medium text-fail hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
