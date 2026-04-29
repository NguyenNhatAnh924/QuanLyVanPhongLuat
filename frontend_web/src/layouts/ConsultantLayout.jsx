import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Badge,
  Breadcrumb,
  Dropdown,
} from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FileTextOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  CalendarOutlined,
  CustomerServiceOutlined
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const ConsultantLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Lỗi parse", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const avatarItems = [
    {
      key: "1",
      label: "Hồ sơ cá nhân",
      icon: <UserOutlined />,
      onClick: () => navigate("/consultant/profile"),
    },
    { type: "divider" },
    {
      key: "2",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const menuItems = [
    {
      key: "/consultant/requests",
      icon: <FileTextOutlined />,
      label: "Quản lý Yêu cầu",
      onClick: () => navigate("/consultant/requests"),
    },
    {
      key: "/consultant/appoiment",
      icon: <CalendarOutlined />,
      label: "Lịch hẹn",
      onClick: () => navigate("/consultant/appoiment"),
    },
    {
      key: "/consultant/customer-care",
      icon: <CustomerServiceOutlined/>,
      label: "Chăm sốc khách hàng",
      onClick: () => navigate("/consultant/customer-care"),
    },
    {
      key: "/consultant/profile",
      icon: <UserOutlined />,
      label: "Hồ sơ cá nhân",
      onClick: () => navigate("/consultant/profile"),
    },
  ];

  return (
    <Layout className="min-h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          overflow: "auto",
          height: "calc(100vh - 32px)",
          position: "fixed",
          left: 16,
          top: 16,
          bottom: 16,
          borderRadius: "16px",
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          zIndex: 50,
        }}
      >
        <div className="h-20 flex items-center justify-center border-b border-white/5 mb-4">
          <span className="text-white text-lg font-bold tracking-wider uppercase">
            {collapsed ? "CS" : "Consultant Portal"}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ background: "transparent", border: "none" }}
          items={menuItems}
        />
        {!collapsed && (
          <div className="absolute bottom-6 left-4 right-4 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.user_avatar}
                icon={<UserOutlined />}
                className="bg-slate-500"
              />
              <div className="overflow-hidden">
                <p className="text-white text-xs font-bold truncate">
                  {user?.user_fullName || "Tư vấn"}
                </p>
                <p className="text-white/50 text-[10px] uppercase">
                  Phòng Pháp chế
                </p>
              </div>
            </div>
          </div>
        )}
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 100 : 292,
          marginRight: 16,
          marginTop: 16,
          marginBottom: 16,
          background: "transparent",
          transition: "all 0.3s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-600"
            />
            <Breadcrumb
              items={[{ title: "Consultant" }, { title: "Requests" }]}
              className="font-medium text-slate-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <Badge dot color="#334155">
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined className="text-slate-600" />}
              />
            </Badge>
            <Dropdown menu={{ items: avatarItems }} placement="bottomRight">
              <Avatar
                style={{
                  backgroundColor: "#1e293b",
                  cursor: "pointer",
                  border: "2px solid #fff",
                }}
                src={
                  user?.user_avatar
                    ? `http://127.0.0.1:8000${user.user_avatar}`
                    : null
                }
              >
                {user?.user_fullName?.charAt(0) || "C"}
              </Avatar>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ marginTop: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
export default ConsultantLayout;
