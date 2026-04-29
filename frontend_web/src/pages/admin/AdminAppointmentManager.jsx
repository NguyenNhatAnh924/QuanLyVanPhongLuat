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
  Space,
  Radio ,
  Popconfirm,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SolutionOutlined 
} from "@ant-design/icons";
import legalCaseService from "../../services/legalCaseService";
import appoimentService from "../../services/appoimentService";
import userService from "../../services/userService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const AdminAppointmentManager = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [createAppointLoading, setCreateAppointLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [staffFilter, setStaffFilter] = useState(null);
  const [appointmentType, setAppointmentType] = useState("CLIENT");
  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user"));
  console.log(allAppointments);
  const filteredAppointments = allAppointments.filter((a) => {
    const matchSearch =
      !searchText ||
      a.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      a.case_title?.toLowerCase().includes(searchText.toLowerCase());

    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchDate =
      !dateFilter ||
      dayjs(a.date_time).format("YYYY-MM-DD") ===
        dayjs(dateFilter).format("YYYY-MM-DD");
    const matchStaff =
      !staffFilter ||
      a.attendee_details?.some((p) =>
        (p.user.user_fullName || "")
          .toLowerCase()
          .includes(staffFilter.toLowerCase()),
      );
    return matchSearch && matchDate && matchStatus && matchStaff;
  });
  // --- COMPONENT CON CHO STAFF ---
  const TableStaffItem = ({ person, roleLabel, roleColor }) => (
    <div className="flex items-start gap-3 mb-2 last:mb-0">
      <Avatar
        src={person.user_avatar}
        size="small"
        style={{ backgroundColor: roleColor }}
        icon={<UserOutlined />}
      />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Text strong className="text-sm">
            {person.user_fullName}
          </Text>
          <Tag color={roleColor} className="text-[10px] m-0 px-1 leading-4">
            {roleLabel}
          </Tag>
        </div>
        <div className="flex gap-2 text-[11px] text-gray-400">
          <span>
            <PhoneOutlined /> {person.user_phone}
          </span>
        </div>
      </div>
    </div>
  );

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res_cases, res_appointments, res_employees] = await Promise.all([
        legalCaseService.list_legaCase(),
        appoimentService.get_appiments(), // Đảm bảo API này trả về TẤT CẢ lịch hẹn cho Admin
        userService.employee(),
      ]);

      setAllCases(res_cases);
      setAllAppointments(
        res_appointments.sort(
          (a, b) => new Date(b.date_time) - new Date(a.date_time),
        ),
      );
      setEmployees(res_employees);
    } catch (error) {
      message.error("Không thể tải dữ liệu lịch hẹn toàn hệ thống.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACTIONS ---
  const handleCreateOrUpdateAppointment = async (values) => {
    setCreateAppointLoading(true);
    try {
      const selectedCase = allCases.find((c) => c.id === values.legal_case);
      let finalAttendees = values.attendees ? [...values.attendees] : [];
      console.log(selectedCase);
      if (selectedCase) {
        finalAttendees.push(selectedCase.client.user_id);
      }
      const payload = {
        title:
          values.title ||
          `Họp xử lý vụ việc: ${selectedCase?.title || "Nội bộ"}`,
        attendees: finalAttendees,
        legal_case: values.legal_case,
        date_time: values.date_time.toISOString(),
        end_time: values.end_time
          ? values.end_time.toISOString()
          : values.date_time.add(1, "hour").toISOString(),
        note: values.note,
        location: values.location || "Phòng họp chính (Văn phòng Luật)",
      };

      if (editingAppointment) {
        await appoimentService.update_appointment(
          payload,
          editingAppointment.id,
        );
        message.success("Cập nhật lịch hẹn thành công!");
      } else {
        await appoimentService.create(payload);
        message.success("Đã tạo lịch hẹn thành công!");
      }
      setIsAppointModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Thao tác thất bại.");
      console.log(error);
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const handleResponse = async (id, status) => {
    try {
      if (status === "ACCEPTED") {
        await appoimentService.confirm_appoiment(id);
      } else {
        await appoimentService.declined_appoiment(id);
      }

      message.success(
        status === "ACCEPTED" ? "Đã xác nhận tham gia" : "Đã báo vắng mặt",
      );
      fetchData();
    } catch (error) {
      message.error("Lỗi phản hồi trạng thái.");
      console.log(error);
    }
  };

  // --- COLUMNS ---
  const appointmentColumns = [
    {
      title: "Thời gian & Vụ việc",
      key: "info",
      render: (_, record) => (
        <div
          className={`p-2 rounded-lg ${record.legal_case ? "bg-blue-50 border-l-4 border-blue-500" : "bg-gray-50 border-l-4 border-gray-300"}`}
        >
          <div className="flex items-center gap-2 text-blue-700 font-bold">
            <CalendarOutlined />
            {dayjs(record.date_time).format("HH:mm - DD/MM/YYYY")}
          </div>
          <div className="mt-1 font-medium text-gray-700">{record.title}</div>
          {record.case_title && (
            <Tag color="blue" className="mt-1">
              Vụ việc: {record.case_title}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Người tham gia & Trạng thái",
      key: "attendees",
      render: (_, record) => (
        <div className="flex flex-col gap-3">
          {record.attendee_details?.map((p) => {
            const roleMap = {
              0: "Khách",
              1: "Tư vấn",
              2: "Trợ lý",
              3: "Luật sư",
              4: "Admin",
            };
            const colorMap = {
              0: "default",
              1: "purple",
              2: "cyan",
              3: "blue",
              4: "red",
            };

            return (
              <div
                key={p.user.user_id}
                className="flex items-center justify-between bg-white p-1 rounded border border-gray-100"
              >
                <TableStaffItem
                  person={p.user}
                  roleLabel={roleMap[p.user.user_role]}
                  roleColor={colorMap[p.user.user_role]}
                />
                <Tag
                  color={
                    p.status === "ACCEPTED"
                      ? "green"
                      : p.status === "PENDING"
                        ? "orange"
                        : "red"
                  }
                >
                  {p.status === "ACCEPTED"
                    ? "Đã chốt"
                    : p.status === "PENDING"
                      ? "Chờ"
                      : "Vắng"}
                </Tag>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: "Địa điểm & Ghi chú",
      render: (_, record) => {
        let color = "default";
        let text = "Không rõ";

        if (record.status === "PENDING") {
          color = "orange";
          text = "Chờ xác nhận";
        } else if (record.status === "CONFIRMED") {
          color = "green";
          text = "Đã xác nhận";
        } else if (record.status === "COMPLETED") {
          color = "blue";
          text = "Hoàn thành";
        } else if (record.status === "CANCELLED") {
          color = "red";
          text = "Đã hủy";
        }

        return (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <EnvironmentOutlined className="text-orange-500" />{" "}
              {record.location}
            </div>
            <Text type="secondary" className="text-xs italic">
              <InfoCircleOutlined /> {record.note || "Không có ghi chú"}
            </Text>
            <Tag color={color}>{text}</Tag>
          </div>
        );
      },
    },
    {
      title: "Thao tác Quản trị",
      align: "right",
      render: (_, record) => {
        const isCreatorOrAdmin =
          record.creator === user.user_id ||
          record.creator?.user_id === user.user_id ||
          user.user_role === 4;
        const myResponse = record.attendee_details?.find(
          (p) => p.user.user_id === user.user_id,
        );

        return (
          <Space orientation="vertical" className="w-full">
            {isCreatorOrAdmin ? (
              <>
                <Button
                  size="small"
                  block
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingAppointment(record);
                    setIsAppointModalOpen(true);
                    form.setFieldsValue({
                      ...record,
                      date_time: dayjs(record.date_time),
                      end_time: dayjs(record.end_time),
                    });
                  }}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Hủy lịch hẹn này trên toàn hệ thống?"
                  onConfirm={async () => {
                    try {
                      await appoimentService.camcel_appoiment(record.id);
                      message.success("Hủy lịch hẹn thành công!");
                      fetchData();
                    } catch (error) {
                      console.error(error);
                      message.error("Hủy lịch hẹn thất bại!");
                    }
                  }}
                >
                  <Button size="small" danger block icon={<DeleteOutlined />}>
                    Hủy
                  </Button>
                </Popconfirm>
              </>
            ) : null}

            {myResponse?.status === "PENDING" && (
              <div className="flex gap-1 mt-1">
                <Button
                  size="small"
                  type="primary"
                  className="bg-green-600"
                  onClick={() => handleResponse(record.id, "ACCEPTED")}
                >
                  Tham gia
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => handleResponse(record.id, "DECLINED")}
                >
                  Từ chối
                </Button>
              </div>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="mb-6 shadow-sm border-0">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} className="m-0 text-blue-800">
              <TeamOutlined /> Quản lý Lịch hẹn Hệ Thống
            </Title>
            <Text type="secondary">
              Quản lý toàn bộ lịch họp nội bộ, gặp gỡ khách hàng và phân công
              nhân sự
            </Text>
          </Col>
          <Col className="flex gap-4 items-center">
            <Statistic
              title="Lịch đang chờ xác nhận"
              value={
                allAppointments.filter((a) =>
                  a.attendee_details?.some(
                    (p) =>
                      p.user.user_id === user.user_id && p.status === "PENDING",
                  ),
                ).length
              }
              prefix={<ClockCircleOutlined />}
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className="bg-blue-600 hover:bg-blue-500"
              onClick={() => {
                setEditingAppointment(null);
                form.resetFields();
                setIsAppointModalOpen(true);
              }}
            >
              Tạo lịch mới
            </Button>
          </Col>
        </Row>
      </Card>
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="Tìm tiêu đề hoặc vụ việc..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col span={4}>
            <Select
              allowClear
              placeholder="Trạng thái"
              className="w-full"
              onChange={(v) => setStatusFilter(v)}
              value={statusFilter}
              options={[
                { value: "PENDING", label: "Chờ xác nhân" },
                { value: "CONFIRMED", label: "Xác nhận" },
                { value: "COMPLETED", label: "Hoàn thành" },
                { value: "CANCELLED", label: "Đã hủy" },
              ]}
            />
          </Col>

          <Col span={4}>
            <DatePicker
              className="w-full"
              placeholder="Lọc theo ngày"
              value={dateFilter}
              onChange={(d) => setDateFilter(d)}
            />
          </Col>

          <Col span={6}>
            <Input
              placeholder="Tìm nhân viên..."
              onChange={(e) => setStaffFilter(e.target.value)}
            />
          </Col>

          <Col span={4}>
            <Button
              block
              onClick={() => {
                setSearchText("");
                setStatusFilter(null);
                setDateFilter(null);
                setStaffFilter(null);
              }}
            >
              Reset bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>
      <Table
        dataSource={filteredAppointments}
        columns={appointmentColumns}
        rowKey="id"
        loading={loading}
        className="bg-white rounded-xl shadow-sm"
      />

      <Modal
        title={
          editingAppointment
            ? "Cập nhật thông tin lịch hẹn"
            : "Thiết lập lịch hẹn mới (Admin)"
        }
        open={isAppointModalOpen}
        onCancel={() => setIsAppointModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createAppointLoading}
        width={600}
      >
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col items-center border border-dashed border-gray-300">
          <Text type="secondary" className="mb-2 uppercase text-[10px] font-bold tracking-widest">Loại hình sự kiện</Text>
          <Radio.Group value={appointmentType} onChange={(e) => {
            setAppointmentType(e.target.value);
            form.setFieldsValue({ legal_case: undefined }); // Reset vụ việc khi đổi loại hình
          }} optionType="button" buttonStyle="solid">
            <Radio.Button value="CLIENT" className="w-40 text-center"><SolutionOutlined /> Tiếp Khách</Radio.Button>
            <Radio.Button value="INTERNAL" className="w-40 text-center"><TeamOutlined /> Họp Nội Bộ</Radio.Button>
          </Radio.Group>
        </div>

        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdateAppointment}>
          <Form.Item name="title" label={<Text strong>Tiêu đề cuộc họp/hẹn</Text>} rules={[{ required: true, message: 'Nhập tiêu đề!' }]}>
            <Input placeholder="VD: Giao ban đầu tuần, Ký kết hồ sơ vụ án..." />
          </Form.Item>

          {appointmentType === "CLIENT" && (
            <Form.Item name="legal_case" label={<Text strong>Hồ sơ vụ việc liên quan</Text>} rules={[{ required: true, message: 'Chọn vụ việc!' }]}>
              <Select showSearch placeholder="Chọn vụ việc..." optionFilterProp="label"
                options={allCases.map(c => ({ value: c.id, label: `[#${c.id}] ${c.title} - KH: ${c.client?.user_fullName}` }))}
              />
            </Form.Item>
          )}

          <Form.Item name="attendees" label={<Text strong>Phân công nhân sự tham gia</Text>}>
            <Select mode="multiple" placeholder="Chọn luật sư hoặc trợ lý phối hợp" showSearch optionFilterProp="label"
              options={employees.map(e => ({ value: e.user_id, label: `${e.user_fullName} (${e.user_role === 3 ? "Luật sư" : "Nhân viên"})` }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date_time" label={<Text strong>Bắt đầu</Text>} rules={[{ required: true }]}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label={<Text strong>Kết thúc dự kiến</Text>}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="location" label={<Text strong>Địa điểm</Text>} initialValue="Phòng họp chính (Văn phòng Luật)">
            <Input prefix={<EnvironmentOutlined />} placeholder="Văn phòng, Tòa án, hoặc Link họp..." />
          </Form.Item>

          <Form.Item name="note" label={<Text strong>Ghi chú điều hành</Text>}>
            <TextArea rows={3} placeholder="Ghi chú các yêu cầu chuẩn bị tài liệu hoặc nội dung cuộc họp..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAppointmentManager;