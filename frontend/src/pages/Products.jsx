import { useState, useEffect } from 'react';
import {
  Table, Button, Card, Modal, Form, Input, InputNumber, Select,
  Space, Tag, Typography, message, Empty, Progress, Row, Col, Tooltip, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  WarningOutlined, AppstoreOutlined, SearchOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api';
import { formatCurrency } from '../utils';

const { Title, Text } = Typography;

// ── Category color map ────────────────────────────────────────────────────
const CAT_COLORS = {
  Electronics: { bg: '#ede9fe', color: '#7c3aed', dot: '#8b5cf6' },
  Accessories: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  Clothing:    { bg: '#fce7f3', color: '#be185d', dot: '#ec4899' },
  Default:     { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
};

function CatTag({ category }) {
  const s = CAT_COLORS[category] || CAT_COLORS.Default;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {category || '—'}
    </span>
  );
}

function StockBar({ qty, threshold }) {
  const isLow = qty <= threshold;
  const pct = Math.min(100, Math.round((qty / Math.max(threshold * 3, 1)) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <Progress
          percent={pct} size="small" showInfo={false}
          strokeColor={isLow ? '#f43f5e' : '#10b981'}
          trailColor="#f1f5f9"
        />
      </div>
      <span style={{
        fontWeight: 800, fontSize: 13, minWidth: 36,
        color: isLow ? '#f43f5e' : '#10b981',
      }}>{qty}</span>
      {isLow && (
        <Tooltip title={`Low stock! Threshold: ${threshold}`}>
          <WarningOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
        </Tooltip>
      )}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [categories, setCategories] = useState([]);
  const [form]                  = Form.useForm();

  useEffect(() => {
    getCategories({ type: 'PRODUCT' }).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try { const { data } = await getProducts(); setProducts(data); }
    catch { message.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await updateProduct(editing.id, values); message.success('Product updated'); }
      else { await createProduct(values); message.success('Product created'); }
      setModalOpen(false); setEditing(null); form.resetFields(); fetchProducts();
    } catch (err) { message.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete product?', okType: 'danger', okText: 'Delete',
      onOk: async () => { await deleteProduct(id); message.success('Deleted'); fetchProducts(); },
    });
  };

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Summary stats ──────────────────────────────────────────────────────
  const totalProducts  = products.length;
  const lowStockCount  = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10)).length;
  const totalStock     = products.reduce((s, p) => s + (p.stock_quantity || 0), 0);
  const avgMargin      = products.length > 0
    ? (products.reduce((s, p) => s + ((p.mrp - (parseFloat(p.cost_price||0) + parseFloat(p.packaging_charge||0))) / Math.max(p.mrp, 1) * 100), 0) / products.length).toFixed(1)
    : 0;

  const columns = [
    {
      title: 'Product', dataIndex: 'name', key: 'name',
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${(CAT_COLORS[r.category] || CAT_COLORS.Default).dot}22, ${(CAT_COLORS[r.category] || CAT_COLORS.Default).dot}11)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            📦
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{t}</div>
            <code style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{r.sku}</code>
          </div>
        </div>
      )
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: c => <CatTag category={c} />
    },
    {
      title: 'Cost Price', dataIndex: 'cost_price', key: 'cost_price', align: 'right',
      render: v => <Text style={{ color: '#f43f5e', fontWeight: 600 }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'MRP', dataIndex: 'mrp', key: 'mrp', align: 'right',
      render: v => <Text style={{ color: '#0f172a', fontWeight: 700 }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Margin', key: 'margin', align: 'center', width: 80,
      render: (_, r) => {
        const totalCost = parseFloat(r.cost_price || 0) + parseFloat(r.packaging_charge || 0);
        const m = r.mrp > 0 ? ((r.mrp - totalCost) / r.mrp * 100).toFixed(1) : 0;
        return <span style={{ fontWeight: 700, color: m >= 30 ? '#10b981' : m >= 15 ? '#f59e0b' : '#f43f5e' }}>{m}%</span>;
      }
    },
    {
      title: 'Stock Level', key: 'stock', width: 180,
      render: (_, r) => <StockBar qty={r.stock_quantity || 0} threshold={r.low_stock_threshold || 10} />
    },
    {
      title: '', key: 'actions', width: 80,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#f59e0b' }}
              onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }} />
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
          <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>📦 Product Catalog</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Manage your product inventory and pricing</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProducts} style={{ borderRadius: 8 }}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', fontWeight: 700 }}>
            Add Product
          </Button>
        </Space>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Total Products', value: totalProducts, icon: '📦', color: '#6366f1' },
          { label: 'Total Stock',    value: totalStock,    icon: '🗃️',  color: '#10b981' },
          { label: 'Low Stock',      value: lowStockCount, icon: '⚠️',  color: '#f59e0b' },
          { label: 'Avg Margin',     value: `${avgMargin}%`, icon: '📊', color: '#8b5cf6' },
        ].map((s, i) => (
          <Col xs={12} sm={6} key={i}>
            <div style={{
              background: '#fff', border: `1px solid ${s.color}20`, borderRadius: 14,
              padding: '14px 18px', boxShadow: `0 2px 8px ${s.color}10`,
            }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Search + Table ────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f8fafc' }}>
          <Input
            placeholder="Search by product name or SKU..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search} onChange={e => setSearch(e.target.value)} allowClear
            style={{ maxWidth: 340, borderRadius: 8 }}
          />
        </div>
        <Table
          columns={columns} dataSource={filtered} rowKey="id" loading={loading}
          locale={{ emptyText: <Empty description="No products yet" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          size="middle" pagination={{ pageSize: 12, showTotal: t => `${t} products` }}
          rowClassName="product-row"
        />
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────── */}
      <Modal
        title={<div style={{ fontWeight: 800, fontSize: 16 }}>{editing ? '✏️ Edit Product' : '➕ Add Product'}</div>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null} destroyOnClose
        styles={{ content: { borderRadius: 16 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input placeholder="Wireless Earbuds Pro" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sku" label="SKU Code" rules={[{ required: true }]}>
                <Input placeholder="WEP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select placeholder="Select category" allowClear>
                  {categories.map(c => (
                    <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="cost_price" label="Cost Price">
                <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="packaging_charge" label="Packaging (₹)">
                <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="gst_rate" label="GST Rate (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="mrp" label="MRP / Sale Price">
                <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="stock_quantity" label="Stock Qty">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="low_stock_threshold" label="Low Stock Alert Threshold">
            <InputNumber min={1} style={{ width: 160 }} placeholder="10" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Short product description..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large"
              style={{ borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', fontWeight: 700 }}>
              {editing ? 'Update Product' : 'Create Product'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .product-row:hover td { background: #f8faff !important; }
      `}</style>
    </div>
  );
}
