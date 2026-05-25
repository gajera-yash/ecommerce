import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, ConfigProvider, theme } from 'antd';
import {
  DashboardOutlined, ShoppingCartOutlined, AppstoreOutlined,
  DollarOutlined, BarChartOutlined, WalletOutlined, SettingOutlined,
  LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Revenue from './pages/Revenue';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Categories from './pages/Categories';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Orders' },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
    { key: '/revenue', icon: <DollarOutlined />, label: 'Revenue' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/expenses', icon: <WalletOutlined />, label: 'Expenses' },
    { key: '/categories', icon: <AppstoreOutlined />, label: 'Categories' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const userMenuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: () => { logout(); navigate('/login'); } },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null} collapsible collapsed={collapsed} width={240}
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #001d3d 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 10, padding: '0 16px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1677ff, #4096ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', fontWeight: 700, flexShrink: 0,
          }}>S</div>
          {!collapsed && (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.business_name || 'Seller Hub'}
            </Text>
          )}
        </div>
        <Menu
          mode="inline" theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px', background: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 99,
        }}>
          <div style={{ cursor: 'pointer', fontSize: 18, color: '#666' }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />} />
              <Text strong>{user?.name}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/products" element={<Products />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
        components: {
          Table: { headerBg: '#fafafa', borderRadius: 8 },
          Card: { borderRadiusLG: 12 },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
