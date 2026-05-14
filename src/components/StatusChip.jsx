import { STATUS_COLORS, T } from '../tokens';

export default function StatusChip({ status, onChange, style }) {
  const col = STATUS_COLORS[status] || { bg: '#F3E8FF', text: '#9333EA' };

  if (!onChange) {
    return (
      <span style={{
        padding: '3px 10px', borderRadius: T.radiusPill, fontSize: 11, fontWeight: 600,
        background: col.bg, color: col.text, ...style,
      }}>
        {status}
      </span>
    );
  }

  const statuses = ['Open', 'In Progress', 'Done', 'Blocked'];
  return (
    <select
      value={status}
      onChange={e => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={e => e.stopPropagation()}
      style={{
        padding: '3px 8px', borderRadius: T.radiusPill, fontSize: 11, fontWeight: 600,
        background: col.bg, color: col.text, border: 'none', cursor: 'pointer', outline: 'none', ...style,
      }}
    >
      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
