import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { login as loginApi } from '../api';
import { useAuth } from '../store/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await loginApi(values);
      loginUser(data.user, data.token);
      message.success('Welcome back!');
      navigate('/');
    } catch {
      message.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d2137 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22,119,255,0.15) 0%, transparent 70%)',
        top: -100, right: -100, animation: 'pulse 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(82,196,26,0.1) 0%, transparent 70%)',
        bottom: -50, left: -50, animation: 'pulse 5s ease-in-out infinite reverse',
      }} />
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}
        bordered={false}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #1677ff, #4096ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(22,119,255,0.3)',
            }}>
              <ShopOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>Seller Dashboard</Title>
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Order & Revenue Management</Text>
          </div>
          <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
            <Form.Item name="email" rules={[{ required: true, message: 'Email required' }]}>
              <Input prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Email" 
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 10 }} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Password"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 10 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}
                style={{ height: 48, borderRadius: 10, fontWeight: 600, fontSize: 16,
                  background: 'linear-gradient(135deg, #1677ff, #4096ff)',
                  boxShadow: '0 8px 24px rgba(22,119,255,0.35)' }}>
                Sign In
              </Button>
            </Form.Item>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Demo: admin@business.com / Admin@123
            </Text>
          </Form>
        </Space>
      </Card>
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
        .ant-input, .ant-input-password .ant-input { color: #fff !important; }
        .ant-input::placeholder { color: rgba(255,255,255,0.3) !important; }
        .ant-input-password .anticon { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}
