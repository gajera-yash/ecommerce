import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Tag, Space, Input, Select, DatePicker, Card, Modal, Form,
  InputNumber, Drawer, Typography, message, Tooltip, Dropdown, Row, Col,
  Divider, Empty, Badge, Progress
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, DownOutlined, ReloadOutlined, FilterOutlined,
  ShoppingCartOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getOrders, createOrder, updateOrder, deleteOrder, bulkStatusUpdate, getProducts, getFeeRules, getCategories } from '../api';
import { formatCurrency, formatDate, deliveryStatusColors, paymentStatusColors } from '../utils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ── Status styling ────────────────────────────────────────────────────────
const STATUS_STYLE = {
  DELIVERED: { bg: '#d1fae5', color: '#059669', dot: '#10b981' },
  SHIPPED:   { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  PENDING:   { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  CANCELLED: { bg: '#fee2e2', color: '#dc2626', dot: '#f43f5e' },
  RETURNED:  { bg: '#ffedd5', color: '#c2410c', dot: '#f97316' },
};
const PAY_STYLE = {
  PAID:     { bg: '#d1fae5', color: '#059669' },
  PENDING:  { bg: '#fef3c7', color: '#d97706' },
  REFUNDED: { bg: '#fee2e2', color: '#dc2626' },
};

function StatusPill({ status, type = 'delivery' }) {
  const map = type === 'delivery' ? STATUS_STYLE : PAY_STYLE;
  const s = map[status] || {};
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {type === 'delivery' && s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />}
      {status}
    </span>
  );
}

// ── Profit Drawer row ─────────────────────────────────────────────────────
function ProfitRow({ label, value, color, bold, borderTop }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderTop: borderTop ? '1px dashed #e2e8f0' : 'none',
    }}>
      <Text style={{ color: '#64748b', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: color || '#0f172a', fontWeight: bold ? 800 : 600, fontSize: bold ? 16 : 13 }}>
        {value}
      </Text>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [filters, setFilters]         = useState({});
  const [sortBy, setSortBy]           = useState('order_date');
  const [sortOrder, setSortOrder]     = useState('DESC');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [products, setProducts]       = useState([]);
  const [feeRules, setFeeRules]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [form]                        = Form.useForm();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search, sort_by: sortBy, sort_order: sortOrder, ...filters };
      const { data } = await getOrders(params);
      setOrders(data.orders); setTotal(data.total);
    } catch { message.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, search, filters, sortBy, sortOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    getProducts().then(r => setProducts(r.data)).catch(() => {});
    getFeeRules().then(r => setFeeRules(r.data)).catch(() => {});
    getCategories({ type: 'PRODUCT' }).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await updateOrder(editing.id, values); message.success('Order updated'); }
      else { await createOrder(values); message.success('Order created'); }
      setModalOpen(false); setEditing(null); form.resetFields(); fetchOrders();
    } catch { message.error('Failed to save order'); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete this order?', content: 'This action cannot be undone.',
      okType: 'danger', okText: 'Delete',
      onOk: async () => { await deleteOrder(id); message.success('Order deleted'); fetchOrders(); },
    });
  };

  const handleBulkStatus = async (status, type) => {
    if (!selectedRowKeys.length) return message.warning('Select orders first');
    const payload = type === 'delivery'
      ? { ids: selectedRowKeys, delivery_status: status }
      : { ids: selectedRowKeys, payment_status: status };
    await bulkStatusUpdate(payload);
    message.success(`${selectedRowKeys.length} orders updated`);
    setSelectedRowKeys([]); fetchOrders();
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      sale_price: record.quantity > 0 ? record.sale_price / record.quantity : record.sale_price,
      my_cost_price: record.quantity > 0 ? record.my_cost_price / record.quantity : record.my_cost_price,
      order_date: dayjs(record.order_date),
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ platform: 'AMAZON', delivery_status: 'PENDING', payment_status: 'PENDING', quantity: 1, order_date: dayjs() });
    setModalOpen(true);
  };

  const handleProductSelect = (sku) => {
    const prod = products.find(p => p.sku === sku);
    if (prod) {
      form.setFieldsValue({ 
        product_name: prod.name, 
        product_sku: prod.sku, 
        category: prod.category, 
        my_cost_price: prod.cost_price, 
        packaging_cost: prod.packaging_charge || 0,
        sale_price: prod.mrp 
      });
      autoCalcFee();
    }
  };

  const autoCalcFee = () => {
    const vals = form.getFieldsValue();
    const tot = (vals.sale_price || 0) * (vals.quantity || 1);
    
    // Calculate GST based on product gst_rate if a product is selected (Inclusive of Sale Price)
    const prod = products.find(p => p.sku === vals.product_sku);
    if (prod && prod.gst_rate) {
      const rate = parseFloat(prod.gst_rate);
      const taxableValue = tot / (1 + (rate / 100));
      const gstAmt = tot - taxableValue;
      form.setFieldsValue({ gst_amount: parseFloat(gstAmt.toFixed(2)) });
    }

    const rule = feeRules.find(r => r.platform === vals.platform && r.category === vals.category);
    if (rule) {
      const fee = (tot * rule.fee_percentage / 100) + (rule.fixed_fee || 0);
      form.setFieldsValue({ platform_fee: parseFloat(fee.toFixed(2)) });
    }
  };

  // ── Quick stats ────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.sale_price) || 0), 0);
  const totalProfit  = orders.reduce((s, o) => s + (parseFloat(o.profit) || 0), 0);
  const pendingCount = orders.filter(o => o.delivery_status === 'PENDING').length;
  const deliveredCount = orders.filter(o => o.delivery_status === 'DELIVERED').length;

  const columns = [
    {
      title: 'Order ID', dataIndex: 'order_id', key: 'order_id', fixed: 'left', width: 130,
      render: (t, r) => (
        <a onClick={() => { setSelectedOrder(r); setDrawerOpen(true); }}
          style={{ fontWeight: 700, color: '#6366f1', fontSize: 13 }}>{t}</a>
      )
    },
    {
      title: 'Platform', dataIndex: 'platform', key: 'platform', width: 90,
      render: p => (
        <span style={{
          background: p === 'AMAZON' ? 'linear-gradient(135deg,#ff9900,#ffb347)' : 'linear-gradient(135deg,#2874f0,#5ba4f5)',
          color: p === 'AMAZON' ? '#7a3600' : '#fff',
          fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: 0.4,
        }}>{p === 'AMAZON' ? 'AMZ' : 'FLK'}</span>
      )
    },
    {
      title: 'Product', dataIndex: 'product_name', key: 'product_name', ellipsis: true, width: 180,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Qty: {r.quantity}</div>
        </div>
      )
    },
    {
      title: 'Sale Amount', dataIndex: 'sale_price', key: 'sale_price', width: 120, align: 'right', sorter: true,
      render: v => <Text style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Profit', dataIndex: 'profit', key: 'profit', width: 110, sorter: true, align: 'right',
      render: v => {
        const n = parseFloat(v) || 0;
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: n >= 0 ? '#d1fae5' : '#fee2e2',
            color: n >= 0 ? '#059669' : '#dc2626',
            fontWeight: 800, fontSize: 12, padding: '3px 9px', borderRadius: 20,
          }}>
            {n >= 0 ? <ArrowUpOutlined style={{ fontSize: 9 }} /> : <ArrowDownOutlined style={{ fontSize: 9 }} />}
            {formatCurrency(Math.abs(n))}
          </span>
        );
      }
    },
    {
      title: 'Margin', dataIndex: 'profit_margin', key: 'profit_margin', width: 90, align: 'center',
      render: v => {
        const n = parseFloat(v) || 0;
        return <span style={{ color: n >= 20 ? '#10b981' : n >= 0 ? '#f59e0b' : '#f43f5e', fontWeight: 700 }}>{n}%</span>;
      }
    },
    {
      title: 'Status', dataIndex: 'delivery_status', key: 'delivery_status', width: 120,
      render: s => <StatusPill status={s} type="delivery" />
    },
    {
      title: 'Payment', dataIndex: 'payment_status', key: 'payment_status', width: 100,
      render: s => <StatusPill status={s} type="payment" />
    },
    {
      title: 'Date', dataIndex: 'order_date', key: 'order_date', width: 100, sorter: true,
      render: v => <span style={{ fontSize: 12, color: '#64748b' }}>{formatDate(v)}</span>
    },
    {
      title: '', key: 'actions', fixed: 'right', width: 90,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="View">
            <Button size="small" type="text" icon={<EyeOutlined />}
              style={{ color: '#6366f1' }}
              onClick={() => { setSelectedOrder(r); setDrawerOpen(true); }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" type="text" icon={<EditOutlined />}
              style={{ color: '#f59e0b' }}
              onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button size="small" type="text" danger icon={<DeleteOutlined />}
              onClick={() => handleDelete(r.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination, _, sorter) => {
    setPage(pagination.current);
    if (sorter.field) { setSortBy(sorter.field); setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC'); }
  };

  const bulkMenuItems = [
    { key: 'shipped',   label: '📦 Mark Shipped',   onClick: () => handleBulkStatus('SHIPPED', 'delivery') },
    { key: 'delivered', label: '✅ Mark Delivered',  onClick: () => handleBulkStatus('DELIVERED', 'delivery') },
    { key: 'cancelled', label: '❌ Mark Cancelled',  onClick: () => handleBulkStatus('CANCELLED', 'delivery') },
    { type: 'divider' },
    { key: 'paid',      label: '💰 Mark Paid',       onClick: () => handleBulkStatus('PAID', 'payment') },
    { key: 'refunded',  label: '↩️ Mark Refunded',   onClick: () => handleBulkStatus('REFUNDED', 'payment') },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>🛒 Orders</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Manage and track all your platform orders</Text>
        </div>
        <Space wrap>
          {selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: bulkMenuItems }}>
              <Button style={{ borderColor: '#6366f1', color: '#6366f1', fontWeight: 700 }}>
                Bulk Update ({selectedRowKeys.length}) <DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchOrders} style={{ borderRadius: 8 }}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', fontWeight: 700 }}>
            Add Order
          </Button>
        </Space>
      </div>

      {/* ── Quick Stats ───────────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Page Revenue', value: formatCurrency(totalRevenue), icon: '💰', color: '#6366f1' },
          { label: 'Page Profit',  value: formatCurrency(totalProfit),  icon: '📈', color: '#10b981' },
          { label: 'Pending',      value: pendingCount,                 icon: '⏳', color: '#f59e0b' },
          { label: 'Delivered',    value: deliveredCount,               icon: '✅', color: '#10b981' },
        ].map((s, i) => (
          <Col xs={12} sm={6} key={i}>
            <div style={{
              background: '#fff', border: `1px solid ${s.color}22`,
              borderRadius: 14, padding: '14px 18px',
              boxShadow: `0 2px 8px ${s.color}10`,
            }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '14px 18px',
        marginBottom: 14, border: '1px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <Row gutter={[10, 10]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input placeholder="Search orders / product..." prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} allowClear
              style={{ borderRadius: 8 }} />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select placeholder="Platform" allowClear style={{ width: '100%', borderRadius: 8 }}
              onChange={v => { setFilters(f => ({ ...f, platform: v })); setPage(1); }}
              options={[{ value: 'AMAZON', label: '🟠 Amazon' }, { value: 'FLIPKART', label: '🔵 Flipkart' }]} />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select placeholder="Delivery" allowClear style={{ width: '100%' }}
              onChange={v => { setFilters(f => ({ ...f, delivery_status: v })); setPage(1); }}
              options={['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].map(s => ({ value: s, label: s }))} />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select placeholder="Payment" allowClear style={{ width: '100%' }}
              onChange={v => { setFilters(f => ({ ...f, payment_status: v })); setPage(1); }}
              options={['PAID', 'PENDING', 'REFUNDED'].map(s => ({ value: s, label: s }))} />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker style={{ width: '100%', borderRadius: 8 }}
              onChange={dates => {
                if (dates) setFilters(f => ({ ...f, from: dates[0].format('YYYY-MM-DD'), to: dates[1].format('YYYY-MM-DD') }));
                else setFilters(f => { const { from, to, ...rest } = f; return rest; });
                setPage(1);
              }} />
          </Col>
        </Row>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table
          columns={columns} dataSource={orders} rowKey="id" loading={loading}
          scroll={{ x: 1200 }}
          pagination={{ current: page, total, pageSize: 20, showSizeChanger: false, showTotal: t => `${t} orders`, style: { padding: '12px 16px' } }}
          onChange={handleTableChange}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          locale={{ emptyText: <Empty description="No orders found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          size="middle"
          rowClassName="order-row"
        />
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {editing ? '✏️ Edit Order' : '➕ Add New Order'}
          </div>
        }
        open={modalOpen} width={720}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null} destroyOnClose
        styles={{ content: { borderRadius: 16 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} requiredMark="optional">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
                <Select options={[{ value: 'AMAZON', label: '🟠 Amazon' }, { value: 'FLIPKART', label: '🔵 Flipkart' }]} onChange={autoCalcFee} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="order_id" label="Order ID" rules={[{ required: true }]}>
                <Input placeholder="AMZ-10001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="order_date" label="Order Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="product_sku" label="Product (SKU)">
                <Select placeholder="Select product" allowClear showSearch optionFilterProp="label"
                  onChange={handleProductSelect}
                  options={products.map(p => ({ value: p.sku, label: `${p.name} (${p.sku})` }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="product_name" label="Product Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="Category">
                <Select placeholder="Select category" allowClear>
                  {categories.map(c => (
                    <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} onChange={autoCalcFee} /></Form.Item></Col>
            <Col span={6}><Form.Item name="sale_price" label="Sale Price (unit)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} prefix="₹" onChange={autoCalcFee} /></Form.Item></Col>
            <Col span={6}><Form.Item name="my_cost_price" label="Cost Price (unit)"><InputNumber min={0} style={{ width: '100%' }} prefix="₹" /></Form.Item></Col>
            <Col span={6}><Form.Item name="packaging_cost" label="Packaging (unit)"><InputNumber min={0} style={{ width: '100%' }} prefix="₹" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="gst_amount" label="GST Amount (total)"><InputNumber min={0} style={{ width: '100%' }} prefix="₹" /></Form.Item></Col>
            <Col span={6}><Form.Item name="platform_fee" label="Platform Fee (total)"><InputNumber min={0} style={{ width: '100%' }} prefix="₹" /></Form.Item></Col>
            <Col span={6}><Form.Item name="shipping_fee" label="Shipping Fee"><InputNumber min={0} style={{ width: '100%' }} prefix="₹" /></Form.Item></Col>
            <Col span={6}><Form.Item name="other_deductions" label="Other Deductions"><InputNumber min={0} style={{ width: '100%' }} prefix="₹" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="delivery_status" label="Delivery Status"><Select options={['PENDING','SHIPPED','DELIVERED','CANCELLED','RETURNED'].map(s => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="payment_status" label="Payment Status"><Select options={['PAID','PENDING','REFUNDED'].map(s => ({ value: s, label: s }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="customer_name" label="Customer Name"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="customer_city" label="City"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="customer_state" label="State"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large"
              style={{ borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', fontWeight: 700 }}>
              {editing ? 'Update Order' : 'Create Order'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        title={<div style={{ fontWeight: 800, fontSize: 15 }}>📋 Order Details</div>}
        open={drawerOpen} onClose={() => setDrawerOpen(false)} width={480}
        styles={{ body: { padding: '20px 24px', background: '#fafbff' } }}
      >
        {selectedOrder && (
          <div>
            {/* Order ID banner */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 18, color: '#fff',
            }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>Order ID</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{selectedOrder.order_id}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <StatusPill status={selectedOrder.delivery_status} type="delivery" />
                <StatusPill status={selectedOrder.payment_status} type="payment" />
              </div>
            </div>

            {/* Product info */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #f1f5f9' }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Product</Text>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginTop: 4 }}>{selectedOrder.product_name}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div><Text style={{ fontSize: 11, color: '#94a3b8' }}>SKU</Text><div style={{ fontWeight: 600, fontSize: 13 }}>{selectedOrder.product_sku}</div></div>
                <div><Text style={{ fontSize: 11, color: '#94a3b8' }}>Category</Text><div style={{ fontWeight: 600, fontSize: 13 }}>{selectedOrder.category}</div></div>
                <div><Text style={{ fontSize: 11, color: '#94a3b8' }}>Qty</Text><div style={{ fontWeight: 600, fontSize: 13 }}>{selectedOrder.quantity}</div></div>
                <div><Text style={{ fontSize: 11, color: '#94a3b8' }}>Date</Text><div style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(selectedOrder.order_date)}</div></div>
              </div>
            </div>

            {/* Profit breakdown */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #f1f5f9' }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>💰 Profit Breakdown</Text>
              <ProfitRow label="Sale Price" value={formatCurrency(selectedOrder.sale_price)} />
              <ProfitRow label="(-) Platform Fee" value={formatCurrency(selectedOrder.platform_fee)} color="#f43f5e" />
              <ProfitRow label="(-) Shipping" value={formatCurrency(selectedOrder.shipping_fee)} color="#f43f5e" />
              <ProfitRow label="(-) Other Deductions" value={formatCurrency(selectedOrder.other_deductions)} color="#f43f5e" />
              <ProfitRow label="Net Received" value={formatCurrency(selectedOrder.net_amount_received)} color="#6366f1" borderTop />
              <ProfitRow label="(-) Cost Price" value={formatCurrency(selectedOrder.my_cost_price)} color="#f43f5e" />
              <ProfitRow label="(-) Packaging Cost" value={formatCurrency(selectedOrder.packaging_cost)} color="#f43f5e" />
              <ProfitRow label="(-) GST Amount" value={formatCurrency(selectedOrder.gst_amount)} color="#f43f5e" />
              <div style={{ background: parseFloat(selectedOrder.profit) >= 0 ? '#d1fae5' : '#fee2e2', borderRadius: 10, padding: '12px 16px', marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: 700, fontSize: 14, color: parseFloat(selectedOrder.profit) >= 0 ? '#059669' : '#dc2626' }}>Net Profit</Text>
                  <Text style={{ fontWeight: 900, fontSize: 18, color: parseFloat(selectedOrder.profit) >= 0 ? '#059669' : '#dc2626' }}>
                    {formatCurrency(selectedOrder.profit)} <span style={{ fontSize: 12 }}>({selectedOrder.profit_margin}%)</span>
                  </Text>
                </div>
              </div>
            </div>

            {/* Customer */}
            {(selectedOrder.customer_name || selectedOrder.customer_city) && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>👤 Customer</Text>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{selectedOrder.customer_name}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{[selectedOrder.customer_city, selectedOrder.customer_state].filter(Boolean).join(', ')}</div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <style>{`
        .order-row:hover td { background: #f8faff !important; }
      `}</style>
    </div>
  );
}
