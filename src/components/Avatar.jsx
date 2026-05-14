export default function Avatar({ member, size = 28 }) {
  if (!member) return null;
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <div
      title={member.name}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: member.color || '#C084FC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff',
        flexShrink: 0, userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}
