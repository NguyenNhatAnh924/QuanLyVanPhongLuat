import React, { useEffect, useState, useMemo } from "react";
import {
  ReloadOutlined,
  FileProtectOutlined,
  TeamOutlined,
  TransactionOutlined,
  FolderOpenOutlined,
  UserOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  Tag,
  Spin,
  Progress,
  Avatar,
  Modal,
  Space,
  Descriptions,
  Divider,
  Timeline,
  Typography,
} from "antd";
import dashboardService from "../services/dashBoardService";
import legalCaseService from "../services/legalCaseService";

const { Text } = Typography;

// --- CONFIG & COLORS ---
const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const STATUS_CONFIG = {
  PROCESSING: { label: "Đang xử lý", color: "blue" },
  CONFIRMED: { label: "Xác nhận", color: "cyan" },
  LIQUIDATED: { label: "Hoàn thành", color: "green" },
  CANCELLED: { label: "Đã hủy", color: "red" },
  REJECTED: { label: "Từ chối", color: "volcano" },
};

const GOAL_CONFIG = {
  0: { label: "Chưa xác định", color: "default", icon: <InfoCircleOutlined /> },
  1: {
    label: "Đạt mong muốn",
    color: "success",
    icon: <FileProtectOutlined />,
  },
  2: {
    label: "Không đạt mục tiêu",
    color: "error",
    icon: <InfoCircleOutlined />,
  },
};

// --- CUSTOM TOOLTIP ---
const CombinedTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-lg">
        <p className="font-bold text-gray-700 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="m-0 text-xs font-medium"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}{" "}
            {entry.name.includes("Doanh thu") ? "đ" : "hồ sơ"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [data, setData] = useState({
    overview: {},
    casesMonth: [],
    contractsMonth: [],
    revenueMonth: [],
    serviceStats: [], // Mới
    contracts: [],
    staffPerformance: [],
    caseProgress: [],
    detelCase: [],
    loading: true,
  });

  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }));
      const [ov, cm, ctm, ct, sp, cp, rm, lc, ss] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getCasesByMonth(),
        dashboardService.getContractsByMonth(),
        dashboardService.getContracts(),
        dashboardService.getStaffPerformance(),
        dashboardService.getCaseProgress(),
        dashboardService.getRevenueByMonth(),
        legalCaseService.list_legaCase(),
        dashboardService.getServiceUsageStats(), // Gọi API mới
      ]);
  
      setData({
        overview: ov,
        casesMonth: cm,
        contractsMonth: ctm,
        contracts: ct,
        staffPerformance: sp,
        caseProgress: cp,
        revenueMonth: rm,
        detelCase: lc,
        serviceStats: ss, 
        loading: false,
      });
    } catch (err) {
      console.error("Lỗi Dashboard:", err);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleShowDetail = (caseId) => {
    const detail = data.detelCase.find((item) => item.id === caseId);
    if (detail) {
      setSelectedCase(detail);
      setIsModalOpen(true);
    }
  };

  const caseContractData = useMemo(() => {
    const map = {};
    (data.casesMonth || []).forEach((item) => {
      if (!item.month) return;
      map[item.month] = {
        month: item.month,
        cases: item.total || 0,
        contracts: 0,
      };
    });
    (data.contractsMonth || []).forEach((item) => {
      if (!item.month) return;
      if (!map[item.month])
        map[item.month] = { month: item.month, cases: 0, contracts: 0 };
      map[item.month].contracts = item.total || 0;
    });
    return Object.values(map).sort((a, b) => {
      const [mA, yA] = a.month.split("/");
      const [mB, yB] = b.month.split("/");
      return yA !== yB
        ? parseInt(yA) - parseInt(yB)
        : parseInt(mA) - parseInt(mB);
    });
  }, [data.casesMonth, data.contractsMonth]);

  if (data.loading)
    return <Spin size="large" tip="Đang tải dữ liệu..." fullscreen />;

console.log("Dữ liệu hiệu suất nhân viên:", data.staffPerformance);
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hệ Thống Phân Tích Dữ Liệu
          </h1>
          <p className="text-gray-500 text-sm">
            Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN")}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
        >
          <ReloadOutlined /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tổng Vụ Việc"
          value={data.overview?.total_cases}
          color="blue"
          icon={<FolderOpenOutlined />}
        />
        <StatCard
          title="Tổng Hợp Đồng"
          value={data.overview?.total_contracts}
          color="purple"
          icon={<FileProtectOutlined />}
        />
        <StatCard
          title="Doanh Thu"
          value={`${(data.overview?.total_revenue || 0).toLocaleString()}đ`}
          color="green"
          icon={<TransactionOutlined />}
        />
        <StatCard
          title="Nhân Sự"
          value={data.overview?.total_staff}
          color="gold"
          icon={<TeamOutlined />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <ChartBox title="Biến động Doanh thu & Hồ sơ mới">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={caseContractData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<CombinedTooltip />} />
                <Legend />
                <Bar
                  dataKey="cases"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                  name="Vụ việc mới"
                />
                <Line
                  type="monotone"
                  dataKey="contracts"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Hợp đồng ký"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        <ChartBox title="Cơ cấu Gói dịch vụ">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data.serviceStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                label
              >
                {data.serviceStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                layout="horizontal"
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <FileProtectOutlined className="text-purple-500" /> Hợp đồng gần đây
          </h3>
          <Table
            dataSource={data.contracts?.slice(0, 5)}
            rowKey="contract_number"
            pagination={false}
            size="middle"
            columns={[
              {
                title: "Mã HĐ",
                dataIndex: "contract_number",
                key: "contract_number",
              },
              {
                title: "Vụ việc",
                dataIndex: "case_title",
                key: "case_title",
                ellipsis: true,
              },
              {
                title: "Giá trị",
                dataIndex: "total_value",
                render: (v) => (
                  <span className="font-bold text-green-600">
                    {v?.toLocaleString()}đ
                  </span>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                render: (s) => (
                  <Tag color={STATUS_CONFIG[s]?.color}>
                    {STATUS_CONFIG[s]?.label || s}
                  </Tag>
                ),
              },
            ]}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircleOutlined className="text-green-500" /> Chỉ số thành công
            theo nhân sự
          </h3>
          <div className="space-y-4">
            {data.staffPerformance?.map((staff) => (
              <div
                key={staff.staff_id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      className={
                        staff.role === "Luật sư" ? "bg-blue-500" : "bg-cyan-500"
                      }
                    />
                    <div>
                      <p className="font-bold text-sm m-0">{staff.name}</p>
                      <div className="flex items-center gap-2">
                        <Tag
                          color={staff.role === "Luật sư" ? "blue" : "cyan"}
                          className="text-[9px] m-0 leading-none py-0.5 px-1"
                        >
                          {staff.role}
                        </Tag>
                        <span className="text-[10px] text-gray-400">
                          {staff.successful_cases}/{staff.total_cases} vụ thành
                          công
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Text strong className="text-blue-600 text-sm">
                      {staff.completion_rate}%
                    </Text>
                  </div>
                </div>
                <Progress
                  percent={staff.completion_rate}
                  strokeColor={{ "0%": "#3b82f6", "100%": "#10b981" }}
                  showInfo={false}
                  size="small"
                  className="m-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
          <ClockCircleOutlined className="text-blue-500" /> Tiến độ hồ sơ đang
          thụ lý
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.caseProgress?.slice(0, 6).map((item) => (
            <div
              key={item.case_id}
              className="p-5 border border-gray-100 rounded-2xl hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <Text strong className="w-40 truncate" title={item.title}>
                  {item.title}
                </Text>
                <Tag color={STATUS_CONFIG[item.status]?.color}>
                  {STATUS_CONFIG[item.status]?.label}
                </Tag>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Hoàn thành</span>
                  <span className="font-bold">{item.progress}%</span>
                </div>
                <Progress
                  percent={item.progress}
                  size="small"
                  strokeColor="#3b82f6"
                />
              </div>
              <button
                onClick={() => handleShowDetail(item.case_id)}
                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
              >
                CHI TIẾT HỒ SƠ
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title={
          <Space className="text-blue-800">
            <FolderOpenOutlined />
            <span className="text-xl font-bold">Hồ sơ Chi tiết Vụ việc</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        styles={{ body: { padding: "24px", backgroundColor: "#f9fafb" } }}
      >
        {selectedCase && (
          <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-gray-800 mb-1">
                    {selectedCase.title}
                  </h2>
                  <Text type="secondary">
                    Mã hồ sơ:{" "}
                    <span className="font-mono text-blue-600">
                      #{selectedCase.id}
                    </span>
                  </Text>
                </div>
                <div className="text-right">
                  <Tag
                    color={STATUS_CONFIG[selectedCase.status]?.color || "blue"}
                    className="mb-2 block mr-0 text-sm py-1 px-3 rounded-lg"
                  >
                    {STATUS_CONFIG[selectedCase.status]?.label ||
                      selectedCase.status}
                  </Tag>
                  <Tag
                    icon={
                      GOAL_CONFIG[selectedCase.goal_achievement_status]?.icon
                    }
                    color={
                      GOAL_CONFIG[selectedCase.goal_achievement_status]?.color
                    }
                    className="m-0 text-sm py-1 px-3 rounded-lg border-none shadow-sm"
                  >
                    {GOAL_CONFIG[selectedCase.goal_achievement_status]?.label}
                  </Tag>
                </div>
              </div>
              <Descriptions
                bordered
                column={2}
                size="small"
                className="bg-gray-50 rounded-lg overflow-hidden"
              >
                <Descriptions.Item label="Ngày tiếp nhận">
                  {new Date(selectedCase.created_at).toLocaleDateString(
                    "vi-VN",
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Gói dịch vụ">
                  <Tag color="gold" className="m-0">
                    {selectedCase.service_package_info?.name || "Tư vấn lẻ"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bên đối lập" span={2}>
                  <Text strong className="text-red-500">
                    {selectedCase.opposing_party_name}
                  </Text>
                  <br />
                  <Text type="secondary" className="text-xs italic">
                    {selectedCase.opposing_party_address}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-blue-700">
                  <TeamOutlined /> Đội ngũ thực hiện
                </h4>
                <Space direction="vertical" className="w-full">
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl">
                    <Avatar
                      src={selectedCase.assigned_lawyer?.user_avatar}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <p className="font-bold m-0 text-xs">
                        {selectedCase.assigned_lawyer?.user_fullName ||
                          "Chưa phân công"}
                      </p>
                      <p className="text-[9px] text-gray-400 uppercase">
                        Luật sư chính
                      </p>
                    </div>
                  </div>
                </Space>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-green-700">
                  <UserOutlined /> Khách hàng
                </h4>
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="font-bold text-gray-800 m-0">
                    {selectedCase.client?.user_fullName}
                  </p>
                  <p className="text-xs text-gray-500 m-0">
                    {selectedCase.client?.user_phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <Divider
                titlePlacement="start"
                className="m-0 mb-8 font-bold text-gray-400 uppercase text-[10px]"
              >
                Tiến trình thực tế
              </Divider>
              <Timeline
                items={selectedCase.progress_steps?.map((step) => ({
                  color: step.completed_at_display ? "#10b981" : "#3b82f6",
                  children: (
                    <div className="mb-4">
                      <div className="flex justify-between">
                        <Text strong>{step.title}</Text>
                        <Text type="secondary" className="text-[10px]">
                          {step.deadline_display}
                        </Text>
                      </div>
                      {step.completed_at_display && (
                        <Text className="text-[10px] text-green-600">
                          Hoàn thành lúc: {step.completed_at_display}
                        </Text>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    gold: "bg-yellow-50 text-yellow-600 border-yellow-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${themes[color]}`}
    >
      <div className={`p-4 rounded-xl text-xl ${themes[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-black opacity-60 m-0">
          {title}
        </p>
        <p className="text-xl font-black m-0 mt-1">{value || 0}</p>
      </div>
    </div>
  );
};

const ChartBox = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
      <span className="w-1 h-4 bg-blue-600 rounded-full"></span> {title}
    </h3>
    {children}
  </div>
);

export default Dashboard;
