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
  FileProtectOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SearchOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const LawyerLayout = () => {
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
        console.error("Lỗi parse user", e);
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
      onClick: () => navigate("/lawyer/profile"),
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
      key: "/lawyer/cases",
      icon: <FileProtectOutlined />,
      label: "Vụ việc phân công",
      onClick: () => navigate("/lawyer/cases"),
    },
    {
      key: "/lawyer/appointments",
      icon: <FileProtectOutlined />,
      label: "Lịch hẹn",
      onClick: () => navigate("/lawyer/appointments"),
    },
    {
      key: "/lawyer/profile",
      icon: <UserOutlined />,
      label: "Hồ sơ cá nhân",
      onClick: () => navigate("/lawyer/profile"),
    },
  ];
  console.log(user);
  if (!user) {
    return null;
  }
  return (
    <Layout className="min-h-screen bg-[#f0f2f5] overflow-hidden font-sans">
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
          background: "linear-gradient(195deg, #1a365d, #0f172a)", // Navy Gradient
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          zIndex: 50,
        }}
      >
        <div className="h-20 flex items-center justify-center border-b border-white/10 mb-4">
          <span className="text-white text-lg font-bold tracking-wider uppercase">
            {collapsed ? "LS" : "Lawyer Portal"}
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
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center gap-3">
              <Avatar src={user?.user_avatar} icon={<UserOutlined />} />
              <div className="overflow-hidden">
                <p className="text-white text-xs font-bold truncate">
                  {user?.user_fullName || "Luật sư"}
                </p>
                <p className="text-white/70 text-[10px] uppercase">
                  Luật sư Tranh tụng
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
          transition: "all 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Breadcrumb
              items={[{ title: "Lawyer" }, { title: "Dashboard" }]}
              className="font-medium"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1 border border-gray-200">
              <SearchOutlined className="text-gray-400" />
              <input
                className="ml-2 outline-none text-sm bg-transparent"
                placeholder="Tìm kiếm..."
              />
            </div>
            <Badge dot color="#1a365d">
              <Button type="text" shape="circle" icon={<BellOutlined />} />
            </Badge>
            <Dropdown menu={{ items: avatarItems }} placement="bottomRight">
              <Avatar
                style={{
                  backgroundColor: "#1a365d",
                  cursor: "pointer",
                  border: "2px solid #fff",
                }}
                src={
                  user.user_avatar
                    ? `http://127.0.0.1:8000${user.user_avatar}`
                    : null
                }
              >
                {user?.user_fullName?.charAt(0) || "L"}
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
export default LawyerLayout;
