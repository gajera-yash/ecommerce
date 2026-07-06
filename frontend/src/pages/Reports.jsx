import { useState, useEffect } from 'react';
import {
  Card, Table, Typography, DatePicker, Select, Row, Col,
  Tag, Button, Space, Skeleton, message, Progress, Tooltip,
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  DownloadOutlined, ShopOutlined, AppstoreOutlined,
  CalendarOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPlatformReport, getProductReport, getMonthlyPnl, getOverallSummary, exportCsv } from '../api';
import { formatCurrency } from '../utils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CHART_COLORS = {
  revenue: '#6366f1', profit: '#10b981', expenses: '#f43f5e',
  cost: '#f59e0b', deductions: '#f97316',
};

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 2 }}>
          <span style={{ color: p.color, fontSize: 12 }}>{p.name}</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
      color: active ? '#fff' : '#64748b',
      fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
      boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
    }}>
      <span>{icon}</span>{label}
    </button>
  );
}

export default function Reports() {
  const [dateRange, setDateRange] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [productData, setProductData]   = useState([]);
  const [pnlData, setPnlData]           = useState([]);
  const [summaryData, setSummaryData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [year, setYear]                 = useState(new Date().getFullYear());
  const [activeTab, setActiveTab]       = useState('summary');

  useEffect(() => {
    const params = {};
    if (dateRange.length === 2) { params.from = dateRange[0]; params.to = dateRange[1]; }
    setLoading(true);
    Promise.all([
      getPlatformReport(params),
      getProductReport(params),
      getMonthlyPnl({ year }),
      getOverallSummary(params)
    ]).then(([p, pr, pnl, summary]) => {
      setPlatformData(p.data || []);
      setProductData(pr.data || []);
      setPnlData(pnl.data || []);
      setSummaryData(summary.data || null);
    }).finally(() => setLoading(false));
  }, [dateRange, year]);

  const handleExport = async () => {
    try {
      const params = {};
      if (dateRange.length === 2) { params.from = dateRange[0]; params.to = dateRange[1]; }
      const res = await exportCsv(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'orders_export.csv'; a.click();
      message.success('CSV exported successfully');
    } catch { message.error('Export failed'); }
  };

  const presets = [
    { label: 'Today',      value: [dayjs(), dayjs()] },
    { label: 'Last 7 Days',value: [dayjs().subtract(7, 'day'), dayjs()] },
    { label: 'Last 30 Days',value: [dayjs().subtract(30, 'day'), dayjs()] },
    { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
    { label: 'This Year',  value: [dayjs().startOf('year'), dayjs()] },
  ];

  // ── Platform tab ──────────────────────────────────────────────────────
  const totalOrders  = platformData.reduce((s, p) => s + (parseInt(p.total_orders) || 0), 0);
  const totalRevenue = platformData.reduce((s, p) => s + (parseFloat(p.gross_revenue) || 0), 0);
  const totalProfit  = platformData.reduce((s, p) => s + (parseFloat(p.total_profit) || 0), 0);

  const platformCols = [
    {
      title: 'Platform', dataIndex: 'platform',
      render: p => (
        <span style={{
          background: p === 'AMAZON' ? 'linear-gradient(135deg,#ff9900,#ffb347)' : 'linear-gradient(135deg,#2874f0,#5ba4f5)',
          color: p === 'AMAZON' ? '#7a3600' : '#fff',
          fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
        }}>{p}</span>
      )
    },
    { title: 'Orders', dataIndex: 'total_orders', align: 'center',
      render: v => <span style={{ fontWeight: 700, color: '#6366f1' }}>{v}</span> },
    { title: 'Revenue', dataIndex: 'gross_revenue', align: 'right',
      render: v => <Text style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(v)}</Text> },
    { title: 'Profit', dataIndex: 'total_profit', align: 'right',
      render: v => <Text style={{ fontWeight: 800, color: v >= 0 ? '#10b981' : '#f43f5e' }}>{formatCurrency(v)}</Text> },
    { title: 'Avg Order', dataIndex: 'avg_order_value', align: 'right',
      render: v => formatCurrency(v) },
    { title: 'Share', key: 'share', width: 140,
      render: (_, r) => {
        const pct = totalRevenue > 0 ? parseFloat(((r.gross_revenue / totalRevenue) * 100).toFixed(1)) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={r.platform === 'AMAZON' ? '#ff9900' : '#2874f0'} trailColor="#f1f5f9" style={{ flex: 1 }} />
            <Text style={{ fontSize: 11, color: '#64748b', minWidth: 36 }}>{pct}%</Text>
          </div>
        );
      }
    },
  ];

  const productCols = [
    {
      title: 'Product', dataIndex: 'product_name', ellipsis: true,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{v}</div>
          <code style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{r.product_sku}</code>
        </div>
      )
    },
    { title: 'Category', dataIndex: 'category',
      render: c => <Tag color="blue" style={{ borderRadius: 20, fontSize: 11 }}>{c}</Tag> },
    { title: 'Orders', dataIndex: 'total_orders', align: 'center',
      render: v => <span style={{ fontWeight: 700, color: '#6366f1' }}>{v}</span> },
    { title: 'Units', dataIndex: 'total_qty', align: 'center',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Revenue', dataIndex: 'gross_revenue', align: 'right',
      render: v => <Text style={{ fontWeight: 700 }}>{formatCurrency(v)}</Text> },
    { title: 'Profit', dataIndex: 'total_profit', align: 'right',
      render: v => <Text style={{ fontWeight: 800, color: v >= 0 ? '#10b981' : '#f43f5e' }}>
        {v >= 0 ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
        {formatCurrency(Math.abs(v))}
      </Text>
    },
  ];

  const pnlCols = [
    { title: 'Month', dataIndex: 'month', render: v => <Text strong style={{ color: '#0f172a' }}>{v}</Text> },
    { title: 'Orders', dataIndex: 'total_orders', align: 'center' },
    { title: 'Gross Revenue', dataIndex: 'gross_revenue', align: 'right',
      render: v => <Text style={{ color: '#6366f1', fontWeight: 600 }}>{formatCurrency(v)}</Text> },
    { title: 'Deductions', dataIndex: 'total_deductions', align: 'right',
      render: v => <Text style={{ color: '#f43f5e' }}>-{formatCurrency(v)}</Text> },
    { title: 'Net Revenue', dataIndex: 'net_revenue', align: 'right',
      render: v => <Text style={{ color: '#0ea5e9', fontWeight: 600 }}>{formatCurrency(v)}</Text> },
    { title: 'COGS', dataIndex: 'total_cost', align: 'right',
      render: v => <Text style={{ color: '#64748b' }}>{formatCurrency(v)}</Text> },
    { title: 'Expenses', dataIndex: 'expenses', align: 'right',
      render: v => <Text style={{ color: '#f43f5e' }}>-{formatCurrency(v)}</Text> },
    { title: 'Final Profit', dataIndex: 'final_profit', align: 'right',
      render: v => <Text strong style={{ fontSize: 14, color: v >= 0 ? '#10b981' : '#f43f5e' }}>{formatCurrency(v)}</Text> },
    { title: 'Margin', dataIndex: 'margin', align: 'center',
      render: v => {
        const n = parseFloat(v) || 0;
        return <span style={{ fontWeight: 700, color: n >= 20 ? '#10b981' : n >= 0 ? '#f59e0b' : '#f43f5e' }}>{n}%</span>;
      }
    },
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 12 }} />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>📊 Reports &amp; Analytics</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Deep-dive into platform, product and monthly performance</Text>
        </div>
        <Space wrap>
          <RangePicker presets={presets} style={{ borderRadius: 8 }}
            onChange={dates => {
              if (dates) setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              else setDateRange([]);
            }}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}
            style={{ borderRadius: 8, borderColor: '#10b981', color: '#10b981', fontWeight: 700 }}>
            Export CSV
          </Button>
        </Space>
      </div>

      {/* ── Tab Switcher ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <TabBtn active={activeTab === 'summary'}  onClick={() => setActiveTab('summary')}  icon="📑" label="Overall Summary" />
        <TabBtn active={activeTab === 'platform'} onClick={() => setActiveTab('platform')} icon="🛒" label="Platform-wise" />
        <TabBtn active={activeTab === 'product'}  onClick={() => setActiveTab('product')}  icon="📦" label="Product-wise" />
        <TabBtn active={activeTab === 'pnl'}      onClick={() => setActiveTab('pnl')}      icon="📅" label="Monthly P&L" />
      </div>

      {/* ── Summary Tab ───────────────────────────────────────────── */}
      {activeTab === 'summary' && summaryData && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Gross Revenue</Text>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#6366f1', marginTop: 8 }}>{formatCurrency(summaryData.gross_revenue)}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Order Profit</Text>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0ea5e9', marginTop: 8 }}>{formatCurrency(summaryData.order_profit)}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Total Expenses</Text>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f43f5e', marginTop: 8 }}>{formatCurrency(summaryData.expenses)}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Net Profit</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>{formatCurrency(summaryData.final_net_profit)}</div>
              </div>
            </Col>
          </Row>
          <div style={{ marginTop: 24, padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <Title level={5} style={{ marginTop: 0 }}>Calculation Breakdown</Title>
            <Text style={{ display: 'block', color: '#64748b', marginBottom: 8 }}>The Net Profit is calculated as:</Text>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 14 }}>
              <strong>Net Profit</strong> = Order Profit ({formatCurrency(summaryData.order_profit)}) - Total Expenses ({formatCurrency(summaryData.expenses)})
            </div>
            <Text style={{ display: 'block', color: '#64748b', marginTop: 12, fontSize: 13 }}>
              <em>* Order Profit already deducts product cost, packaging, GST, and platform fees.</em>
            </Text>
          </div>
        </div>
      )}

      {/* ── Platform Tab ──────────────────────────────────────────── */}
      {activeTab === 'platform' && (
        <>
          {/* Platform KPI cards */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {platformData.map(p => (
              <Col xs={24} sm={12} key={p.platform}>
                <div style={{
                  background: '#fff',
                  border: `1px solid ${p.platform === 'AMAZON' ? '#ff990033' : '#2874f033'}`,
                  borderRadius: 16, padding: '18px 22px',
                  boxShadow: `0 2px 12px ${p.platform === 'AMAZON' ? '#ff990015' : '#2874f015'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{
                      background: p.platform === 'AMAZON' ? 'linear-gradient(135deg,#ff9900,#ffb347)' : 'linear-gradient(135deg,#2874f0,#5ba4f5)',
                      color: p.platform === 'AMAZON' ? '#7a3600' : '#fff',
                      fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                    }}>{p.platform}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{p.total_orders} orders</span>
                  </div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Revenue</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{formatCurrency(p.gross_revenue)}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Profit</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: p.total_profit >= 0 ? '#10b981' : '#f43f5e' }}>{formatCurrency(p.total_profit)}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Avg Order</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>{formatCurrency(p.avg_order_value)}</div>
                    </Col>
                  </Row>
                </div>
              </Col>
            ))}
          </Row>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
            <Table columns={platformCols} dataSource={platformData} rowKey="platform" pagination={false} size="middle" />
          </div>
        </>
      )}

      {/* ── Product Tab ───────────────────────────────────────────── */}
      {activeTab === 'product' && (
        <>
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>📊 Top Products by Revenue &amp; Profit</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productData.slice(0, 10)} margin={{ top: 5, right: 5, left: 0, bottom: 30 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="product_name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <RTooltip content={<DarkTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="gross_revenue" name="Revenue" fill={CHART_COLORS.revenue} radius={[5,5,0,0]} />
                <Bar dataKey="total_profit"  name="Profit"  fill={CHART_COLORS.profit}  radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
            <Table columns={productCols} dataSource={productData} rowKey="product_sku" size="middle"
              pagination={{ pageSize: 10, showTotal: t => `${t} products` }} />
          </div>
        </>
      )}

      {/* ── Monthly P&L Tab ───────────────────────────────────────── */}
      {activeTab === 'pnl' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Text style={{ fontWeight: 700, color: '#64748b' }}>Year:</Text>
            <Select value={year} onChange={setYear} style={{ width: 110 }}
              options={[2024,2025,2026,2027].map(y => ({ value: y, label: y }))} />
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>📅 Monthly Revenue, Profit &amp; Expenses</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pnlData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <RTooltip content={<DarkTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="gross_revenue"  name="Revenue"  fill={CHART_COLORS.revenue}  radius={[5,5,0,0]} />
                <Bar dataKey="final_profit"   name="Profit"   fill={CHART_COLORS.profit}   radius={[5,5,0,0]} />
                <Bar dataKey="expenses"       name="Expenses" fill={CHART_COLORS.expenses}  radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
            <Table columns={pnlCols} dataSource={pnlData} rowKey="month" pagination={false} size="middle" />
          </div>
        </>
      )}
    </div>
  );
}
