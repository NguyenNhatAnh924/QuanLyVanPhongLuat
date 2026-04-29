import React, { useState, useEffect, useCallback } from "react";
import {
  Table, Tag, Card, Button, Modal, Typography, Statistic, message,
  Form, Select, DatePicker, Input, Row, Col, Avatar, Radio, Space,
  Divider, Tooltip, Flex, Tabs, notification
} from "antd";
import {
  CalendarOutlined, EnvironmentOutlined, InfoCircleOutlined,
  CloseCircleOutlined, EditOutlined, CheckCircleOutlined,
  PlusOutlined, DeleteOutlined, UserOutlined, TeamOutlined,
  SolutionOutlined, ClockCircleOutlined, GlobalOutlined, UserSwitchOutlined,
} from "@ant-design/icons";
import legalCaseService from "../../services/legalCaseService";
import appoimentService from "../../services/appoimentService";
import userService from "../../services/userService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ConsultantAppointmentManager = () => {
  const [loading, setLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");

  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [createAppointLoading, setCreateAppointLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentType, setAppointmentType] = useState("CLIENT");

  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?.user_id;

  const ROLE_MAP = {
    0: "Khách hàng",
    1: "Tư vấn viên",
    2: "Trợ lý luật sư",
    3: "Luật sư",
    4: "Quản lý",
  };
  const displayErrors = (errorResponse) => {
    if (errorResponse && errorResponse.data) {
      const errors = errorResponse.data;
      if (errors.non_field_errors) {
        errors.non_field_errors.forEach(msg => {
          notification.error({
            message: 'Lỗi hệ thống / Trùng lịch',
            description: msg,
            duration: 8,
          });
        });
      } else {
        Object.keys(errors).forEach((field) => {
          const errorMessages = errors[field];
          if (Array.isArray(errorMessages)) {
            errorMessages.forEach((msg) => {
              message.error(`${field}: ${msg}`, 5);
            });
          } else {
            message.error(String(errorMessages));
          }
        });
      }
    } else {
      message.error("Không thể kết nối đến máy chủ hoặc lỗi không xác định.");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res_cases, res_apps, res_emps] = await Promise.all([
        legalCaseService.list_legaCase(),
        appoimentService.get_appiments(),
        userService.employee(),
      ]);
      setMyCases(res_cases);
      setAllAppointments(res_apps.sort((a, b) => dayjs(b.date_time).diff(dayjs(a.date_time))));
      setEmployees(res_emps);
    } catch (error) {
      displayErrors(error.response);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirm = async (id) => {
    try {
      const res = await appoimentService.confirm_appoiment(id);
      message.success(res.message || "Đã xác nhận tham gia!");
      fetchData();
    } catch (error) {
      displayErrors(error.response);
    }
  };

  const handleDecline = async (id) => {
    try {
      const res = await appoimentService.declined_appoiment(id);
      message.success(res.message || "Đã từ chối lịch hẹn.");
      fetchData();
    } catch (error) {
      displayErrors(error.response);
    }
  };

  const handleCreateOrUpdateAppointment = async (values) => {
    if (!values.date_time.isBefore(values.end_time)) {
      message.error("Thời gian kết thúc phải sau thời gian bắt đầu!");
      return;
    }
    setCreateAppointLoading(true);
    try {
      let payload = {
        date_time: values.date_time.toISOString(),
        end_time: values.end_time.toISOString(),
        location: values.location,
        note: values.note,
        attendees: values.attendees,
      };

      if (appointmentType === "CLIENT") {
        const selectedCase = myCases.find((c) => c.id === values.legal_case);
        payload.legal_case = values.legal_case;
        payload.title = values.title || `Hẹn tư vấn vụ việc: ${selectedCase?.title}`;
        if (selectedCase?.client?.user_id && !payload.attendees.includes(selectedCase.client.user_id)) {
          payload.attendees.push(selectedCase.client.user_id);
        }
      } else {
        payload.legal_case = null;
        payload.title = values.title;
      }

      let res;
      if (editingAppointment) {
        res = await appoimentService.update_appointment(payload, editingAppointment.id);
        message.success(res.message || "Cập nhật lịch hẹn thành công!");
      } else {
        res = await appoimentService.create(payload);
        message.success(res.message || "Tạo lịch hẹn thành công!");
      }
      setIsAppointModalOpen(false);
      fetchData();
    } catch (error) {
      displayErrors(error.response);
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const handleCancelAppointment = (id) => {
    Modal.confirm({
      title: "Xác nhận hủy lịch hẹn?",
      content: "Hệ thống sẽ thông báo cho tất cả người tham gia.",
      okText: "Hủy lịch",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await appoimentService.camcel_appoiment(id);
          message.success(res.message || "Đã hủy lịch hẹn.");
          fetchData();
        } catch (error) {
          displayErrors(error.response);
        }
      },
    });
  };

  const displayAppointments = activeTab === "MINE"
    ? allAppointments.filter(app => app.creator === currentUserId || app.attendee_details?.some(a => a.user.user_id === currentUserId))
    : allAppointments;

  const appointmentColumns = [
    {
      title: "Loại & Thời gian",
      key: "time",
      width: "20%",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.legal_case ? "orange" : "blue"} icon={record.legal_case ? <SolutionOutlined /> : <TeamOutlined />}>
            {record.legal_case ? "LỊCH KHÁCH HÀNG" : "HỌP NỘI BỘ"}
          </Tag>
          <Text strong><ClockCircleOutlined /> {dayjs(record.date_time).format("HH:mm DD/MM/YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>Đến: {dayjs(record.end_time).format("HH:mm")}</Text>
        </Space>
      ),
    },
    {
      title: "Nội dung cuộc hẹn",
      key: "content",
      width: "25%",
      render: (_, record) => (
        <div className="flex flex-col">
          <Text strong className="text-blue-700">{record.title}</Text>
          <Space className="mt-1">
            <EnvironmentOutlined className="text-red-500" />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.location}</Text>
          </Space>
          {record.note && <Text type="secondary" italic style={{ fontSize: 11 }}>Ghi chú: {record.note}</Text>}
        </div>
      ),
    },
    {
      title: "Thành viên tham gia",
      key: "attendees",
      width: "30%",
      render: (_, record) => (
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto p-1">
          {record.attendee_details?.map((item) => {
            const statusConfig = {
              ACCEPTED: { icon: <CheckCircleOutlined />, color: "#52c41a", bg: "#f6ffed", text: "Đã xác nhận" },
              DECLINED: { icon: <CloseCircleOutlined />, color: "#ff4d4f", bg: "#fff1f0", text: "Từ chối" },
              PENDING: { icon: <ClockCircleOutlined />, color: "#faad14", bg: "#fffbe6", text: "Chờ phản hồi" },
            };
            const status = statusConfig[item.status] || statusConfig.PENDING;
            return (
              <div key={item.user.user_id} className="flex items-center justify-between p-1 rounded border border-gray-50 shadow-sm mb-1" style={{ backgroundColor: status.bg }}>
                <Space size={8}>
                  <Avatar size={20} src={item.user.user_avatar} icon={<UserOutlined />} style={{ border: `1px solid ${status.color}` }} />
                  <div className="flex flex-col">
                    <Text strong style={{ fontSize: 11, lineHeight: 1 }}>{item.user.user_fullName}</Text>
                    <Text type="secondary" style={{ fontSize: 9 }}>{ROLE_MAP[item.user.user_role]}</Text>
                  </div>
                </Space>
                <Tooltip title={status.text}><span style={{ color: status.color, fontSize: 12 }}>{status.icon}</span></Tooltip>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "10%",
      render: (status) => {
        const config = {
          PENDING: { color: "orange", text: "Chờ duyệt" },
          CONFIRMED: { color: "green", text: "Xác nhận" },
          CANCELLED: { color: "red", text: "Hủy" },
          COMPLETED: { color: "blue", text: "Xong" },
        };
        return <Tag color={config[status]?.color}>{config[status]?.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: (_, record) => {
        const isCreator = record.creator === currentUserId || record.creator?.user_id === currentUserId;
        const myAttendance = record.attendee_details?.find((a) => a.user.user_id === currentUserId);

        if (activeTab === "ALL") {
          return (
            <Space>
              <Tooltip title="Sửa lịch điều phối">
                <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => {
                  setEditingAppointment(record);
                  setAppointmentType(record.legal_case ? "CLIENT" : "INTERNAL");
                  setIsAppointModalOpen(true);
                  form.setFieldsValue({ ...record, date_time: dayjs(record.date_time), end_time: dayjs(record.end_time), attendees: record.attendee_details?.map((a) => a.user.user_id) });
                }} />
              </Tooltip>
              <Tooltip title="Hủy lịch">
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleCancelAppointment(record.id)} />
              </Tooltip>
            </Space>
          );
        }

        if (activeTab === "MINE") {
          if (isCreator) {
            return (
              <Space>
                <Button type="text" icon={<EditOutlined className="text-blue-600" />} onClick={() => {
                  setEditingAppointment(record);
                  setAppointmentType(record.legal_case ? "CLIENT" : "INTERNAL");
                  setIsAppointModalOpen(true);
                  form.setFieldsValue({ ...record, date_time: dayjs(record.date_time), end_time: dayjs(record.end_time), attendees: record.attendee_details?.map((a) => a.user.user_id) });
                }} />
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleCancelAppointment(record.id)} />
              </Space>
            );
          }
          if (myAttendance) {
            if (myAttendance.status === "PENDING") {
              return (
                <Space>
                  <Button type="primary" size="small" className="bg-green-600" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(record.id)}>Tham gia</Button>
                  <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleDecline(record.id)}>Từ chối</Button>
                </Space>
              );
            }
            return <Tag color={myAttendance.status === "ACCEPTED" ? "success" : "error"}>{myAttendance.status === "ACCEPTED" ? "Đã đồng ý" : "Đã từ chối"}</Tag>;
          }
        }
        return <Text type="secondary">Chỉ xem</Text>;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      <Card className="mb-6 shadow-sm border-none rounded-xl">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>Điều phối & Quản lý lịch hẹn</Title>
            <Text type="secondary">Quản lý lịch toàn văn phòng và phản hồi lịch cá nhân</Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title="Tổng lịch hẹn" value={allAppointments.length} prefix={<CalendarOutlined />} />
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => {
                setEditingAppointment(null);
                setAppointmentType("CLIENT");
                form.resetFields();
                form.setFieldsValue({ location: "Phòng khách số 1", attendees: [currentUserId] });
                setIsAppointModalOpen(true);
              }} className="bg-blue-600 rounded-lg h-12">Sắp xếp lịch mới</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={[{ key: "ALL", label: <Space><GlobalOutlined /> Tất cả lịch văn phòng</Space> }, { key: "MINE", label: <Space><UserSwitchOutlined /> Lịch của tôi</Space> }]} />

      <Card className="shadow-sm border-none rounded-b-xl overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table dataSource={displayAppointments} columns={appointmentColumns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal title={<Space className="text-blue-600"><CalendarOutlined /><Text strong>{editingAppointment ? "CHỈNH SỬA ĐIỀU PHỐI" : "LỊCH HẸN ĐIỀU PHỐI MỚI"}</Text></Space>} open={isAppointModalOpen} onCancel={() => setIsAppointModalOpen(false)} onOk={() => form.submit()} confirmLoading={createAppointLoading} width={750} centered>
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col items-center">
          <Radio.Group value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} optionType="button" buttonStyle="solid" size="large">
            <Radio.Button value="CLIENT" className="px-8"><SolutionOutlined /> Hẹn Khách hàng</Radio.Button>
            <Radio.Button value="INTERNAL" className="px-8"><TeamOutlined /> Họp Nội bộ</Radio.Button>
          </Radio.Group>
        </div>
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdateAppointment}>
          <Row gutter={24}>
            <Col span={24}>
              {appointmentType === "CLIENT" ? (
                <Form.Item name="legal_case" label={<Text strong>Vụ việc (Hồ sơ pháp lý)</Text>} rules={[{ required: true }]}>
                  <Select placeholder="Chọn hồ sơ khách hàng..." showSearch options={myCases.map(c => ({ value: c.id, label: `[#${c.id}] ${c.title} - KH: ${c.client.user_fullName}` }))} />
                </Form.Item>
              ) : (
                <Form.Item name="title" label={<Text strong>Tiêu đề cuộc họp</Text>} rules={[{ required: true }]}><Input placeholder="VD: Họp giao ban, thảo luận án..." /></Form.Item>
              )}
              <Form.Item name="attendees" label={<Text strong>Thành viên tham gia</Text>} rules={[{ required: true }]}>
                <Select mode="multiple" placeholder="Chọn nhân viên, khách hàng..." optionFilterProp="label">
                  {employees.map(emp => (
                    <Select.Option key={emp.user_id} value={emp.user_id} label={emp.user_fullName}>
                      <Flex align="center" gap={8}><Avatar size="small" src={emp.user_avatar} />{emp.user_fullName} <small>({ROLE_MAP[emp.user_role]})</small></Flex>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="date_time" label={<Text strong>Bắt đầu</Text>} rules={[{ required: true }]}><DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" /></Form.Item></Col>
                <Col span={12}><Form.Item name="end_time" label={<Text strong>Kết thúc dự kiến</Text>} rules={[{ required: true }]}><DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" /></Form.Item></Col>
              </Row>
              <Form.Item name="location" label={<Text strong>Địa điểm</Text>} rules={[{ required: true }]}><Input prefix={<EnvironmentOutlined />} placeholder="Địa điểm họp..." /></Form.Item>
              <Form.Item name="note" label={<Text strong>Ghi chú</Text>}><TextArea rows={2} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ConsultantAppointmentManager;