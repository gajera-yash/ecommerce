import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Typography, Space, message, Tag, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';

const { Title, Text } = Typography;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeType, setActiveType] = useState('PRODUCT');
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories({ type: activeType });
      setCategories(data);
    } catch {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeType]);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await updateCategory(editing.id, values);
        message.success('Category updated');
      } else {
        await createCategory(values);
        message.success('Category created');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchCategories();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete this category?',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCategory(id);
          message.success('Category deleted');
          fetchCategories();
        } catch {
          message.error('Failed to delete category');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (t) => <Text style={{ fontWeight: 600, color: '#0f172a' }}>{t}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t) => (
        <Tag color={t === 'PRODUCT' ? 'blue' : 'orange'} style={{ borderRadius: 12, fontWeight: 600 }}>
          {t}
        </Tag>
      )
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#f59e0b' }}
            onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>🗂️ Categories</Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Manage categories for your products and expenses</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories} style={{ borderRadius: 8 }}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue({ type: activeType }); setModalOpen(true); }}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', fontWeight: 700 }}>
            Add Category
          </Button>
        </Space>
      </div>

      {/* Tabs / Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button
          type={activeType === 'PRODUCT' ? 'primary' : 'default'}
          onClick={() => setActiveType('PRODUCT')}
          style={{ borderRadius: 8, fontWeight: 600, background: activeType === 'PRODUCT' ? '#1e293b' : '' }}
        >
          Product Categories
        </Button>
        <Button
          type={activeType === 'EXPENSE' ? 'primary' : 'default'}
          onClick={() => setActiveType('EXPENSE')}
          style={{ borderRadius: 8, fontWeight: 600, background: activeType === 'EXPENSE' ? '#1e293b' : '' }}
        >
          Expense Categories
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
          rowClassName="category-row"
        />
      </div>

      {/* Modal */}
      <Modal
        title={<div style={{ fontWeight: 800, fontSize: 16 }}>{editing ? '✏️ Edit Category' : '➕ Add Category'}</div>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null}
        destroyOnClose
        styles={{ content: { borderRadius: 16 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Category Name" rules={[{ required: true, message: 'Please enter category name' }]}>
            <Input size="large" placeholder="e.g. Electronics" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="type" label="Category Type" rules={[{ required: true }]}>
            <Select size="large" style={{ borderRadius: 8 }}>
              <Select.Option value="PRODUCT">Product</Select.Option>
              <Select.Option value="EXPENSE">Expense</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large"
              style={{ borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', fontWeight: 700 }}>
              {editing ? 'Update Category' : 'Save Category'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .category-row:hover td { background: #f8faff !important; }
      `}</style>
    </div>
  );
}
