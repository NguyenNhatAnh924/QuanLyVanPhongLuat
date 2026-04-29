import React, { useEffect, useState, useCallback } from "react";
import {
  Table, Tag, Button, Space, Tooltip, Modal, message, Form,
  Input, Popover, Flex, Descriptions, Select, Alert,
  Drawer, List, Card, Empty, Divider, DatePicker,
} from "antd";
import {
  EyeOutlined, WarningOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SaveOutlined, SearchOutlined,
  HistoryOutlined, EnvironmentOutlined, UserOutlined,
  CalendarOutlined, FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import legalCaseService from "../../services/legalCaseService";
import userService from "../../services/userService";

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RequestManagement = () => {
  // --- STATES ---
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const [form] = Form.useForm();

  // --- HELPERS ---
  const getStatusColor = (status) => {
    const colors = {
      CONFIRMED: "success",
      PROCESSING: "processing",
      LIQUIDATED: "magenta",
      REJECTED: "error",
      CANCELLED: "default",
    };
    return colors[status] || "default";
  };

  // --- API CALLS ---
  const fetchLegalCases = useCallback(async () => {
    setLoading(true);
    try {
      const res_legal = await legalCaseService.list_legaCase();
      setData(res_legal);
      const res_lawyers = await userService.lawyers();
      setLawyers(res_lawyers);
    } catch (err) {
      message.error("Lỗi tải danh sách dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLegalCases();
  }, [fetchLegalCases]);

  const handleGlobalSearch = async (value) => {
    if (!value || value.length < 2) return message.warning("Vui lòng nhập từ khóa dài hơn");
    setSearchLoading(true);
    try {
      const res = await legalCaseService.globalIdentityCheck(value);
      setSearchResult(res);
    } catch (error) {
      message.error("Lỗi tra cứu hệ thống");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- LOGIC LỌC TỔNG HỢP ---
  useEffect(() => {
    let result = [...data];
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(lowerSearch) ||
        item.client?.user_fullName?.toLowerCase().includes(lowerSearch)
      );
    }
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }
    if (dateRange?.[0] && dateRange?.[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter(item => {
        const created = dayjs(item.created_at);
        return created.isAfter(start) && created.isBefore(end);
      });
    }
    setFilteredData(result);
  }, [searchText, statusFilter, dateRange, data]);

  // --- EVENT HANDLERS ---
  const showDetail = (record) => {
    setSelectedRequest(record);
    form.setFieldsValue({
      title: record.title,
      assigned_lawyer: record.assigned_lawyer?.user_id,
      description: record.description,
      opposing_party_name: record.opposing_party_name,
      opposing_party_address: record.opposing_party_address,
    });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await legalCaseService.updateStatus(id, status);
      await fetchLegalCases();
      message.success(`Đã chuyển trạng thái: ${status}`);
      setIsModalOpen(false);
    } catch (error) {
      message.error("Cập nhật thất bại");
    }
  };

  const handleUpdateAndConfirm = async (values) => {
    try {
      await legalCaseService.update(selectedRequest.id, values);
      await legalCaseService.updateStatus(selectedRequest.id, "CONFIRMED");
      message.success("Xác nhận thành công!");
      setIsModalOpen(false);
      fetchLegalCases();
    } catch (error) {
      message.error("Lỗi lưu thông tin");
    }
  };

  const isEditable = selectedRequest?.status === "PROCESSING";

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Khách hàng",
      key: "client",
      render: (_, record) => (
        <Flex vertical>
          <span className="font-semibold text-gray-800">{record.client?.user_fullName || "Khách vãng lai"}</span>
          <span className="text-xs text-gray-500">{record.client?.user_email}</span>
        </Flex>
      ),
    },
    {
      title: "Tiêu đề vụ việc",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <span className="font-medium text-base">{text}</span>
          {record.is_coi_flagged && (
            <Popover content={<div className="whitespace-pre-line text-sm text-red-700 max-w-sm">{record.coi_note}</div>} 
                     title={<span className="text-red-600 font-bold border-b pb-1 flex items-center gap-2"><WarningOutlined /> Cảnh báo AI</span>} trigger="hover">
              <Tag color="error" icon={<WarningOutlined />} className="cursor-pointer">Cảnh báo: {record.coi_note?.substring(0, 20)}...</Tag>
            </Popover>
          )}
        </Space>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "created_at",
      key: "created_at",
      render: (text) => <samp>{new Date(text).toLocaleDateString("vi-VN")}</samp>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Tooltip title={record.status === "PROCESSING" ? "Xử lý hồ sơ" : "Xem chi tiết"}>
          <Button type="primary" shape="circle" icon={record.status === "PROCESSING" ? <SaveOutlined /> : <EyeOutlined />} onClick={() => showDetail(record)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-4">
      {/* HEADER SECTION */}
      <Flex justify="space-between" align="center" className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Xử lý Yêu cầu (Tư vấn viên)</h2>
        <Space>
          <Button icon={<SearchOutlined />} onClick={() => setIsSearchDrawerOpen(true)}>Tra cứu hệ thống</Button>
          <Button>Xuất Excel</Button>
        </Space>
      </Flex>

      {/* FILTER SECTION */}
      <Card className="mb-6 shadow-sm border-gray-100">
        <Flex gap="large" align="end" wrap="wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Tìm kiếm nhanh</div>
            <Input placeholder="Tên khách hàng, tiêu đề vụ việc..." prefix={<SearchOutlined className="text-gray-300" />} allowClear onChange={(e) => setSearchText(e.target.value)} value={searchText} />
          </div>
          <div className="w-[180px]">
            <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Trạng thái</div>
            <Select placeholder="Tất cả trạng thái" className="w-full" allowClear onChange={setStatusFilter} value={statusFilter}>
              <Option value="PROCESSING">Đang xử lý</Option>
              <Option value="CONFIRMED">Đã xác nhận</Option>
              <Option value="REJECTED">Đã từ chối</Option>
              <Option value="LIQUIDATED">Đã hoàn thành</Option>
            </Select>
          </div>
          <div className="w-[280px]">
            <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Khoảng ngày gửi</div>
            <RangePicker format="DD/MM/YYYY" className="w-full" onChange={setDateRange} value={dateRange} />
          </div>
          <Button type="text" danger onClick={() => { setSearchText(""); setStatusFilter(null); setDateRange(null); }}>Xóa lọc</Button>
        </Flex>
      </Card>

      {/* MAIN TABLE */}
      <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />

      {/* MODAL DETAIL */}
      <Modal
        title={<Flex align="center" gap="small" className="text-xl text-blue-900 mb-2"><span className="font-bold">HỒ SƠ YÊU CẦU</span><Tag color="blue" className="text-base rounded-md m-0">#{selectedRequest?.id}</Tag></Flex>}
        open={isModalOpen} onCancel={() => setIsModalOpen(false)} width={750} centered footer={null}
      >
        {selectedRequest && (
          <Flex vertical gap="middle" className="pt-2">
            {selectedRequest.is_coi_flagged && <Alert message="Cảnh báo xung đột lợi ích (AI phân tích)" description={<div className="whitespace-pre-line text-sm">{selectedRequest.coi_note}</div>} type="error" showIcon />}
            
            <Descriptions size="small" bordered column={2} className="bg-white shadow-sm rounded-lg overflow-hidden" style={{ label: { fontWeight: "600", color: "#4b5563", width: "130px" } }}>
              <Descriptions.Item label="Khách hàng" span={2}><span className="font-semibold text-blue-700">{selectedRequest.client?.user_fullName}</span></Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedRequest.client?.user_phone || "—"}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedRequest.client?.user_email || "—"}</Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">{new Date(selectedRequest.created_at).toLocaleDateString("vi-VN")}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><Tag color={getStatusColor(selectedRequest.status)}>{selectedRequest.status}</Tag></Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={handleUpdateAndConfirm} disabled={!isEditable} className="mt-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <Form.Item label={<span className="font-semibold">Tiêu đề vụ việc</span>} name="title" rules={[{ required: true, message: "Nhập tiêu đề" }]}><Input /></Form.Item>
                <Form.Item label={<span className="font-semibold">Luật sư phụ trách</span>} name="assigned_lawyer" rules={[{ required: true, message: "Chọn luật sư" }]}>
                  <Select placeholder="Chọn luật sư">{lawyers.map(l => <Option key={l.user_id} value={l.user_id}>{l.user_fullName}</Option>)}</Select>
                </Form.Item>
                <Flex gap="middle" align="end">
                  <Form.Item label={<span className="font-semibold">Tên bên đối lập</span>} name="opposing_party_name" className="flex-1 mb-0"><Input /></Form.Item>
                  <Button icon={<HistoryOutlined />} onClick={() => { const val = form.getFieldValue("opposing_party_name"); setIsSearchDrawerOpen(true); handleGlobalSearch(val); }}>Check</Button>
                </Flex>
                <Form.Item label={<span className="font-semibold">Địa chỉ bên đối lập</span>} name="opposing_party_address" className="mt-4"><Input /></Form.Item>
                <Form.Item label={<span className="font-semibold">Mô tả chi tiết</span>} name="description" rules={[{ required: true, message: "Nhập mô tả" }]} className="mb-0"><TextArea rows={5} showCount maxLength={2000} /></Form.Item>
              </div>
              <Flex justify="flex-end" gap="small" className="pt-5 mt-4 border-t">
                {selectedRequest.status === "REJECTED" ? (
                  <Button type="primary" className="bg-green-600 hover:!bg-green-500" onClick={() => handleUpdateStatus(selectedRequest.id, "PROCESSING")}>Khôi phục</Button>
                ) : isEditable ? (
                  <><Button danger type="text" icon={<CloseCircleOutlined />} onClick={() => handleUpdateStatus(selectedRequest.id, "REJECTED")}>Từ chối</Button>
                    <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>Lưu & Xác nhận</Button></>
                ) : <Button onClick={() => setIsModalOpen(false)}>Đóng lại</Button>}
              </Flex>
            </Form>
          </Flex>
        )}
      </Modal>

      {/* SEARCH DRAWER */}
      <Drawer title={<span className="font-bold text-xl"><SearchOutlined /> Tra cứu hệ thống</span>} placement="right" width={600} onClose={() => setIsSearchDrawerOpen(false)} open={isSearchDrawerOpen} zIndex={1100}>
        <Flex vertical gap="middle">
          <Input.Search placeholder="Tìm tên khách hàng hoặc đối tác cũ..." enterButton="Tìm kiếm" size="large" loading={searchLoading} onSearch={handleGlobalSearch} allowClear />
          <Divider orientation="left" className="m-0">Kết quả trùng khớp</Divider>
          <List loading={searchLoading} dataSource={searchResult} renderItem={(item) => (
            <Card className="mb-5 shadow-md rounded-xl overflow-hidden" style={{ borderLeft: `6px solid ${getStatusColor(item.status) === 'success' ? '#52c41a' : getStatusColor(item.status) === 'processing' ? '#1890ff' : getStatusColor(item.status) === 'error' ? '#ff4d4f' : getStatusColor(item.status) === 'magenta' ? '#eb2f96' : '#d9d9d9'}` }} bodyStyle={{ padding: "16px" }}>
              <Flex justify="space-between" align="center" className="mb-3">
                <Space><Tag color="blue-projection" className="m-0 font-mono">#{item.id}</Tag><span className="font-bold text-gray-800 uppercase">{item.title}</span></Space>
                <Tag color={getStatusColor(item.status)} className="font-semibold px-3 rounded-full">{item.status}</Tag>
              </Flex>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="border-r border-gray-200 pr-2">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Khách hàng cũ</div>
                  <div className="font-semibold text-blue-700">{item.client?.user_fullName}</div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-start gap-1"><EnvironmentOutlined className="mt-0.5" /><span>{item.client?.user_address || "N/A"}</span></div>
                </div>
                <div className="pl-2">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Bên đối lập cũ</div>
                  <div className="font-semibold text-red-600">{item.opposing_party_name}</div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-start gap-1"><EnvironmentOutlined className="mt-0.5 text-red-400" /><span>{item.opposing_party_address || "N/A"}</span></div>
                </div>
              </div>
              <Descriptions column={1} size="small" className="mt-3" labelStyle={{ color: "#9ca3af" }}>
                <Descriptions.Item label={<Space><UserOutlined /> Luật sư</Space>}><span className="text-gray-700 font-medium">{item.assigned_lawyer?.user_fullName || "N/A"}</span></Descriptions.Item>
                <Descriptions.Item label={<Space><CalendarOutlined /> Ngày tạo</Space>}>{new Date(item.created_at).toLocaleDateString("vi-VN")}</Descriptions.Item>
              </Descriptions>
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                <div className="text-[11px] text-gray-400 mb-1 italic flex items-center gap-1"><FileTextOutlined /> Tóm tắt nội dung:</div>
                <div className="text-xs text-gray-600 line-clamp-2">{item.description}</div>
              </div>
            </Card>
          )} locale={{ emptyText: <Empty description="Không có dữ liệu trùng khớp" /> }} />
        </Flex>
      </Drawer>
    </div>
  );
};

export default RequestManagement;