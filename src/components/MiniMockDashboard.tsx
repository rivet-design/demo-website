/**
 * Compact "fake app" UI sized for a workflow-panel slot (~640×440).
 * Uses literal colors so it doesn't depend on any host design tokens.
 */
const COLORS = {
  card: '#ffffff',
  cardSoft: '#fafaf8',
  text: '#1c1c1a',
  textMuted: '#6f6f6a',
  border: '#e6e6e1',
  primary: '#ff3300',
  primaryBorder: '#ff6b35',
  success: '#1f9d55',
};

const MiniMockDashboard = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateRows: '44px 1fr',
      background: COLORS.card,
      color: COLORS.text,
      fontSize: 12,
    }}
  >
    {/* Topbar */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 14px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.cardSoft,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: COLORS.primary,
        }}
      />
      <strong style={{ fontSize: 12 }}>Acme</strong>
      <nav style={{ display: 'flex', gap: 14, marginLeft: 8 }}>
        <NavLink label="Overview" active />
        <NavLink label="Customers" />
        <NavLink label="Billing" />
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill label="Last 7d" active />
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryBorder})`,
          }}
        />
      </div>
    </div>

    {/* Body */}
    <section
      style={{
        padding: '14px 16px',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        gap: 12,
        overflow: 'hidden',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Welcome back, Sam
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.textMuted }}>
          Here's how things are going this week.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        <Stat label="Active users" value="12,486" delta="+8.2%" />
        <Stat label="Sessions" value="48,910" delta="+3.1%" />
        <Stat label="Revenue" value="$84,210" delta="+12.5%" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 8,
          minHeight: 0,
        }}
      >
        <Card title="Active users">
          <FakeChart />
        </Card>
        <Card title="Recent signups">
          <Row name="Maya Chen" plan="Pro" />
          <Row name="Theo Park" plan="Hobby" />
          <Row name="Aria Singh" plan="Pro" />
        </Card>
      </div>
    </section>
  </div>
);

const NavLink = ({ label, active = false }: { label: string; active?: boolean }) => (
  <span
    style={{
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      color: active ? COLORS.text : COLORS.textMuted,
    }}
  >
    {label}
  </span>
);

const Pill = ({ label, active = false }: { label: string; active?: boolean }) => (
  <span
    style={{
      fontSize: 11,
      padding: '3px 8px',
      borderRadius: 999,
      background: active ? COLORS.primary : 'transparent',
      color: active ? '#fff' : COLORS.textMuted,
      border: active ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
    }}
  >
    {label}
  </span>
);

const Stat = ({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) => (
  <div
    style={{
      padding: 10,
      borderRadius: 8,
      border: `1px solid ${COLORS.border}`,
      background: COLORS.card,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <span style={{ fontSize: 10, color: COLORS.textMuted }}>{label}</span>
    <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
    <span style={{ fontSize: 10, color: COLORS.success }}>{delta}</span>
  </div>
);

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      padding: 10,
      borderRadius: 8,
      border: `1px solid ${COLORS.border}`,
      background: COLORS.card,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minHeight: 0,
    }}
  >
    <span style={{ fontSize: 11, fontWeight: 600 }}>{title}</span>
    <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

const FakeChart = () => {
  const points = [22, 28, 24, 36, 42, 38, 48, 60, 54, 66, 72, 70, 84, 80, 92];
  const max = Math.max(...points);
  const w = 240;
  const h = 80;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (p / max) * h}`)
    .join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="rivet-mini-chart" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.35" />
          <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#rivet-mini-chart)" />
      <path d={path} fill="none" stroke={COLORS.primary} strokeWidth={1.6} />
    </svg>
  );
};

const Row = ({ name, plan }: { name: string; plan: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 0',
      borderBottom: `1px solid ${COLORS.border}`,
      fontSize: 11,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: COLORS.cardSoft,
        border: `1px solid ${COLORS.border}`,
        display: 'grid',
        placeItems: 'center',
        fontSize: 9,
        fontWeight: 600,
        color: COLORS.textMuted,
      }}
    >
      {name
        .split(' ')
        .map((s) => s[0])
        .join('')}
    </div>
    <span style={{ fontWeight: 500 }}>{name}</span>
    <span
      style={{
        marginLeft: 'auto',
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 999,
        background: COLORS.cardSoft,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.textMuted,
      }}
    >
      {plan}
    </span>
  </div>
);

export default MiniMockDashboard;
