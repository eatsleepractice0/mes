import { useMemo } from 'react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Layout, Menu, Typography } from 'antd';
import {
  ApartmentOutlined,
  BankOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined,
  ToolOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: 'company-structure',
    icon: <ApartmentOutlined />,
    label: '公司架构',
    children: [
      {
        key: '/company-structure/factories',
        icon: <BankOutlined />,
        label: <Link to="/company-structure/factories">工厂信息</Link>,
      },
      {
        key: '/company-structure/divisions',
        icon: <ClusterOutlined />,
        label: <Link to="/company-structure/divisions">生产部门</Link>,
      },
      {
        key: '/company-structure/production-lines',
        icon: <DeploymentUnitOutlined />,
        label: <Link to="/company-structure/production-lines">生产线</Link>,
      },
      {
        key: '/company-structure/workstation-types',
        icon: <ToolOutlined />,
        label: <Link to="/company-structure/workstation-types">工作站类型</Link>,
      },
      {
        key: '/company-structure/workstations',
        icon: <BuildOutlined />,
        label: <Link to="/company-structure/workstations">工作站</Link>,
      },
      {
        key: '/company-structure/subassemblies',
        icon: <ToolOutlined />,
        label: <Link to="/company-structure/subassemblies">部件信息</Link>,
      },
    ],
  },
];

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const selectedKeys = useMemo(() => {
    if (pathname.startsWith('/company-structure/')) {
      return [pathname];
    }
    return [];
  }, [pathname]);

  const openKeys = useMemo(() => {
    if (pathname.startsWith('/company-structure')) {
      return ['company-structure'];
    }
    return [];
  }, [pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', fontWeight: 600, fontSize: 16 }}>Qcadoo MES</div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            公司架构
          </Typography.Title>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
