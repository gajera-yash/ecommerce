import { useState, useEffect } from 'react';
import {
  Table, Button, Card, Modal, Form, Input, InputNumber, DatePicker,
  Select, Space, Tag, Typography, message, Row, Col, Progress, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, WalletOutlined,
  ReloadOutlined, PieChartOutlined,
} from '@ant-design/icons';
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories } from '../api';
import { formatCurrency, formatDate } from '../utils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;



const CAT_COLORS_MAP = {
  Packaging:  '#6366f1', Shipping:  '#10b981', Marketing: '#f59e0b',
  Storage:    '#8b5cf6', Returns:   '#f43f5e', Software:  '#06b6d4',
  Travel:     '#f97316', Salary:    '#ec4899', General:   '#94a3b8',
};

const DarkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px' }}>
      <div style={{ color: payload[0]?.payload?.fill || '#fff', fontWeight: 700, fontSize: 13 }}>{payload[0]?.name}</div>
      <div style={{ color: '#fff', fontSize: 12 }}>{formatCurrency(payload[0]?.value)}</div>
    </div>
  );
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [filters, setFilters]   = useState({});
  const [categories, setCategories] = useState([]);
  const [form]                  = Form.useForm();

  const fetchExpenses = async () => {
    setLoading(true);
    try { const { data } = await getExpenses(filters); setExpenses(data); }
    catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchExpenses(); 
    getCategories({ type: 'EXPENSE' }).then(r => setCategories(r.data)).catch(() => {});
  }, [filters]);

  const handleSave = async (values) => {
    const payload = { ...values, expense_date: values.expense_date.format('YYYY-MM-DD') };
    try {
      if (editing) { await updateExpense(editing.id, payload); message.success('Updated'); }
      else { await createExpense(payload); message.success('Created'); }
      setModalOpen(false); setEditing(null); form.resetFields(); fetchExpenses();
    } catch { message.error('Failed'); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete expense?', okType: 'danger',
      onOk: async () => { await deleteExpense(id); message.success('Deleted'); fetchExpenses(); },
    });
  };

  // ── Metrics ───────────────────────────────────────────────────────────
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + parseFloat(e.amount || 0); });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value), fill: CAT_COLORS_MAP[name] || '#94a3b8' }));
  const topCat  = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const avgExp  = expenses.length > 0 ? (total / expenses.length).toFixed(0) : 0;

  const columns = [
    {
      title: 'Expense', dataIndex: 'title', key: 'title',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{t}</div>
          {r.notes && <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</div>}
        </div>
      )
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
      render: v => (
        <span style={{ fontWeight: 800, fontSize: 15, color: '#f43f5e' }}>
          {formatCurrency(v)}
        </span>
      )
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: c => {
        const color = CAT_COLORS_MAP[c] || '#94a3b8';
        return (
          <span style={{
            background: `${color}18`, color: color,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            {c}
          </span>
        );
      }
    },
    {
      title: 'Share', key: 'share', width: 120,
      render: (_, r) => {
        const pct = total > 0 ? parseFloat(((parseFloat(r.amount) / total) * 100).toFixed(1)) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={CAT_COLORS_MAP[r.category] || '#94a3b8'} trailColor="#f1f5f9" style={{ flex: 1 }} />
            <Text style={{ fontSize: 11, color: '#64748b', minWidth: 36 }}>{pct}%</Text>
          </div>
        );
      }
    },
    {
      title: 'Date', dataIndex: 'expense_date', key: 'expense_date', width: 110,
      render: v => <span style={{ fontSize: 12, color: '#64748b' }}>{formatDate(v)}</span>
    },
    {
      title: '', key: 'actions', width: 80,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#f59e0b' }}
              onClick={() => { setEditing(r); form.setFieldsValue({ ...r, expense_date: dayjs(r.expense_date) }); setModalOpen(true); }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button size="small" type="text" danger icon={<DeleteOutlined />}
              onClick={() => handleDelete(r.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>💸 Expenses Tracker</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Track and categorize all your business expenses</Text>
        </div>
        <Space wrap>
          <RangePicker style={{ borderRadius: 8 }}
            onChange={dates => {
              if (dates) setFilters({ from: dates[0].format('YYYY-MM-DD'), to: dates[1].format('YYYY-MM-DD') });
              else setFilters({});
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchExpenses} style={{ borderRadius: 8 }}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue({ expense_date: dayjs() }); setModalOpen(true); }}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg,#f43f5e,#f97316)', border: 'none', fontWeight: 700 }}>
            Add Expense
          </Button>
        </Space>
      </div>

      {/* ── KPI + Pie Row ─────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 18 }}>
        {/* KPI cards */}
        <Col xs={24} md={14}>
          <Row gutter={[12, 12]}>
            {[
              { label: 'Total Expenses', value: formatCurrency(total), icon: '💸', color: '#f43f5e', sub: `${expenses.length} entries` },
              { label: 'Avg per Entry',  value: formatCurrency(avgExp), icon: '📊', color: '#6366f1', sub: 'per expense' },
              { label: 'Top Category',   value: topCat?.[0] || '—',    icon: '🏆', color: '#f59e0b', sub: topCat ? formatCurrency(topCat[1]) : '' },
              { label: 'Categories',     value: Object.keys(catMap).length, icon: '🗂️', color: '#10b981', sub: 'tracked' },
            ].map((s, i) => (
              <Col xs={12} sm={12} key={i}>
                <div style={{
                  background: '#fff', border: `1px solid ${s.color}20`,
                  borderRadius: 14, padding: '16px 18px', height: '100%',
                  boxShadow: `0 2px 8px ${s.color}10`,
                }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginTop: 4, lineHeight: 1.2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  {s.sub && <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 1 }}>{s.sub}</div>}
                </div>
              </Col>
            ))}
          </Row>
        </Col>

        {/* Pie chart */}
        <Col xs={24} md={10}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px', border: '1px solid #f1f5f9', height: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
              <PieChartOutlined style={{ marginRight: 6, color: '#6366f1' }} />
              Category Breakdown
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={66}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <RTooltip content={<DarkTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No data yet</div>
            )}
          </div>
        </Col>
      </Row>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table
          columns={columns} dataSource={expenses} rowKey="id" loading={loading}
          size="middle"
          pagination={{ pageSize: 12, showTotal: t => `${t} expenses` }}
          rowClassName="expense-row"
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#fef2f2', fontWeight: 800 }}>
                <Table.Summary.Cell index={0}><Text strong>TOTAL</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ fontSize: 16, color: '#f43f5e' }}>{formatCurrency(total)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={4} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      <Modal
        title={<div style={{ fontWeight: 800, fontSize: 16 }}>{editing ? '✏️ Edit Expense' : '💸 Add Expense'}</div>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null} destroyOnClose
        styles={{ content: { borderRadius: 16 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Expense Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Packaging Material" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                <InputNumber min={0} prefix="₹" style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expense_date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="category" label="Category">
            <Select placeholder="Select category" allowClear>
              {categories.map(c => (
                <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large"
              style={{ borderRadius: 10, background: 'linear-gradient(135deg,#f43f5e,#f97316)', border: 'none', fontWeight: 700 }}>
              {editing ? 'Update Expense' : 'Add Expense'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .expense-row:hover td { background: #fff8f8 !important; }
      `}</style>
    </div>
  );
}
