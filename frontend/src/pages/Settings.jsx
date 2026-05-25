import { useState, useEffect } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Button, Table, Typography,
  message, Modal, Space, Tag, Divider, Row, Col
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, SettingOutlined,
  SaveOutlined, SafetyCertificateOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { getFeeRules, createFeeRule, updateFeeRule, deleteFeeRule, getProfile, updateProfile, getCategories } from '../api';
import { useAuth } from '../store/AuthContext';

const { Title, Text } = Typography;

function ProfileTab() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  useEffect(() => {
    getProfile().then(r => form.setFieldsValue(r.data));
  }, [form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const { data } = await updateProfile(values);
      loginUser(data, localStorage.getItem('token'));
      message.success('Profile updated successfully');
    } catch { message.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Business Profile</Title>
        <Text style={{ color: '#64748b', fontSize: 13 }}>Update your company details and account settings</Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave} requiredMark="optional">
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <UserOutlined style={{ color: '#6366f1' }} />
                <Text strong>Personal Info</Text>
              </div>
              <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="password" label="New Password">
                <Input.Password size="large" placeholder="Leave blank to keep current" style={{ borderRadius: 8 }} />
              </Form.Item>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AppstoreOutlined style={{ color: '#10b981' }} />
                <Text strong>Business Preferences</Text>
              </div>
              <Form.Item name="business_name" label="Business Name">
                <Input size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="currency_symbol" label="Currency">
                    <Input size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="default_platform" label="Default Platform">
                    <Select size="large" style={{ width: '100%' }}
                      options={[{ value: 'AMAZON', label: 'Amazon' }, { value: 'FLIPKART', label: 'Flipkart' }]} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0 24px' }} />

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SaveOutlined />}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', fontWeight: 700, padding: '0 32px' }}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

function FeeRulesTab() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchRules = async () => {
    setLoading(true);
    try { const { data } = await getFeeRules(); setRules(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchRules(); 
    getCategories({ type: 'PRODUCT' }).then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await updateFeeRule(editing.id, values); message.success('Rule updated'); }
      else { await createFeeRule(values); message.success('Rule created'); }
      setModalOpen(false); setEditing(null); form.resetFields(); fetchRules();
    } catch { message.error('Failed to save rule'); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete this rule?', okType: 'danger', okText: 'Delete',
      onOk: async () => { await deleteFeeRule(id); message.success('Rule deleted'); fetchRules(); }
    });
  };

  const columns = [
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
    {
      title: 'Category', dataIndex: 'category',
      render: c => <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600 }}>{c}</Tag>
    },
    {
      title: 'Fee Percentage', dataIndex: 'fee_percentage', align: 'center',
      render: v => <span style={{ fontWeight: 700, color: '#f59e0b' }}>{v}%</span>
    },
    {
      title: 'Fixed Fee', dataIndex: 'fixed_fee', align: 'right',
      render: v => <span style={{ fontWeight: 700, color: '#f43f5e' }}>₹{v}</span>
    },
    {
      title: 'Effective From', dataIndex: 'effective_from',
      render: v => <span style={{ color: '#64748b', fontSize: 13 }}>{v?.split('T')[0]}</span>
    },
    {
      title: '', key: 'actions', width: 90,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#f59e0b' }}
            onClick={() => { setEditing(r); form.setFieldsValue({ ...r, effective_from: r.effective_from?.split('T')[0] }); setModalOpen(true); }} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={5} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Platform Fee Rules</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Configure automated fee calculations for orders</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}
          style={{ borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 700 }}>
          Add Rule
        </Button>
      </div>

      <div style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
        <Table columns={columns} dataSource={rules} rowKey="id" loading={loading} pagination={false} size="middle" rowClassName="settings-row" />
      </div>

      <Modal
        title={<div style={{ fontWeight: 800, fontSize: 16 }}>{editing ? '✏️ Edit Fee Rule' : '➕ Add Fee Rule'}</div>}
        open={modalOpen} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null} destroyOnClose styles={{ content: { borderRadius: 16 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
            <Select size="large" options={[{ value: 'AMAZON', label: '🟠 Amazon' }, { value: 'FLIPKART', label: '🔵 Flipkart' }]} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select size="large" placeholder="Select category" allowClear>
              {categories.map(c => (
                <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fee_percentage" label="Percentage Fee (%)">
                <InputNumber size="large" min={0} max={100} style={{ width: '100%' }} placeholder="15" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fixed_fee" label="Fixed Fee">
                <InputNumber size="large" min={0} prefix="₹" style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="effective_from" label="Effective From Date">
            <Input size="large" type="date" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large"
              style={{ borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 700 }}>
              {editing ? 'Update Rule' : 'Save Rule'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .settings-row:hover td { background: #f8faff !important; }
      `}</style>
    </>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
      background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
      color: active ? '#fff' : '#64748b',
      fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
      boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
      width: '100%', justifyContent: 'flex-start'
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{label}
    </button>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>⚙️ Settings</Title>
        <Text style={{ color: '#64748b', fontSize: 13 }}>Manage your account and system configurations</Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} md={6} lg={5}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <TabBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<SafetyCertificateOutlined />} label="Profile" />
            <TabBtn active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} icon={<SettingOutlined />} label="Fee Rules" />
          </div>
        </Col>

        <Col xs={24} md={18} lg={19}>
          <Card style={{ borderRadius: 16, border: '1px solid #f1f5f9', minHeight: 400 }}>
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'fees' && <FeeRulesTab />}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
