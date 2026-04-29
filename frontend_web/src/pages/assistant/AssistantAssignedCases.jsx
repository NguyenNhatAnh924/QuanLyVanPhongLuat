import React, { useCallback, useEffect, useState } from "react";
import {
  Popconfirm,
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Avatar,
  Modal,
  Card,
  Steps,
  Tabs,
  Badge,
  message,
  Typography,
  Descriptions,
  Form,
  Input,
  List,
  Progress,
  Alert,
  Timeline,
  Divider,
  Empty
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  SyncOutlined,
  TeamOutlined,
  WarningOutlined
} from "@ant-design/icons";
import legalCaseService from "../../services/legalCaseService";
import documentService from "../../services/documentService";
import taskService from "../../services/taskService";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;

const AssistantAssignedCases = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setselectedDocument] = useState(null);
  const [uploadForm] = Form.useForm();

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await legalCaseService.list_legaCase();
      setData(res);
      return res;
    } catch (error) {
      message.error("Không thể tải danh sách vụ việc");
      console.log(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    if (selectedDocument && isUploadModalOpen) {
      uploadForm.setFieldsValue({
        document_name: selectedDocument.document_name,
        document_file: selectedDocument.file,
      });
    }
  }, [selectedDocument, isUploadModalOpen, uploadForm]);

  useEffect(() => {
    if (selectedCase && data.length > 0) {
      const freshCase = data.find((c) => c.id === selectedCase.id);
      if (freshCase) {
        setSelectedCase(freshCase);
      }
    }
  }, [data, selectedCase]);

  const handleUpload = async () => {
    try {
      setLoading(true);
      const values = await uploadForm.validateFields();
      const formData = new FormData();
      if (!selectedDocument) {
        formData.append("legal_case", selectedCase.id);
      }
      formData.append("document_name", values.document_name);
      if (values.document_file instanceof File) {
        formData.append("file", values.document_file);
      }

      if (selectedDocument) {
        await documentService.update(selectedDocument.id, formData);
        message.success("Cập nhật thành công.");
      } else {
        await documentService.create(formData);
        message.success("Tải lên thành công.");
      }

      await fetchCases();
      setIsUploadModalOpen(false);
      uploadForm.resetFields();
    } catch (error) {
      message.error("Upload không thành công.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await documentService.delete(id);
      message.success("Xóa tài liệu thành công.");
      fetchCases();
    } catch (error) {
      console.log(error);
      message.error("Xóa tài liệu thất bại.");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      message.success("Cập nhật trạng thái công việc thành công!");
      fetchCases();
    } catch (error) {
      console.log(error);
      message.error("Không thể cập nhật trạng thái công việc.");
    }
  };

  const statusConfig = {
    DRAFT: { color: "orange", text: "Bản nháp", icon: <ClockCircleOutlined /> },
    FINAL: { color: "green", text: "Chính thức", icon: <CheckCircleOutlined /> },
    REJECTED: { color: "red", text: "Cần chỉnh sửa", icon: <EditOutlined /> },
  };

  const caseStatusMap = {
    PROCESSING: { color: "processing", text: "Đang xử lý" },
    CONFIRMED: { color: "success", text: "Xác nhận" },
    CANCELLED: { color: "error", text: "Đã hủy" },
    REJECTED: { color: "warning", text: "Từ chối" },
    LIQUIDATED: { color: "blue", text: "Hoàn thành" },
  };

  const columns = [
    {
      title: "Vụ việc / Ngày tạo",
      width: "35%",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-bold text-teal-800 text-base">
            {record.title}
          </span>
          <span className="text-xs text-gray-500">
            <ClockCircleOutlined className="mr-1" />
            {new Date(record.created_at).toLocaleDateString("vi-VN")}
          </span>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      width: "25%",
      render: (_, record) => (
        <Space>
          <Avatar src={record.client?.user_avatar} icon={<UserOutlined />} />
          <Text strong>{record.client?.user_fullName}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      width: "20%",
      render: (_, record) => {
        const statusInfo = caseStatusMap[record.status] || { color: "default", text: record.status };
        return (
          <div className="flex flex-col gap-1 items-start">
             <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
             <div className="w-full max-w-[120px] mt-1">
                <Progress percent={record.overall_progress || 0} size="small" />
             </div>
          </div>
        );
      },
    },
    {
      title: "Hành động",
      width: "20%",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          className="bg-teal-600"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCase(record);
            setIsModalOpen(true);
          }}
        >
          Xử lý hồ sơ
        </Button>
      ),
    },
  ];

  const TableStaffItem = ({ person, roleLabel }) => {
    if (!person) return null;
    return (
      <div className="flex items-center gap-2 mb-2">
        <Avatar size="small" src={person.user_avatar} icon={<UserOutlined />} />
        <div className="flex flex-col">
          <Text strong className="text-xs">{person.user_fullName}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>{roleLabel} - {person.user_phone}</Text>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-900 border-l-4 border-teal-600 pl-3">
          Hồ sơ vụ việc đang hỗ trợ
        </h2>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        className="shadow-sm bg-white rounded-lg"
      />

      <Modal
        title={
          <span className="text-xl font-bold text-teal-900">
            Hồ sơ #{selectedCase?.id}: {selectedCase?.title}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        footer={null}
        styles={{ body: { padding: '16px 0' } }}
      >
        {selectedCase && (
          <div className="px-6">
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: "Thông tin & Tiến độ",
                  children: (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="md:col-span-1 flex flex-col gap-4">
                        <Card title="Khách hàng" size="small" className="bg-teal-50 border-none shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar size={40} src={selectedCase.client?.user_avatar} icon={<UserOutlined />} />
                            <div>
                              <Text strong className="block">{selectedCase.client?.user_fullName}</Text>
                              <Text type="secondary" className="text-xs"><PhoneOutlined /> {selectedCase.client?.user_phone}</Text>
                            </div>
                          </div>
                        </Card>

                        {selectedCase.opposing_party_name && (
                          <Card title={<span className="text-red-600">Bên đối lập</span>} size="small" className="border-red-100 shadow-sm">
                            <Text strong className="block mb-1">{selectedCase.opposing_party_name}</Text>
                            <Text type="secondary" className="text-xs"><EnvironmentOutlined /> {selectedCase.opposing_party_address}</Text>
                          </Card>
                        )}

                        <Card title={<span className="text-blue-700"><TeamOutlined className="mr-2"/>Đội ngũ phụ trách</span>} size="small" className="shadow-sm border-blue-100">
                          <TableStaffItem person={selectedCase.assigned_lawyer} roleLabel="Luật sư" />
                          <TableStaffItem person={selectedCase.assistant} roleLabel="Trợ lý" />
                          <TableStaffItem person={selectedCase.consultant} roleLabel="Tư vấn viên" />
                        </Card>
                      </div>

                      <div className="md:col-span-2 flex flex-col gap-4">
                        {selectedCase.is_coi_flagged && (
                           <Alert 
                              message={<span className="font-bold text-red-700">CẢNH BÁO XUNG ĐỘT LỢI ÍCH (COI)</span>} 
                              description={<span className="text-xs whitespace-pre-wrap">{selectedCase.coi_note}</span>} 
                              type="error" 
                              showIcon 
                              icon={<WarningOutlined className="text-xl"/>}
                           />
                        )}

                        <Card title="Nội dung vụ việc" size="small" className="shadow-sm">
                          <Paragraph className="text-gray-600 italic text-sm text-justify mb-0">
                            {selectedCase.description || "Chưa có mô tả..."}
                          </Paragraph>
                        </Card>

                        <Card title="Lộ trình & Tiến độ" size="small" className="shadow-sm">
                            <div className="mb-6 px-4">
                              <Progress 
                                 percent={selectedCase.overall_progress || 0} 
                                 status={selectedCase.status === "CANCELLED" ? "exception" : "active"}
                              />
                            </div>
                            
                           {selectedCase.progress_steps?.length > 0 ? (
                             <Steps
                               orientation="vertical"
                               size="small"
                               items={selectedCase.progress_steps.map((step) => ({
                                 title: <span className={step.is_completed ? "text-gray-400 line-through" : "font-semibold"}>{step.title}</span>,
                                 content: (
                                   <div className="text-[11px] text-gray-500 mt-1 pb-2">
                                     <ClockCircleOutlined className="mr-1" />
                                     {step.is_completed && step.completed_at
                                       ? `Hoàn thành lúc: ${dayjs(step.completed_at).format('HH:mm DD/MM/YY')}` 
                                       : `Hạn chót: ${dayjs(step.deadline).format('HH:mm DD/MM/YY')}`}
                                   </div>
                                 ),
                               }))}
                             />
                           ) : (
                              <Empty description="Chưa có lộ trình" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                           )}
                        </Card>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: <span><FileProtectOutlined /> Hợp đồng ({selectedCase.contracts?.length || 0})</span>,
                  children: (
                    <div className="max-h-[500px] overflow-y-auto pt-2">
                       {selectedCase.contracts?.length > 0 ? (
                          selectedCase.contracts.map((c) => (
                             <Card key={c.id} size="small" className="mb-3 border-l-4 border-l-blue-500 shadow-sm"
                                title={<span className="font-bold text-gray-700">Hợp đồng: {c.contract_number}</span>}
                                extra={<Tag color={c.status === 'SIGNED' ? 'green' : 'orange'}>{c.status}</Tag>}
                             >
                                <Descriptions size="small" column={2}>
                                   <Descriptions.Item label="Giá trị">{Number(c.total_value).toLocaleString()} đ</Descriptions.Item>
                                   <Descriptions.Item label="Đã thanh toán"><Text type="success">{c.total_paid?.toLocaleString() || 0} đ</Text></Descriptions.Item>
                                   <Descriptions.Item label="Còn lại"><Text type="danger">{c.remaining_balance?.toLocaleString() || 0} đ</Text></Descriptions.Item>
                                </Descriptions>
                             </Card>
                          ))
                       ) : (
                          <Empty description="Vụ việc chưa phát sinh hợp đồng" className="py-10" />
                       )}
                    </div>
                  )
                },
                {
                  key: "3",
                  label: (
                    <span>
                      <FilePdfOutlined /> Tài liệu ({selectedCase.documents?.length || 0})
                    </span>
                  ),
                  children: (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-end sticky top-0 z-10 bg-white pb-2 pt-2">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setselectedDocument(null);
                            setIsUploadModalOpen(true);
                          }}
                          className="bg-teal-600 hover:bg-teal-500 shadow-md"
                        >
                          Thêm bản thảo mới
                        </Button>
                      </div>

                      <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedCase.documents?.length > 0 ? (
                          selectedCase.documents.map((doc) => {
                            const isClientDoc = doc.upload_by?.user_role === 0;
                            const config = statusConfig[doc.status] || {
                              color: "default",
                              text: doc.status,
                            };

                            return (
                              <Card
                                key={doc.id}
                                size="small"
                                className={`mb-3 border-l-4 shadow-sm transition-all hover:shadow-md 
                  ${
                    doc.status === "FINAL"
                      ? "border-l-green-500"
                      : doc.status === "REJECTED"
                        ? "border-l-red-500"
                        : "border-l-orange-400"
                  }`}
                                title={
                                  <div className="flex justify-between items-center">
                                    <Space>
                                      <Text strong className="text-teal-900">
                                        {doc.document_name}
                                      </Text>
                                      <Tag
                                        color={config.color}
                                        icon={config.icon}
                                      >
                                        {config.text}
                                      </Tag>
                                    </Space>

                                    <Space size="small">
                                      {!isClientDoc && doc.status !== "FINAL" && (
                                        <>
                                          <Tooltip
                                            title={
                                              doc.status === "REJECTED"
                                                ? "Chỉnh sửa theo yêu cầu"
                                                : "Cập nhật bản mới"
                                            }
                                          >
                                            <Button
                                              type="text"
                                              size="small"
                                              className={
                                                doc.status === "REJECTED"
                                                  ? "text-red-600 animate-pulse"
                                                  : "text-blue-600"
                                              }
                                              icon={<EditOutlined />}
                                              onClick={() => {
                                                setselectedDocument(doc);
                                                setIsUploadModalOpen(true);
                                              }}
                                            />
                                          </Tooltip>

                                          <Popconfirm
                                            title="Xóa bản thảo này?"
                                            onConfirm={() => handleDeleteDocument(doc.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                          >
                                            <Button
                                              type="text"
                                              size="small"
                                              danger
                                              icon={<DeleteOutlined />}
                                            />
                                          </Popconfirm>
                                        </>
                                      )}
                                    </Space>
                                  </div>
                                }
                              >
                                <Descriptions
                                  column={2}
                                  size="small"
                                  layout="horizontal"
                                  className="bg-gray-50/50 p-2 rounded"
                                >
                                  <Descriptions.Item
                                    label={<span className="text-gray-500">Người tải</span>}
                                  >
                                    {isClientDoc ? (
                                      <Tag color="purple" size="small">
                                        Khách hàng
                                      </Tag>
                                    ) : (
                                      <Space>
                                        <Avatar
                                          size={18}
                                          src={doc.upload_by?.user_avatar}
                                          icon={<UserOutlined />}
                                        />
                                        <span className="text-xs">
                                          {doc.upload_by?.user_fullName}
                                        </span>
                                      </Space>
                                    )}
                                  </Descriptions.Item>

                                  <Descriptions.Item
                                    label={<span className="text-gray-500">Ngày tải</span>}
                                  >
                                    <span className="text-xs text-gray-600">
                                      {new Date(doc.uploaded_at).toLocaleDateString("vi-VN")}
                                    </span>
                                  </Descriptions.Item>

                                  <Descriptions.Item
                                    label={<span className="text-gray-500">Tệp tin</span>}
                                    span={2}
                                  >
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<FilePdfOutlined />}
                                      href={doc.file}
                                      target="_blank"
                                      className="p-0 h-auto text-teal-600 font-medium"
                                    >
                                      Xem / Tải tài liệu
                                    </Button>
                                  </Descriptions.Item>
                                </Descriptions>

                                {doc.status === "REJECTED" && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-[11px] text-red-600">
                                    <LockOutlined className="mr-1" />
                                    Luật sư yêu cầu chỉnh sửa lại bản thảo này.
                                    Vui lòng kiểm tra và cập nhật file mới.
                                  </div>
                                )}

                                {isClientDoc && (
                                  <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1 italic">
                                    <LockOutlined /> Tài liệu gốc từ khách hàng -
                                    Không thể chỉnh sửa
                                  </div>
                                )}
                              </Card>
                            );
                          })
                        ) : (
                          <div className="py-10 text-center text-gray-400">
                            <FilePdfOutlined
                              style={{ fontSize: 24 }}
                              className="mb-2 block"
                            />
                            Chưa có tài liệu nào được tải lên
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "4",
                  label: `Lịch hẹn (${selectedCase.appointments?.length || 0})`,
                  children: (
                    <div className="max-h-[450px] overflow-y-auto pr-2 pt-2">
                      {selectedCase.appointments?.length > 0 ? (
                        selectedCase.appointments.map((apt) => (
                          <Card
                            key={apt.id}
                            size="small"
                            className="mb-3 border-l-4 border-l-teal-500 shadow-sm"
                            title={
                              <div className="flex justify-between items-center">
                                <Text strong className="text-teal-700">
                                  {apt.title}
                                </Text>

                                <Tag
                                  color={
                                    apt.status === "CONFIRMED"
                                      ? "green"
                                      : apt.status === "PENDING"
                                        ? "gold"
                                        : "red"
                                  }
                                >
                                  {apt.status === "CONFIRMED"
                                    ? "Đã xác nhận"
                                    : apt.status === "PENDING"
                                      ? "Chờ xác nhận"
                                      : apt.status}
                                </Tag>
                              </div>
                            }
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <Space orientation="vertical" size={2}>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <ClockCircleOutlined className="text-teal-500" />
                                  <span>
                                    {new Date(apt.date_time).toLocaleString("vi-VN",{ hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",})}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600">
                                  <EnvironmentOutlined className="text-teal-500" />
                                  <span>
                                    {apt.location || "Chưa cập nhật địa điểm"}
                                  </span>
                                </div>
                              </Space>

                              <div className="mt-2 md:mt-0">
                                <Text type="secondary" size="small">
                                  Người tham gia:
                                </Text>

                                <div className="flex -space-x-2 mt-2 overflow-hidden">
                                  {apt.attendee_details?.length > 0 ? (
                                    apt.attendee_details.map((attendee) => (
                                      <Tooltip
                                        key={attendee.user?.user_id}
                                        title={`${attendee.user?.user_fullName} (${attendee.status})`}
                                      >
                                        <Avatar
                                          size="small"
                                          src={attendee.user?.user_avatar}
                                          className="border-2 border-white"
                                        />
                                      </Tooltip>
                                    ))
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">
                                      Chưa có người tham gia
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {apt.note && (
                              <div className="mt-3 p-2 bg-gray-50 rounded italic text-gray-500 text-xs">
                                Ghi chú: {apt.note}
                              </div>
                            )}
                          </Card>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 italic text-sm mt-6">
                          Chưa có lịch hẹn nào cho vụ việc này
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "5",
                  label: `Nhiệm vụ (${selectedCase.tasks?.length || 0})`,
                  children: (
                    <div className="max-h-[450px] overflow-y-auto pr-2 pt-2">
                      <div className="flex flex-col gap-3">
                        {selectedCase.tasks && selectedCase.tasks.length > 0 ? (
                          selectedCase.tasks.map((task) => (
                            <Card
                              key={task.id}
                              size="small"
                              className="border-l-4 shadow-sm"
                              style={{
                                borderLeftColor:
                                  task.priority === "URGENT"
                                    ? "#ff4d4f"
                                    : "#13c2c2",
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <Space orientation="vertical" size={0}>
                                  <Text strong className="text-base">
                                    {task.title}
                                  </Text>
                                  <Text type="secondary" size="small">
                                    <ClockCircleOutlined /> Hạn chót:{" "}
                                    {new Date(task.deadline).toLocaleString("vi-VN")}
                                  </Text>
                                </Space>
                                <Space>
                                  {task.priority === "URGENT" && (
                                    <Tag color="red">Khẩn cấp</Tag>
                                  )}

                                  <select
                                    className={`border rounded px-2 py-1 text-sm font-medium outline-none ${
                                      task.status === "COMPLETED"
                                        ? "bg-green-50 text-green-600 border-green-200"
                                        : "bg-blue-50 text-blue-600 border-blue-200"
                                    }`}
                                    value={task.status}
                                    onChange={(e) =>
                                      handleUpdateTaskStatus(
                                        task.id,
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="TODO">Cần làm</option>
                                    <option value="IN_PROGRESS">Đang làm</option>
                                    <option value="DONE">Hoàn thành</option>
                                  </select>
                                </Space>
                              </div>

                              <div className="mt-2 text-gray-600 bg-gray-50 p-2 rounded italic text-sm">
                                {task.description}
                              </div>

                              <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
                                <Space>
                                  <Avatar size="small" src={task.creator?.user_avatar} icon={<UserOutlined/>} />
                                  <span>Giao bởi: {task.creator?.user_fullName}</span>
                                </Space>
                              </div>
                            </Card>
                          ))
                        ) : null}
                      </div>
                      {(!selectedCase.tasks || selectedCase.tasks.length === 0) && (
                        <div className="text-center py-10 text-gray-400 italic">
                          Không có nhiệm vụ nào được giao.
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                   key: "6",
                   label: <span><ClockCircleOutlined /> Lịch sử</span>,
                   children: (
                     <div className="max-h-[500px] overflow-y-auto pt-4 pl-2">
                        {selectedCase.logs?.length > 0 ? (
                           <Timeline 
                              items={selectedCase.logs.map(log => ({
                                 color: 'blue',
                                 content: (
                                    <div className="pb-4">
                                       <Text strong className="block text-gray-700">{log.action}</Text>
                                       <div className="flex items-center gap-2 mt-1">
                                          <Tag color="processing" className="m-0 text-[10px] border-none">{log.stage_display}</Tag>
                                          <Text type="secondary" className="text-[11px]">{dayjs(log.date_occurred).format('HH:mm DD/MM/YYYY')}</Text>
                                       </div>
                                       {log.note && <div className="mt-2 text-xs italic bg-gray-50 p-2 rounded border border-gray-100">{log.note}</div>}
                                    </div>
                                 )
                              }))}
                           />
                        ) : (
                           <Empty description="Chưa có lịch sử hoạt động" className="py-10" />
                        )}
                     </div>
                   )
                }
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={
          <span className="text-teal-700">
            {selectedDocument
              ? "Cập nhật bản thảo tài liệu"
              : "Tải lên bản thảo mới"}
          </span>
        }
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setselectedDocument(null);
        }}
        onOk={() => uploadForm.submit()}
        okText={selectedDocument ? "Cập nhật" : "Tải lên bản nháp"}
        confirmLoading={loading}
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            label="Tên tài liệu:"
            name="document_name"
            rules={[{ required: true, message: "Vui lòng nhập tên tài liệu" }]}
          >
            <Input className="w-full border p-2 rounded mt-1 mb-4" />
          </Form.Item>

          <Form.Item
            label="Chọn file:"
            name="document_file"
            rules={[{ required: !selectedDocument, message: "Vui lòng chọn file" }]}
            valuePropName="file"
            getValueFromEvent={(e) => e.target.files[0]}
          >
            <input type="file" />
          </Form.Item>
          {selectedDocument && (
            <div className="mb-4 p-2 bg-gray-50 border border-dashed rounded">
              <Text type="secondary" size="small">
                File hiện tại:{" "}
              </Text>
              <a
                href={selectedDocument.file}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500"
              >
                <FilePdfOutlined /> {selectedDocument.document_name} (Xem cũ)
              </a>
              <p className="text-[11px] text-gray-400 mt-1 italic">
                * Tải lên file mới nếu bạn muốn thay thế bản này.
              </p>
            </div>
          )}

          <p className="text-xs text-orange-500 mt-2 italic">
            * Lưu ý: Tài liệu bạn tải lên sẽ mặc định ở trạng thái Nháp và cần
            Luật sư phê duyệt để trở thành Chính thức.
          </p>
        </Form>
      </Modal>
    </div>
  );
};

export default AssistantAssignedCases;