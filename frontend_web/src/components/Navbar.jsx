import React, { useEffect, useState } from "react";
import { Button, Avatar, Badge, Spin, Dropdown, message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ProfileOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import authService from "../services/authService";

const Navbar = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await authService.islogin();
        setUser(userData);
      } catch (error) {
        console.log("Lỗi token:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    navigate("/login");
    message.success("Đã đăng xuất thành công!");
  };

  const handleNavigateDashboard = () => {
    if (!user) return;

    if (user.user_role === 4) {
      navigate("/admin");
    } else if (user.user_role === 3) {
      navigate("/lawyer");
    } else if (user.user_role === 2) {
      navigate("/assistant");
    } else if (user.user_role === 1) {
      navigate("/consultant");
    } else if (user.user_role === 0) {
      navigate("/my-account");
    } else {
      message.warning("Tài khoản chưa được phân quyền!");
    }
  };

  const userMenuItems = [
    {
      key: "dashboard",
      label: user?.user_role === 0 ? "Yêu cầu của tôi" : "Trang quản trị",
      icon:
        user?.user_role === 0 ? <FileTextOutlined /> : <DashboardOutlined />,
      onClick: handleNavigateDashboard,
    },
    ...(user?.user_role === 0
      ? [
          {
            key: "profile",
            label: "Hồ sơ cá nhân",
            icon: <ProfileOutlined />,
            onClick: () => navigate("/profile"),
          },
        ]
      : []),
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm px-6 py-4 flex justify-between items-center transition-all">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          LS
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-wide">
          LUATSU <span className="text-blue-600">ONLINE</span>
        </span>
      </div>

      <div className="hidden md:flex gap-8 text-blue-500 font-medium">
        <span
          onClick={() => navigate("/")}
          className="cursor-pointer hover:text-blue-900 transition-colors"
        >
          Trang chủ
        </span>
        <a href="#services" className="hover:text-blue-900 transition-colors">
          Dịch vụ
        </a>
        <a href="#lawyers" className="hover:text-blue-900 transition-colors">
          Đội ngũ
        </a>
        <a href="#contact" className="hover:text-blue-900 transition-colors">
          Liên hệ
        </a>
      </div>

      {loading ? (
        <div className="w-24 flex justify-center">
          <Spin size="small" />
        </div>
      ) : !user ? (
        <div className="flex gap-3">
          <Button type="text" onClick={() => navigate("/login")}>
            Đăng nhập
          </Button>
          <Button
            type="primary"
            onClick={() => navigate("/register")}
            className="bg-blue-900 rounded-full px-6"
          >
            Đăng ký ngay
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Button type="text" shape="circle" icon={<SearchOutlined />} />
            <Badge count={2} size="small">
              <Button type="text" shape="circle" icon={<BellOutlined />} />
            </Badge>
          </div>

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 p-1 rounded-full transition-all pr-3">
              <Avatar
                size="large"
                src={
                  user.user_avatar
                    ? `http://127.0.0.1:8000${user.user_avatar}`
                    : null
                }
                style={{ backgroundColor: "#f56a00" }}
                icon={<UserOutlined />}
              >
                {user.user_name ? user.user_name[0].toUpperCase() : "U"}
              </Avatar>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-bold text-gray-700 leading-tight">
                  {user.user_fullName || user.user_name}
                </span>
                <span className="text-[10px] text-gray-500 uppercase">
                  {user.user_role === 0 ? "Khách hàng" : "Thành viên"}
                </span>
              </div>
            </div>
          </Dropdown>
        </div>
      )}
    </nav>
  );
};

export default Navbar;