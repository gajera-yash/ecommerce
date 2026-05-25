import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Tag, Skeleton, Typography, Progress, Avatar, Badge, Tooltip } from 'antd';
import {
  ShoppingCartOutlined, DollarOutlined, RiseOutlined,
  ClockCircleOutlined, CloseCircleOutlined, TrophyOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ThunderboltOutlined,
  FireOutlined, StarOutlined, EyeOutlined,
} from '@ant-design/icons';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer, RadialBarChart,
  RadialBar, LineChart, Line,
} from 'recharts';
import { getDashboardSummary, getDashboardCharts, getTopProducts, getOrders } from '../api';
import { formatCurrency, formatDate, deliveryStatusColors } from '../utils';

const { Title, Text } = Typography;

// ── Palette ──────────────────────────────────────────────────────────────
const C = {
  blue: '#6366f1',
  green: '#10b981',
  red: '#f43f5e',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
};

// ── Custom Chart Tooltip ─────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1e2e, #2d2d44)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color, fontSize: 12 }}>{p.name}</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
            {typeof p.value === 'number' && p.value > 100
              ? `₹${p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Animated Counter ─────────────────────────────────────────────────────
function AnimatedValue({ value, prefix = '', isNumeric = true }) {
  const [display, setDisplay] = useState(isNumeric ? 0 : value);
  const rafRef = useRef();
  useEffect(() => {
    if (!isNumeric) { setDisplay(value); return; }
    const end = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    const duration = 900;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(end * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, isNumeric]);
  return <>{prefix}{isNumeric ? display.toLocaleString('en-IN') : display}</>;
}

// ── Premium KPI Card ─────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon, color, trend, trendVal, index }) {
  const [hovered, setHovered] = useState(false);
  const isCurrency = typeof value === 'string' && value.includes('₹');
  const numericVal = isCurrency
    ? parseFloat(value.replace(/[^0-9.]/g, ''))
    : typeof value === 'number' ? value : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '20px 22px',
        border: `1px solid ${hovered ? color + '40' : '#f1f5f9'}`,
        boxShadow: hovered
          ? `0 16px 40px ${color}22, 0 4px 12px rgba(0,0,0,0.06)`
          : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${index * 80}ms`,
        animation: 'slideUp 0.4s ease-out both',
      }}
    >
      {/* Gradient blob */}
      <div style={{
        position: 'absolute', top: -28, right: -28,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}25, transparent 70%)`,
        transition: 'transform 0.3s',
        transform: hovered ? 'scale(1.4)' : 'scale(1)',
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#fff', boxShadow: `0 4px 12px ${color}44`,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 700,
            color: trend >= 0 ? C.green : C.red,
            background: trend >= 0 ? '#d1fae5' : '#fee2e2',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(trendVal || trend)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          {isCurrency
            ? <AnimatedValue value={numericVal} prefix="₹" />
            : <AnimatedValue value={numericVal} isNumeric={true} />
          }
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Platform Badge ───────────────────────────────────────────────────────
function PlatformBadge({ platform }) {
  if (platform === 'AMAZON') return (
    <span style={{
      background: 'linear-gradient(135deg, #ff9900, #ffb347)',
      color: '#7a3600', fontSize: 10, fontWeight: 800,
      padding: '2px 8px', borderRadius: 20, letterSpacing: 0.3,
    }}>AMZ</span>
  );
  return (
    <span style={{
      background: 'linear-gradient(135deg, #2874f0, #5ba4f5)',
      color: '#fff', fontSize: 10, fontWeight: 800,
      padding: '2px 8px', borderRadius: 20, letterSpacing: 0.3,
    }}>FLK</span>
  );
}

// ── Status dot ───────────────────────────────────────────────────────────
const statusDot = { DELIVERED: C.green, SHIPPED: C.cyan, PENDING: C.amber, CANCELLED: C.red, RETURNED: '#f97316' };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [topProds, setTopProds] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tid = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tid);
  }, []);

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getDashboardCharts(),
      getTopProducts(),
      getOrders({ limit: 6, sort_by: 'order_date', sort_order: 'DESC' }),
    ]).then(([s, c, t, o]) => {
      setSummary(s.data);
      setCharts(c.data);
      setTopProds(t.data || []);
      setRecentOrders(o.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 24 }}>
      <Skeleton active paragraph={{ rows: 4 }} style={{ marginBottom: 24 }} />
      <Row gutter={16}>
        {[...Array(5)].map((_, i) => <Col span={24 / 5} key={i}><Skeleton.Button active block style={{ height: 110, borderRadius: 16 }} /></Col>)}
      </Row>
    </div>
  );

  // ── Derived metrics ────────────────────────────────────────────────────
  const deliveryRate = summary?.totalOrders > 0
    ? Math.round(((summary.deliveredOrders || 0) / summary.totalOrders) * 100)
    : 0;
  const margin = summary?.monthGrossRevenue > 0
    ? ((summary.monthNetProfit / summary.monthGrossRevenue) * 100).toFixed(1)
    : 0;

  // KPI config
  const kpis = [
    {
      title: "Today's Orders", value: summary?.todayOrders || 0,
      sub: "Orders placed today", icon: <ShoppingCartOutlined />, color: C.blue, trend: 12,
    },
    {
      title: 'Monthly Revenue', value: formatCurrency(summary?.monthGrossRevenue),
      sub: "Gross this month", icon: <DollarOutlined />, color: C.green, trend: 8,
    },
    {
      title: 'Net Profit', value: formatCurrency(summary?.monthNetProfit),
      sub: `Margin: ${margin}%`, icon: <RiseOutlined />,
      color: (summary?.monthNetProfit || 0) >= 0 ? C.green : C.red,
      trend: (summary?.monthNetProfit || 0) >= 0 ? 5 : -5,
    },
    {
      title: 'Pending Orders', value: summary?.pendingOrders || 0,
      sub: "Needs attention", icon: <ClockCircleOutlined />, color: C.amber,
    },
    {
      title: 'Returns & Cancels', value: summary?.returnedCancelled || 0,
      sub: "Action required", icon: <CloseCircleOutlined />, color: C.red,
    },
  ];

  // Chart data enrichment
  const trendData = (charts?.monthlyTrend || []).map(m => ({
    month: m.month?.substring(5) || m.month,
    Revenue: Math.round(m.revenue || 0),
    Profit: Math.round(m.profit || 0),
  }));

  const platformData = (charts?.platformSplit || []).map(p => ({
    platform: p.platform,
    Revenue: Math.round(p.revenue || 0),
    Profit: Math.round(p.profit || 0),
  }));

  // Radial data for delivery rate
  const radialData = [
    { name: 'Delivered', value: deliveryRate, fill: C.green },
    { name: 'Other', value: 100 - deliveryRate, fill: '#f1f5f9' },
  ];

  // Status distribution
  const statusDist = ['DELIVERED', 'SHIPPED', 'PENDING', 'CANCELLED', 'RETURNED'].map(s => ({
    name: s, count: recentOrders.filter(o => o.delivery_status === s).length,
  }));

  // Recent orders columns
  const orderCols = [
    {
      title: 'Order', key: 'order', width: 160,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: C.blue, fontSize: 12 }}>{r.order_id}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.product_name}
          </div>
        </div>
      )
    },
    {
      title: 'Platform', dataIndex: 'platform', width: 70,
      render: p => <PlatformBadge platform={p} />
    },
    {
      title: 'Amount', dataIndex: 'sale_price', width: 100, align: 'right',
      render: v => <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(v)}</span>
    },
    {
      title: 'Profit', dataIndex: 'profit', width: 90, align: 'right',
      render: v => {
        const n = parseFloat(v) || 0;
        return (
          <span style={{ fontWeight: 700, fontSize: 12, color: n >= 0 ? C.green : C.red }}>
            {n >= 0 ? '+' : ''}{formatCurrency(n)}
          </span>
        );
      }
    },
    {
      title: 'Status', dataIndex: 'delivery_status', width: 100,
      render: s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot[s], flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: statusDot[s] }}>{s}</span>
        </div>
      )
    },
    {
      title: 'Date', dataIndex: 'order_date', width: 85,
      render: v => <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(v)}</span>
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.35s ease-out' }}>

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)',
        borderRadius: 22,
        padding: '28px 32px',
        marginBottom: 22,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -40, right: 80, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, left: '40%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>
              👋 Welcome back,
            </div>
            <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>
              Dashboard Overview
            </Title>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              Your seller performance at a glance
            </div>
          </div>

          {/* Live stats strip */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', fontSize: 22, fontWeight: 900 }}>{deliveryRate}%</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Delivery Rate</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', fontSize: 22, fontWeight: 900 }}>{summary?.totalOrders || 0}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Total Orders</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6366f1', fontSize: 22, fontWeight: 900 }}>{margin}%</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Profit Margin</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ color: '#64748b', fontSize: 11 }}>
                {time.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <Col xs={24} sm={12} lg={Math.floor(24 / kpis.length)} key={i}>
            <KpiCard {...k} index={i} />
          </Col>
        ))}
      </Row>

      {/* ── Charts Row ───────────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 14 }}>

        {/* Area Chart – Revenue Trend */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff',
                }}>📈</div>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>Revenue vs Profit Trend</span>
              </div>
            }
            style={{ borderRadius: 18, border: '1px solid #f1f5f9' }}
            styles={{ body: { padding: '8px 16px 20px' } }}
          >
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <RTooltip content={<DarkTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="Revenue" stroke={C.blue} strokeWidth={2.5}
                  fill="url(#gRevenue)" dot={{ r: 4, fill: C.blue, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="Profit" stroke={C.green} strokeWidth={2.5}
                  fill="url(#gProfit)" dot={{ r: 4, fill: C.green, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Platform Split Bar */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff',
                }}>🛒</div>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>Platform Split</span>
              </div>
            }
            style={{ borderRadius: 18, border: '1px solid #f1f5f9', height: '100%' }}
            styles={{ body: { padding: '8px 16px 20px' } }}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <RTooltip content={<DarkTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Revenue" fill={C.blue} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill={C.green} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ── Bottom Row ───────────────────────────────────────────────── */}
      <Row gutter={[14, 14]}>

        {/* Top Products */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff',
                }}><TrophyOutlined /></div>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>Top 5 Products</span>
              </div>
            }
            style={{ borderRadius: 18, border: '1px solid #f1f5f9' }}
            styles={{ body: { padding: '4px 16px 16px' } }}
          >
            {topProds.length === 0
              ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>No data</div>
              : topProds.slice(0, 5).map((p, i) => {
                const maxRev = topProds[0]?.total_revenue || 1;
                const pct = Math.round((p.total_revenue / maxRev) * 100);
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div key={p.product_sku || i} style={{
                    padding: '10px 0',
                    borderBottom: i < 4 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{medals[i]}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.product_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.total_qty} units sold</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{formatCurrency(p.total_revenue)}</div>
                        <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>+{formatCurrency(p.total_profit)}</div>
                      </div>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      size="small"
                      strokeColor={{
                        '0%': i === 0 ? '#f59e0b' : C.blue,
                        '100%': i === 0 ? '#fbbf24' : C.purple,
                      }}
                      trailColor="#f1f5f9"
                    />
                  </div>
                );
              })
            }
          </Card>
        </Col>

        {/* Recent Orders */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, color: '#fff',
                  }}><ThunderboltOutlined /></div>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Recent Orders</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.entries(statusDot).map(([s, c]) => (
                    recentOrders.some(o => o.delivery_status === s) && (
                      <Tooltip key={s} title={s}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                      </Tooltip>
                    )
                  ))}
                </div>
              </div>
            }
            style={{ borderRadius: 18, border: '1px solid #f1f5f9' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={recentOrders}
              columns={orderCols}
              rowKey="id"
              pagination={false}
              size="small"
              style={{ borderRadius: '0 0 18px 18px', overflow: 'hidden' }}
              rowClassName="dash-order-row"
            />
          </Card>
        </Col>
      </Row>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-order-row:hover td {
          background: #f8faff !important;
        }
        .ant-table-thead > tr > th {
          background: #fafbff !important;
        }
      `}</style>
    </div>
  );
}
