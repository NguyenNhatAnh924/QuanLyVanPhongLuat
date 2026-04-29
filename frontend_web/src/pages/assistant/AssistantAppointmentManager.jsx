import React, { useEffect, useState, useCallback } from "react";
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
  Popconfirm,
  Radio,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import legalCaseService from "../../services/legalCaseService";
import appoimentService from "../../services/appoimentService";
import userService from "../../services/userService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const AssistantAppointmentManager = () => {
  const [loading, setLoading] = useState(false);
  const [myAppoiments, setMyAppoiments] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [createAppointLoading, setCreateAppointLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentType, setAppointmentType] = useState("CLIENT");
  
  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res_cases, res_appointments, res_employees] = await Promise.all([
        legalCaseService.list_legaCase(),
        appoimentService.get_appiments(),
        userService.employee(),
      ]);

      setMyCases(res_cases);
      setMyAppoiments(
        res_appointments.sort((a, b) => dayjs(b.date_time).diff(dayjs(a.date_time)))
      );
      setEmployees(res_employees);
    } catch (error) {
      message.error("Không thể tải dữ liệu lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdateAppointment = async (values) => {
    setCreateAppointLoading(true);
    try {
      const selectedCase = myCases.find((c) => c.id === values.legal_case);
      
      let finalAttendees = values.attendees || [];
      if (appointmentType === "CLIENT" && selectedCase) {
        if (selectedCase.client?.user_id) finalAttendees.push(selectedCase.client.user_id);
        if (selectedCase.lawyer?.user_id) finalAttendees.push(selectedCase.lawyer.user_id);
      }
      
      finalAttendees = [...new Set(finalAttendees)];

      const payload = {
        title: values.title || (appointmentType === "CLIENT" ? `Lịch hẹn khách: ${selectedCase?.title}` : "Họp nội bộ"),
        attendees: finalAttendees,
        legal_case: appointmentType === "CLIENT" ? values.legal_case : null,
        date_time: values.date_time.toISOString(),
        end_time: values.end_time ? values.end_time.toISOString() : values.date_time.add(1, "hour").toISOString(),
        note: values.note,
        location: values.location || "Văn phòng Luật Sư",
      };

      if (editingAppointment) {
        await appoimentService.update_appointment(payload, editingAppointment.id);
        message.success("Cập nhật thành công!");
      } else {
        await appoimentService.create(payload);
        message.success("Đã tạo lịch hẹn!");
      }
      setIsAppointModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Thao tác thất bại.");
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const handleResponse = async (id, status) => {
    try {
      await appoimentService.confirm_appoiment(id, status);
      message.success(status === "ACCEPTED" ? "Đã xác nhận tham gia" : "Đã từ chối");
      fetchData();
    } catch (error) {
      message.error("Lỗi phản hồi lịch hẹn.");
    }
  };

  const TableStaffItem = ({ person, roleLabel, roleColor }) => (
    <div className="flex items-start gap-2 mb-1 last:mb-0">
      <Avatar src={person.user_avatar} size="small" icon={<UserOutlined />} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <Text strong style={{ fontSize: '12px' }}>{person.user_fullName}</Text>
          <Tag color={roleColor} style={{ fontSize: '9px', lineHeight: '14px', margin: 0 }}>{roleLabel}</Tag>
        </div>
        <Text type="secondary" style={{ fontSize: '10px' }}><PhoneOutlined /> {person.user_phone}</Text>
      </div>
    </div>
  );

  const appointmentColumns = [
    {
      title: "Thông tin lịch hẹn",
      key: "info",
      width: "30%",
      render: (_, record) => (
        <div className={`p-3 rounded-lg border-l-4 ${record.legal_case ? "bg-blue-50 border-blue-500" : "bg-purple-50 border-purple-500"}`}>
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <ClockCircleOutlined /> {dayjs(record.date_time).format("HH:mm - DD/MM/YYYY")}
          </div>
          <div className="mt-1 font-medium">{record.title}</div>
          {record.legal_case && (
            <Tag icon={<SolutionOutlined />} color="blue" className="mt-2">Vụ việc #{record.legal_case}</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Người tham gia",
      key: "attendees",
      width: "35%",
      render: (_, record) => (
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
          {record.attendee_details?.map((p) => {
            const roleMap = { 0: "Khách", 1: "Tư vấn", 2: "Trợ lý", 3: "Luật sư", 4: "Admin" };
            const colorMap = { 0: "default", 1: "orange", 2: "cyan", 3: "blue", 4: "red" };
            return (
              <div key={p.user.user_id} className="flex items-center justify-between bg-white p-1.5 rounded border border-gray-100 shadow-sm">
                <TableStaffItem person={p.user} roleLabel={roleMap[p.user.user_role]} roleColor={colorMap[p.user.user_role]} />
                <Tag color={p.status === "ACCEPTED" ? "green" : p.status === "PENDING" ? "orange" : "red"}>
                  {p.status === "ACCEPTED" ? "Có mặt" : p.status === "PENDING" ? "Chờ" : "Vắng"}
                </Tag>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: "Địa điểm & Ghi chú",
      key: "location",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong><EnvironmentOutlined className="text-red-500" /> {record.location}</Text>
          <Text type="secondary" className="text-xs italic">{record.note || "Không có ghi chú"}</Text>
        </Space>
      ),
    },
    {
      title: "Thao tác",
      align: "right",
      render: (_, record) => {
        const isCreator = record.creator === user.user_id || record.creator?.user_id === user.user_id;
        const myResponse = record.attendee_details?.find((p) => p.user.user_id === user.user_id);

        return (
          <Space>
            {isCreator ? (
              <>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => {
                  setEditingAppointment(record);
                  setAppointmentType(record.legal_case ? "CLIENT" : "INTERNAL");
                  setIsAppointModalOpen(true);
                  form.setFieldsValue({
                    ...record,
                    date_time: dayjs(record.date_time),
                    end_time: dayjs(record.end_time),
                  });
                }} />
                <Popconfirm title="Xóa lịch hẹn này?" onConfirm={() => appoimentService.camcel_appoiment(record.id).then(fetchData)}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            ) : (
              myResponse?.status === "PENDING" && (
                <Space>
                  <Button size="small" type="primary" className="bg-green-600" onClick={() => handleResponse(record.id, "ACCEPTED")}>Đồng ý</Button>
                  <Button size="small" danger onClick={() => handleResponse(record.id, "DECLINED")}>Từ chối</Button>
                </Space>
              )
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="mb-6 shadow-sm border-0 rounded-xl">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} className="m-0 text-blue-800">
              <TeamOutlined /> Quản lý Lịch hẹn & Công việc
            </Title>
            <Text type="secondary">Dành cho Trợ lý và Lễ tân điều phối lịch trình</Text>
          </Col>
          <Col className="flex gap-4 items-center">
            <Statistic title="Lịch chờ phản hồi" value={myAppoiments.filter(a => a.attendee_details?.some(p => p.user.user_id === user.user_id && p.status === "PENDING")).length} prefix={<ClockCircleOutlined />} />
            <Button type="primary" size="large" icon={<PlusOutlined />} className="bg-blue-600 h-12 px-6 rounded-lg shadow-md" onClick={() => {
              setEditingAppointment(null);
              setAppointmentType("CLIENT");
              form.resetFields();
              setIsAppointModalOpen(true);
            }}>Tạo lịch hẹn</Button>
          </Col>
        </Row>
      </Card>

      <Table dataSource={myAppoiments} columns={appointmentColumns} rowKey="id" loading={loading} className="bg-white rounded-xl shadow-sm overflow-hidden" pagination={{ pageSize: 8 }} />

      <Modal
        title={<Space><CalendarOutlined /> {editingAppointment ? "CẬP NHẬT LỊCH" : "THIẾT LẬP LỊCH MỚI"}</Space>}
        open={isAppointModalOpen}
        onCancel={() => setIsAppointModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createAppointLoading}
        width={650}
        centered
      >
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex flex-col items-center border border-blue-100">
          <Text type="secondary" className="mb-2 uppercase text-[10px] font-bold tracking-widest text-blue-600">Chọn hình thức cuộc hẹn</Text>
          <Radio.Group value={appointmentType} onChange={(e) => {
            setAppointmentType(e.target.value);
            form.setFieldsValue({ legal_case: undefined });
          }} optionType="button" buttonStyle="solid">
            <Radio.Button value="CLIENT" className="w-40 text-center"><SolutionOutlined /> Tiếp Khách</Radio.Button>
            <Radio.Button value="INTERNAL" className="w-40 text-center"><TeamOutlined /> Họp Nội Bộ</Radio.Button>
          </Radio.Group>
        </div>

        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdateAppointment}>
          <Form.Item name="title" label={<Text strong>Tiêu đề cuộc hẹn</Text>} rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}>
            <Input placeholder="VD: Tiếp khách ký hợp đồng, Họp chuẩn bị hồ sơ vụ #12..." />
          </Form.Item>

          {appointmentType === "CLIENT" && (
            <Form.Item name="legal_case" label={<Text strong>Vụ việc liên quan</Text>} rules={[{ required: true, message: 'Bắt buộc chọn vụ việc!' }]}>
              <Select showSearch placeholder="Tìm hồ sơ vụ việc..." optionFilterProp="label"
                options={myCases.map(c => ({ value: c.id, label: `[#${c.id}] ${c.title} - KH: ${c.client?.user_fullName}` }))}
              />
            </Form.Item>
          )}

          <Form.Item name="attendees" label={<Text strong>Mời nhân sự tham gia</Text>}>
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

          <Form.Item name="location" label={<Text strong>Địa điểm</Text>} initialValue="Văn phòng Luật Sư">
            <Input prefix={<EnvironmentOutlined />} placeholder="Phòng họp A, Tòa án, hoặc link online..." />
          </Form.Item>

          <Form.Item name="note" label={<Text strong>Ghi chú chuẩn bị</Text>}>
            <TextArea rows={3} placeholder="Các hồ sơ cần mang theo hoặc nội dung cần lưu ý..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssistantAppointmentManager;