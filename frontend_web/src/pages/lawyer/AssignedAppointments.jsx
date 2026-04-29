import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Tag,
  Card,
  Button,
  Modal,
  Typography,
  Statistic,
  message,
  Form,
  Select,
  DatePicker,
  Input,
  Row,
  Col,
  Avatar,
  Radio,
  Space,
  Divider,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  SolutionOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import legalCaseService from "../../services/legalCaseService";
import appoimentService from "../../services/appoimentService";
import userService from "../../services/userService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const LawyerAppointmentManager = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [myAppoiments, setMyAppoiments] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modal State
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [createAppointLoading, setCreateAppointLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentType, setAppointmentType] = useState("CLIENT"); 

  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user"));
  const ROLE_MAP = {
    0: "Khách hàng",
    1: "Tư vấn viên",
    2: "Trợ lý luật sư",
    3: "Luật sư",
    4: "Quản lý",
  };
  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res_cases, res_apps, res_emps] = await Promise.all([
        legalCaseService.list_legaCase(),
        appoimentService.get_appiments(),
        userService.employee(),
      ]);
      setMyCases(res_cases);
      setMyAppoiments(
        res_apps.sort((a, b) => dayjs(b.date_time).diff(dayjs(a.date_time))),
      );
      setEmployees(res_emps);
    } catch (error) {
      console.log(error);
      message.error("Không thể tải dữ liệu lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  console.log(employees);
  // --- ACTIONS ---
  const handleCreateOrUpdateAppointment = async (values) => {
    setCreateAppointLoading(true);
    try {
      let payload = {
        date_time: values.date_time.toISOString(),
        end_time: values.end_time.toISOString(),
        location: values.location,
        note: values.note,
      };

      if (appointmentType === "CLIENT") {
        const selectedCase = myCases.find((c) => c.id === values.legal_case);
        payload.legal_case = values.legal_case;
        payload.title =
          values.title || `Hẹn tư vấn vụ việc: ${selectedCase?.title}`;
        payload.attendees =
          values.attendees && values.attendees.length > 0
            ? values.attendees
            : [selectedCase?.client?.user_id].filter((id) => id);
      } else {
        payload.legal_case = null;
        payload.title = values.title;
        payload.attendees = values.attendees;
      }

      if (editingAppointment) {
        await appoimentService.update_appointment(
          payload,
          editingAppointment.id,
        );
        message.success("Cập nhật lịch hẹn thành công!");
      } else {
        await appoimentService.create(payload);
        message.success("Tạo lịch hẹn thành công!");
      }

      setIsAppointModalOpen(false);
      fetchData();
    } catch (error) {
      console.log(error);
      message.error("Thao tác thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const handleCancelAppointment = (id) => {
    Modal.confirm({
      title: "Xác nhận hủy lịch hẹn?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Hủy lịch",
      okType: "danger",
      onOk: async () => {
        try {
          await appoimentService.camcel_appoiment(id);
          message.success("Đã hủy lịch hẹn.");
          fetchData();
        } catch (error) {
          console.log(error);
          message.error("Hủy thất bại.");
        }
      },
    });
  };

  const handleConfirmParticipation = async (appointmentId) => {
    try {
      await appoimentService.confirm_appoiment(appointmentId);
      message.success("Đã xác nhận tham gia!");
      fetchData();
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra khi xác nhận.");
    }
  };

  const handleDeclineParticipation = async (appointmentId) => {
    try {
      await appoimentService.declined_appoiment(appointmentId);
      message.info("Chức năng từ chối đang được cập nhật.");
      fetchData();
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra.");
    }
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
    setAppointmentType("CLIENT");
    form.resetFields();
    form.setFieldsValue({ location: "Văn phòng Luật Sư" });
    setIsAppointModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingAppointment(record);
    setAppointmentType(record.legal_case ? "CLIENT" : "INTERNAL");
    setIsAppointModalOpen(true);
    form.setFieldsValue({
      title: record.title,
      legal_case: record.legal_case,
      attendees: record.attendee_details?.map((a) => a.user.user_id),
      location: record.location,
      date_time: dayjs(record.date_time),
      end_time: dayjs(record.end_time),
      note: record.note,
    });
  };

  // --- RENDER HELPERS ---
  const TableStaffItem = ({ person, roleLabel, roleColor }) => (
    <div className="flex items-center gap-2 mb-1">
      <Avatar size="small" src={person.user_avatar} icon={<UserOutlined />} />
      <div className="flex flex-col">
        <Space size={4}>
          <Text strong style={{ fontSize: 13 }}>
            {person.user_fullName}
          </Text>
          <Tag color={roleColor} style={{ fontSize: 10, margin: 0 }}>
            {roleLabel}
          </Tag>
        </Space>
      </div>
    </div>
  );

  const appointmentColumns = [
    {
      title: "Loại & Thời gian",
      key: "time",
      width: "25%",
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Tag
            color={record.legal_case ? "orange" : "blue"}
            icon={record.legal_case ? <SolutionOutlined /> : <TeamOutlined />}
          >
            {record.legal_case ? "LỊCH KHÁCH HÀNG" : "HỌP NỘI BỘ"}
          </Tag>
          <Text strong>
            <ClockCircleOutlined />{" "}
            {dayjs(record.date_time).format("HH:mm DD/MM/YYYY")}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Đến: {dayjs(record.end_time).format("HH:mm")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nội dung cuộc hẹn",
      key: "content",
      width: "30%",
      render: (_, record) => (
        <div className="flex flex-col">
          <Text strong className="text-blue-700">
            {record.title}
          </Text>
          <Space className="mt-1">
            <EnvironmentOutlined className="text-red-500" />
            <Text type="secondary" size="small">
              {record.location}
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: "Thành viên tham gia",
      key: "attendees",
      width: "30%",
      render: (_, record) => (
        <div className="flex flex-col gap-2 max-h-32 overflow-y-auto p-1">
          {record.attendee_details?.map((item) => {
            const roleConfig = {
              0: { label: "KH", color: "default" },
              1: { label: "TV", color: "cyan" },
              2: { label: "Trợ lý", color: "green" },
              3: { label: "L.Sư", color: "blue" },
              4: { label: "Admin", color: "red" },
            };

            const statusConfig = {
              ACCEPTED: {
                icon: <CheckCircleOutlined />,
                color: "#52c41a",
                bg: "#f6ffed",
                text: "Đã xác nhận",
              },
              DECLINED: {
                icon: <CloseCircleOutlined />,
                color: "#ff4d4f",
                bg: "#fff1f0",
                text: "Từ chối",
              },
              PENDING: {
                icon: <ClockCircleOutlined />,
                color: "#faad14",
                bg: "#fffbe6",
                text: "Chờ phản hồi",
              },
            };

            const status = statusConfig[item.status] || statusConfig.PENDING;
            const role = roleConfig[item.user.user_role] || roleConfig[0];

            return (
              <div
                key={item.user.user_id}
                className="flex items-center justify-between p-1.5 rounded-lg border border-gray-50 shadow-sm"
                style={{ backgroundColor: status.bg }}
              >
                <Space size={8}>
                  <Avatar
                    size={24}
                    src={item.user.user_avatar}
                    icon={<UserOutlined />}
                    style={{ border: `1px solid ${status.color}` }}
                  />
                  <div className="flex flex-col">
                    <Text strong style={{ fontSize: 12, lineHeight: 1 }}>
                      {item.user.user_fullName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {role.label}
                    </Text>
                  </div>
                </Space>

                <Tooltip title={status.text}>
                  <span style={{ color: status.color, fontSize: 14 }}>
                    {status.icon}
                  </span>
                </Tooltip>
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
          CANCELLED: { color: "red", text: "Đã hủy" },
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

        const currentUserId = user?.user_id;

        const isCreator =
          record.creator === currentUserId ||
          record.creator?.user_id === currentUserId;

        const myAttendance = record.attendee_details?.find(
          (attendee) => attendee.user.user_id === currentUserId,
        );
        if (isCreator) {
          return (
            <Space>
              <Tooltip title="Chỉnh sửa lịch hẹn">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-blue-600" />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
              <Tooltip title="Hủy lịch hẹn này">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancelAppointment(record.id)}
                />
              </Tooltip>
            </Space>
          );
        } else if (myAttendance) {
          if (myAttendance.status === "PENDING") {
            return (
              <Space>
                <Tooltip title="Đồng ý tham gia">
                  <Button
                    type="primary"
                    size="small"
                    className="bg-green-600"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleConfirmParticipation(record.id)}
                  >
                    Tham gia
                  </Button>
                </Tooltip>
                <Tooltip title="Từ chối tham gia">
                  <Button
                    danger
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleDeclineParticipation(record.id)}
                  >
                    Từ chối
                  </Button>
                </Tooltip>
              </Space>
            );
          } else {
            return (
              <Tag
                color={myAttendance.status === "ACCEPTED" ? "success" : "error"}
              >
                {myAttendance.status === "ACCEPTED"
                  ? "Bạn đã đồng ý"
                  : "Bạn đã từ chối"}
              </Tag>
            );
          }
        }
        return <Text type="secondary">Không có quyền</Text>;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6">
      <Card className="mb-6 shadow-sm border-none rounded-xl">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Lịch làm việc & Hội chẩn
            </Title>
            <Text type="secondary">
              Tách biệt lịch hẹn khách hàng và họp nội bộ chuyên môn
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic
                title="Tổng lịch"
                value={myAppoiments.length}
                prefix={<CalendarOutlined />}
              />
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                className="bg-blue-600 rounded-lg"
              >
                Tạo lịch hẹn
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* MAIN TABLE */}
      <Card
        className="shadow-sm border-none rounded-xl overflow-hidden"
        type={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={myAppoiments}
          columns={appointmentColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* FORM MODAL */}
      <Modal
        title={
          <Space className="text-blue-600">
            <CalendarOutlined />
            <Text strong className="text-lg">
              {editingAppointment ? "CẬP NHẬT LỊCH" : "LỊCH HẸN MỚI"}
            </Text>
          </Space>
        }
        open={isAppointModalOpen}
        onCancel={() => setIsAppointModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createAppointLoading}
        width={700}
        okText={editingAppointment ? "Lưu thay đổi" : "Xác nhận tạo"}
        cancelText="Bỏ qua"
        centered
      >
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col items-center">
          <Text
            type="secondary"
            className="mb-2 uppercase text-xs font-bold tracking-wider"
          >
            Chọn hình thức cuộc họp
          </Text>
          <Radio.Group
            value={appointmentType}
            onChange={(e) => {
              setAppointmentType(e.target.value);
              form.setFieldsValue({ legal_case: undefined, title: "" });
            }}
            optionType="button"
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="CLIENT" className="px-6">
              <SolutionOutlined /> Hẹn Khách hàng
            </Radio.Button>
            <Radio.Button value="INTERNAL" className="px-6">
              <TeamOutlined /> Họp Nội bộ
            </Radio.Button>
          </Radio.Group>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdateAppointment}
        >
          {appointmentType === "CLIENT" ? (
            <Form.Item
              name="legal_case"
              label={<Text strong>Vụ việc (Hồ sơ pháp lý)</Text>}
              rules={[
                {
                  required: true,
                  message: "Bắt buộc chọn vụ việc khi hẹn khách hàng!",
                },
              ]}
            >
              <Select
                placeholder="Tìm kiếm hồ sơ khách hàng..."
                showSearch
                optionFilterProp="label"
                options={myCases.map((c) => ({
                  value: c.id,
                  label: `[#${c.id}] ${c.title} - KH: ${c.client.user_fullName}`,
                }))}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="title"
              label={<Text strong>Tiêu đề cuộc họp nội bộ</Text>}
              rules={[
                { required: true, message: "Vui lòng nhập mục đích cuộc họp!" },
              ]}
            >
              <Input
                placeholder="VD: Họp giao ban sáng, Thảo luận án dân sự hồ sơ #102..."
                prefix={<InfoCircleOutlined />}
              />
            </Form.Item>
          )}

          {appointmentType === "CLIENT" && (
            <Form.Item
              name="title"
              label={
                <Text type="secondary">Tùy chỉnh tiêu đề (Không bắt buộc)</Text>
              }
            >
              <Input placeholder="Mặc định: Hẹn khách hàng + [Tên vụ việc]" />
            </Form.Item>
          )}

          <Form.Item
            name="attendees"
            label={<Text strong>Thành viên tham gia</Text>}
            rules={[
              {
                required: appointmentType === "INTERNAL",
                message: "Cuộc họp nội bộ cần ít nhất 1 người tham gia!",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn nhân viên hoặc khách hàng mời tham gia..."
              options={employees.map((emp) => ({
                value: emp.user_id,
                label: `${emp.user_fullName} - ${ROLE_MAP[emp.user_role] || "Không xác định"}`,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_time"
                label={<Text strong>Bắt đầu</Text>}
                rules={[{ required: true }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label={<Text strong>Kết thúc dự kiến</Text>}
                rules={[{ required: true }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label={<Text strong>Địa điểm</Text>}
            rules={[{ required: true }]}
          >
            <Input
              placeholder="Phòng họp A, Tòa án Nhân dân TP, hoặc link họp online..."
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="note"
            label={<Text strong>Nội dung/Ghi chú chuẩn bị</Text>}
          >
            <TextArea
              rows={3}
              placeholder="Các hồ sơ cần mang theo, nội dung cần thống nhất..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LawyerAppointmentManager;
