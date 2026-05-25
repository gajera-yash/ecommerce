import { useState, useEffect, useMemo } from 'react';
import {
  Table, Card, Typography, DatePicker, Row, Col, Tag,
  Select, Space, Progress, Tooltip, Badge, Button, Segmented
} from 'antd';
import {
  DollarOutlined, ShoppingOutlined, PercentageOutlined,
  RiseOutlined, FallOutlined, ArrowUpOutlined, ArrowDownOutlined,
  InfoCircleOutlined, FilterOutlined, ReloadOutlined, TrophyOutlined,
  FireOutlined
} from '@ant-design/icons';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { getOrders } from '../api';
import { formatCurrency, formatDate, deliveryStatusColors, paymentStatusColors } from '../utils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  revenue: '#6366f1',
  profit: '#10b981',
  cost: '#f43f5e',
  deduction: '#f59e0b',
  platform: '#8b5cf6',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

// ── Custom Tooltip for charts ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '10px 14px', minWidth: 160,
    }}>
      <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color, fontSize: 12, fontWeight: 500 }}>{p.name}</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
            ₹{(p.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon, color, gradient, badge }) {
  return (
    <div style={{
      background: gradient || `linear-gradient(135deg, ${color}18, ${color}08)`,
      border: `1px solid ${color}28`,
      borderRadius: 16, padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Glow circle */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 90, height: 90, borderRadius: '50%',
        background: `${color}15`, filter: 'blur(20px)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {title}
          </Text>
          {badge && <Tag color={badge === 'top' ? 'gold' : 'blue'} style={{ marginLeft: 6, fontSize: 10 }}>
            {badge === 'top' ? '🏆 Best' : badge}
          </Tag>}
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 4, lineHeight: 1.2 }}>
            {value}
          </div>
          {sub && <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{sub}</Text>}
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: color, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Month bar inside monthly table ─────────────────────────────────────────
function MarginBar({ value, maxVal }) {
  const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
  const color = value >= 20 ? '#10b981' : value >= 10 ? '#f59e0b' : '#f43f5e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
      <Text style={{ fontSize: 12, fontWeight: 700, color, minWidth: 38 }}>{value}%</Text>
    </div>
  );
}

export default function Revenue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('overview');

  const fetchOrders = () => {
    setLoading(true);
    getOrders({ limit: 1000, ...filters })
      .then(r => setOrders(r.data.orders || []))
      .finally(() => setLoading(false));
  };
  useEffect(fetchOrders, [filters]);

  // ── Filtered data ──────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    platformFilter === 'ALL' ? orders : orders.filter(o => o.platform === platformFilter),
    [orders, platformFilter]
  );

  // ── KPI metrics ───────────────────────────────────────────────────────
  const totalRevenue = filtered.reduce((s, o) => s + (parseFloat(o.sale_price) || 0), 0);
  const totalProfit = filtered.reduce((s, o) => s + (parseFloat(o.profit) || 0), 0);
  const totalCost = filtered.reduce((s, o) => s + (parseFloat(o.my_cost_price) || 0), 0);
  const totalDeductions = filtered.reduce((s, o) =>
    s + (parseFloat(o.platform_fee) || 0) + (parseFloat(o.shipping_fee) || 0) + (parseFloat(o.other_deductions) || 0), 0);
  const totalNet = filtered.reduce((s, o) => s + (parseFloat(o.net_amount_received) || 0), 0);
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
  const deliveredOrders = filtered.filter(o => o.delivery_status === 'DELIVERED');
  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + (parseFloat(o.sale_price) || 0), 0);

  // ── Monthly aggregation ───────────────────────────────────────────────
  const monthMap = {};
  filtered.forEach(o => {
    const m = (o.order_date || '').substring(0, 7);
    if (!m) return;
    if (!monthMap[m]) monthMap[m] = { month: m, label: '', orders: 0, gross: 0, deductions: 0, net: 0, cost: 0, profit: 0 };
    const d = new Date(m + '-01');
    monthMap[m].label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    monthMap[m].orders++;
    monthMap[m].gross += parseFloat(o.sale_price) || 0;
    monthMap[m].deductions += (parseFloat(o.platform_fee) || 0) + (parseFloat(o.shipping_fee) || 0) + (parseFloat(o.other_deductions) || 0);
    monthMap[m].net += parseFloat(o.net_amount_received) || 0;
    monthMap[m].cost += parseFloat(o.my_cost_price) || 0;
    monthMap[m].profit += parseFloat(o.profit) || 0;
  });
  const monthlySummary = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  const maxProfit = Math.max(...monthlySummary.map(m => m.profit), 1);

  // Chart data
  const chartData = monthlySummary.map(m => ({
    month: m.label || m.month,
    Revenue: Math.round(m.gross),
    Profit: Math.round(m.profit),
    Cost: Math.round(m.cost),
  }));

  // Platform split pie
  const platformMap = {};
  filtered.forEach(o => {
    if (!platformMap[o.platform]) platformMap[o.platform] = 0;
    platformMap[o.platform] += parseFloat(o.sale_price) || 0;
  });
  const pieData = Object.entries(platformMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  // Category pie
  const catMap = {};
  filtered.forEach(o => {
    const cat = o.category || 'Other';
    if (!catMap[cat]) catMap[cat] = 0;
    catMap[cat] += parseFloat(o.profit) || 0;
  });
  const catPieData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  // Best month
  const bestMonth = monthlySummary.reduce((b, m) => (m.profit > (b?.profit || -Infinity) ? m : b), null);

  // ── Columns ───────────────────────────────────────────────────────────
  const profitCols = [
    {
      title: 'Order ID', dataIndex: 'order_id', width: 120, fixed: 'left',
      render: t => (
        <Text code style={{ color: '#6366f1', fontSize: 12 }}>{t}</Text>
      )
    },
    {
      title: 'Product', dataIndex: 'product_name', width: 180, ellipsis: true,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>SKU: {r.product_sku}</div>
        </div>
      )
    },
    {
      title: 'Platform', dataIndex: 'platform', width: 90,
      render: v => (
        <Tag color={v === 'AMAZON' ? 'orange' : 'blue'} style={{ fontWeight: 700, fontSize: 10 }}>{v}</Tag>
      )
    },
    {
      title: 'Sale Price', dataIndex: 'sale_price', width: 110, align: 'right',
      render: v => <Text style={{ fontWeight: 700, color: '#6366f1' }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Platform Fee', dataIndex: 'platform_fee', width: 110, align: 'right',
      render: v => <Text style={{ color: '#f43f5e' }}>-{formatCurrency(v)}</Text>
    },
    {
      title: 'Shipping', dataIndex: 'shipping_fee', width: 90, align: 'right',
      render: v => <Text style={{ color: '#f59e0b' }}>-{formatCurrency(v)}</Text>
    },
    {
      title: 'Net Received', dataIndex: 'net_amount_received', width: 115, align: 'right',
      render: v => <Text style={{ color: '#0ea5e9', fontWeight: 600 }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Cost Price', dataIndex: 'my_cost_price', width: 100, align: 'right',
      render: v => <Text style={{ color: '#f43f5e' }}>-{formatCurrency(v)}</Text>
    },
    {
      title: 'Profit', dataIndex: 'profit', width: 100, align: 'right',
      sorter: (a, b) => a.profit - b.profit,
      render: v => (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 10px', borderRadius: 20,
          background: v >= 0 ? '#d1fae5' : '#fee2e2',
          fontWeight: 800, fontSize: 13,
          color: v >= 0 ? '#059669' : '#dc2626',
        }}>
          {v >= 0 ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
          {formatCurrency(Math.abs(v))}
        </div>
      )
    },
    {
      title: 'Margin', dataIndex: 'profit_margin', width: 90, align: 'center',
      sorter: (a, b) => a.profit_margin - b.profit_margin,
      render: v => {
        const num = parseFloat(v);
        const color = num >= 20 ? '#10b981' : num >= 10 ? '#f59e0b' : '#f43f5e';
        return (
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontWeight: 700, fontSize: 13, color }}>{num}%</Text>
            <Progress percent={Math.max(0, Math.min(100, num))} size="small"
              strokeColor={color} showInfo={false} style={{ marginTop: 2 }} />
          </div>
        );
      }
    },
    {
      title: 'Date', dataIndex: 'order_date', width: 100,
      render: v => <Text style={{ color: '#64748b', fontSize: 12 }}>{formatDate(v)}</Text>
    },
    {
      title: 'Status', dataIndex: 'delivery_status', width: 100,
      render: v => <Tag color={deliveryStatusColors[v]}>{v}</Tag>
    },
  ];

  const monthlyCols = [
    {
      title: 'Month', dataIndex: 'month', width: 100,
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {bestMonth?.month === v && <TrophyOutlined style={{ color: '#f59e0b' }} />}
          <Text strong style={{ color: '#0f172a' }}>{r.label || v}</Text>
        </div>
      )
    },
    {
      title: 'Orders', dataIndex: 'orders', width: 80, align: 'center',
      render: v => <Badge count={v} style={{ backgroundColor: '#6366f1' }} />
    },
    {
      title: 'Gross Revenue', dataIndex: 'gross', align: 'right',
      render: v => <Text style={{ fontWeight: 600, color: '#6366f1' }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Deductions', dataIndex: 'deductions', align: 'right',
      render: v => <Text style={{ color: '#f43f5e' }}>-{formatCurrency(v)}</Text>
    },
    {
      title: 'Net Revenue', dataIndex: 'net', align: 'right',
      render: v => <Text style={{ color: '#0ea5e9', fontWeight: 600 }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'COGS', dataIndex: 'cost', align: 'right',
      render: v => <Text style={{ color: '#64748b' }}>-{formatCurrency(v)}</Text>
    },
    {
      title: 'Net Profit', dataIndex: 'profit', align: 'right', sorter: (a, b) => a.profit - b.profit,
      render: v => (
        <Text strong style={{ fontSize: 15, color: v >= 0 ? '#10b981' : '#f43f5e' }}>
          {v >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {formatCurrency(Math.abs(v))}
        </Text>
      )
    },
    {
      title: 'Margin', key: 'margin', width: 150,
      render: (_, r) => {
        const m = r.gross > 0 ? parseFloat(((r.profit / r.gross) * 100).toFixed(1)) : 0;
        const maxM = 50; // cap at 50%
        return <MarginBar value={m} maxVal={maxM} />;
      }
    },
    {
      title: 'Contribution', key: 'contrib', width: 130,
      render: (_, r) => {
        const pct = totalProfit > 0 ? ((r.profit / totalProfit) * 100).toFixed(1) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Progress percent={parseFloat(pct)} size="small" strokeColor="#6366f1" showInfo={false} style={{ flex: 1 }} />
            <Text style={{ fontSize: 11, color: '#64748b', minWidth: 38 }}>{pct}%</Text>
          </div>
        );
      }
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, marginBottom: 20,
      }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            💰 Revenue &amp; Profit Analytics
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Track your earnings, margins and monthly performance
          </Text>
        </div>
        <Space wrap>
          <Select
            value={platformFilter}
            onChange={setPlatformFilter}
            style={{ width: 130 }}
            options={[
              { value: 'ALL', label: '🌐 All Platforms' },
              { value: 'AMAZON', label: '🟠 Amazon' },
              { value: 'FLIPKART', label: '🔵 Flipkart' },
            ]}
          />
          <RangePicker
            onChange={dates => {
              if (dates) setFilters({ from: dates[0].format('YYYY-MM-DD'), to: dates[1].format('YYYY-MM-DD') });
              else setFilters({});
            }}
          />
          <Tooltip title="Refresh"><Button icon={<ReloadOutlined />} onClick={fetchOrders} /></Tooltip>
        </Space>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <KpiCard
            title="Gross Revenue"
            value={formatCurrency(totalRevenue)}
            sub={`${filtered.length} orders`}
            icon={<ShoppingOutlined />}
            color="#6366f1"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <KpiCard
            title="Net Received"
            value={formatCurrency(totalNet)}
            sub={`After all deductions`}
            icon={<DollarOutlined />}
            color="#0ea5e9"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <KpiCard
            title="Total COGS"
            value={formatCurrency(totalCost)}
            sub="Product cost"
            icon={<FallOutlined />}
            color="#f43f5e"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <KpiCard
            title="Net Profit"
            value={formatCurrency(totalProfit)}
            sub={`Margin: ${avgMargin}%`}
            icon={<RiseOutlined />}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <KpiCard
            title="Deductions"
            value={formatCurrency(totalDeductions)}
            sub="Fees + Shipping"
            icon={<PercentageOutlined />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <KpiCard
            title="Best Month"
            value={bestMonth ? (bestMonth.label || bestMonth.month) : '—'}
            sub={bestMonth ? formatCurrency(bestMonth.profit) + ' profit' : ''}
            icon={<FireOutlined />}
            color="#8b5cf6"
            badge="top"
          />
        </Col>
      </Row>

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>

        {/* Area chart – Revenue vs Profit */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <span style={{ fontWeight: 700 }}>
                📈 Revenue vs Profit Trend
              </span>
            }
            style={{ borderRadius: 16, height: '100%' }}
            styles={{ body: { padding: '8px 16px 16px' } }}
          >
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.revenue} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <RTooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Revenue" stroke={COLORS.revenue} strokeWidth={2.5}
                  fill="url(#gradRevenue)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Profit" stroke={COLORS.profit} strokeWidth={2.5}
                  fill="url(#gradProfit)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Pie charts */}
        <Col xs={24} lg={10}>
          <Row gutter={[14, 14]} style={{ height: '100%' }}>
            <Col span={12}>
              <Card title="🛒 Platform Split" style={{ borderRadius: 16, height: '100%' }}
                styles={{ body: { padding: '8px 8px 12px' } }}>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                      paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={v => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {pieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <Text style={{ fontSize: 11, color: '#64748b' }}>{d.name}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="📦 Category Profit" style={{ borderRadius: 16, height: '100%' }}
                styles={{ body: { padding: '8px 8px 12px' } }}>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={catPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                      paddingAngle={3} dataKey="value">
                      {catPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={v => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {catPieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[(i + 2) % PIE_COLORS.length] }} />
                      <Text style={{ fontSize: 11, color: '#64748b' }}>{d.name}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            {/* Bar – Cost vs Profit per month (compact) */}
            <Col span={24}>
              <Card title="💹 Monthly Profit Bars" style={{ borderRadius: 16 }}
                styles={{ body: { padding: '8px 12px 12px' } }}>
                <ResponsiveContainer width="100%" height={95}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <RTooltip content={<ChartTooltip />} />
                    <Bar dataKey="Profit" fill={COLORS.profit} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cost" fill={COLORS.cost} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* ── View Toggle ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <Segmented
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: '📅 Monthly Summary', value: 'overview' },
            { label: '🧾 Per-Order Breakdown', value: 'orders' },
          ]}
          style={{ fontWeight: 600 }}
        />
      </div>

      {/* ── Monthly Summary Table ────────────────────────────────────── */}
      {viewMode === 'overview' && (
        <Card
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 0 } }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>📅 Monthly P&amp;L Summary</span>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>{monthlySummary.length} months of data</Text>
            </div>
          }
        >
          <Table
            columns={monthlyCols}
            dataSource={[...monthlySummary].reverse()}
            rowKey="month"
            pagination={false}
            size="middle"
            loading={loading}
            rowClassName={(r) => bestMonth?.month === r.month ? 'best-month-row' : ''}
            style={{ borderRadius: 16, overflow: 'hidden' }}
            summary={pageData => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f8faff', fontWeight: 800 }}>
                  <Table.Summary.Cell index={0}><Text strong>TOTAL</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Badge count={filtered.length} style={{ backgroundColor: '#6366f1' }} />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong style={{ color: '#6366f1' }}>{formatCurrency(totalRevenue)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text style={{ color: '#f43f5e' }}>-{formatCurrency(totalDeductions)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text style={{ color: '#0ea5e9', fontWeight: 600 }}>{formatCurrency(totalNet)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text style={{ color: '#64748b' }}>-{formatCurrency(totalCost)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text strong style={{ fontSize: 16, color: totalProfit >= 0 ? '#10b981' : '#f43f5e' }}>
                      {formatCurrency(totalProfit)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <MarginBar value={parseFloat(avgMargin)} maxVal={50} />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>—</Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )}

      {/* ── Per-Order Breakdown Table ────────────────────────────────── */}
      {viewMode === 'orders' && (
        <Card
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 0 } }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>🧾 Per-Order Profit Breakdown</span>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>{filtered.length} orders</Text>
            </div>
          }
        >
          <Table
            columns={profitCols}
            dataSource={filtered}
            rowKey="id"
            scroll={{ x: 1300 }}
            size="middle"
            loading={loading}
            pagination={{ pageSize: 15, showTotal: t => `${t} orders`, showSizeChanger: false }}
            style={{ borderRadius: 16, overflow: 'hidden' }}
          />
        </Card>
      )}

      {/* Best month row highlight */}
      <style>{`
        .best-month-row td { background: linear-gradient(90deg, #fef9c3 0%, #fffbf0 100%) !important; }
        .best-month-row:hover td { background: #fef3c7 !important; }
      `}</style>
    </div>
  );
}
