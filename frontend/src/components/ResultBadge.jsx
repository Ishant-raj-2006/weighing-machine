export default function ResultBadge({ value }) {
  if (value === 'PASS') return <span className="badge-pass">PASS</span>
  if (value === 'FAIL') return <span className="badge-fail">FAIL</span>
  return <span className="badge-neutral">{value || 'PENDING'}</span>
}
