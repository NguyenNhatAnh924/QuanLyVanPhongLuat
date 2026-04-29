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
  Descriptions,
  Card,
  Steps,
  Tabs,
  Badge,
  message,
  Form,
  Input,
  DatePicker,
  Typography,
  Empty,
  InputNumber,
  Select,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  MinusCircleOutlined,
  ProjectOutlined,
  SolutionOutlined,
  CheckCircleFilled,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useForm } from "antd/es/form/Form";

import legalCaseService from "../../services/legalCaseService";
import caseLogService from "../../services/caseLogService";
import documentService from "../../services/documentService";
import taskService from "../../services/taskService";
import progressStepService from "../../services/progressStepService";
import contractService from "../../services/contractService";

const { Text } = Typography;

const statusConfig = {
  DRAFT: { color: "orange", text: "Bản nháp" },
  FINAL: { color: "green", text: "Chính thức" },
  REJECTED: { color: "red", text: "Cần chỉnh sửa" },
};

const AssignedCases = () => {
  // --- STATES ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload States
  const [newDocName, setNewDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [contractFile, setContractFile] = useState(null); // Lưu file hợp đồng
  const [uploadLoading, setUploadLoading] = useState(false);

  // Forms
  const [logForm] = useForm();
  const [taskForm] = useForm();
  const [setupForm] = useForm();

  // --- FETCH DATA ---
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res_list_case = await legalCaseService.list_legaCase();
      setData(res_list_case);
    } catch (error) {
      console.log(error);
      message.error("Lỗi khi tải dữ liệu vụ việc.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // --- HANDLERS ---
  console.log(data)
  // Đóng vụ việc (Hoàn thành)
  const handleCloseCase = async () => {
    try {
      setLoading(true);
      // Gọi hàm closeCase bạn vừa thêm ở file legalCaseService
      await legalCaseService.closeCase(selectedCase.id);

      message.success("Đã kết thúc và đóng vụ việc thành công!");
      setIsModalOpen(false); 
      fetchCases(); 
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra khi đóng vụ việc.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Lập lộ trình và tạo hợp đồng (TAB 1)
  const handleCreateTimelineAndContract = async (values) => {
    try {
      if (!values.steps || values.steps.length === 0) {
        message.warning("Vui lòng thêm ít nhất 1 bước tiến độ!");
        return;
      }

      setLoading(true);

      // 1. Chuẩn bị Payload cho Lộ trình (JSON Mảng các bước)
      const stepsPayload = values.steps.map((step, index) => ({
        case: selectedCase.id,
        step_order: index + 1,
        title: step.title,
        deadline: step.deadline.format("YYYY-MM-DDTHH:mm:ss"),
        is_completed: false,
      }));

      // Gọi API tạo nhiều bước cùng lúc
      await progressStepService.create(stepsPayload);

      // 2. Chuẩn bị Payload cho Hợp đồng (Dùng FormData vì có file)
      const contractFormData = new FormData();
      contractFormData.append("legal_case", selectedCase.id);
      contractFormData.append("total_value", values.total_value);
      contractFormData.append("content", values.content);

      // Nếu có chọn file hợp đồng đính kèm thì đẩy lên
      if (contractFile) {
        contractFormData.append("signed_file", contractFile);
      }

      // Gọi API tạo hợp đồng
      await contractService.createContract(contractFormData);

      message.success("Đã thiết lập lộ trình và tạo hợp đồng thành công!");

      setupForm.resetFields();
      setContractFile(null);
      setIsModalOpen(false);
      fetchCases();
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.error || "Có lỗi xảy ra khi tạo dữ liệu.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Cập nhật trạng thái hoàn thành bước tiến độ (TAB 1)
  const handleCompleteStep = async (stepId) => {
    try {
      await progressStepService.updateStepStatus(stepId, true);
      message.success("Đã xác nhận hoàn thành bước công việc!");

      setSelectedCase((prev) => ({
        ...prev,
        progress_steps: prev.progress_steps.map((step) =>
          step.id === stepId ? { ...step, is_completed: true } : step,
        ),
      }));

      fetchCases();
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra khi cập nhật tiến độ.");
    }
  };

  // 3. Tải lên tài liệu (TAB 3)
  const handleUpload = async () => {
    if (!newDocName || !selectedFile) {
      message.warning("Vui lòng nhập tên tài liệu và chọn file!");
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("document_name", newDocName);
    formData.append("file", selectedFile);
    formData.append("legal_case", selectedCase.id);

    try {
      const res = await documentService.create(formData);
      message.success("Tải lên thành công!");
      setIsUploadModalOpen(false);

      const updatedDocs = [...(selectedCase.documents || []), res];
      setSelectedCase((prev) => ({ ...prev, documents: updatedDocs }));
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedCase.id
            ? { ...item, documents: updatedDocs }
            : item,
        ),
      );

      setNewDocName("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload lỗi:", error);
      message.error("Có lỗi xảy ra khi tải lên.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await documentService.delete(id);
      message.success("Xóa tài liệu thành công.");

      const updatedDocs = selectedCase.documents.filter((doc) => doc.id !== id);
      setSelectedCase((prev) => ({ ...prev, documents: updatedDocs }));
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedCase.id
            ? { ...item, documents: updatedDocs }
            : item,
        ),
      );
    } catch (error) {
      console.log(error);
      message.error("Xóa tài liệu thất bại.");
    }
  };

  const handleConfirmDocument = async (id) => {
    try {
      await documentService.confirm(id);
      message.success("Xác nhận tài liệu thành công.");

      const updatedDocs = selectedCase.documents.map((doc) =>
        doc.id === id ? { ...doc, status: "FINAL" } : doc,
      );
      setSelectedCase((prev) => ({ ...prev, documents: updatedDocs }));
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedCase.id
            ? { ...item, documents: updatedDocs }
            : item,
        ),
      );
    } catch (error) {
      console.log(error);
      message.error("Xác nhận tài liệu thất bại.");
    }
  };

  const handleReject = async (id) => {
    try {
      await documentService.decline(id);
      message.success("Từ chối tài liệu thành công.");

      const updatedDocs = selectedCase.documents.map((doc) =>
        doc.id === id ? { ...doc, status: "REJECTED" } : doc,
      );
      setSelectedCase((prev) => ({ ...prev, documents: updatedDocs }));
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedCase.id
            ? { ...item, documents: updatedDocs }
            : item,
        ),
      );
    } catch (error) {
      console.log(error);
      message.error("Từ chối tài liệu thất bại.");
    }
  };

  // 4. Ghi Nhật ký (TAB 4)
  const handleSaveLog = async () => {
    try {
      const value = await logForm.validateFields();
      const payload = {
        legal_case: selectedCase.id,
        action: value.action,
        note: value.note || "",
        date_occurred: value.date_occurred
          ? value.date_occurred.format("YYYY-MM-DDTHH:mm:ss")
          : null,
      };

      const newLog = await caseLogService.createLog(payload);
      message.success("Thêm nhật ký thành công.");

      const updatedLogs = [newLog, ...(selectedCase.logs || [])];
      setSelectedCase((prev) => ({ ...prev, logs: updatedLogs }));
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedCase.id ? { ...item, logs: updatedLogs } : item,
        ),
      );

      logForm.resetFields();
      setIsLogModalOpen(false);
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra khi lưu nhật ký.");
    }
  };

  // 5. Tạo Nhiệm vụ (TAB 5)
  const handleSaveTask = async () => {
    try {
      let latestContract = null;
      if (selectedCase && selectedCase.contracts?.length > 0) {
        const sortedContracts = [...selectedCase.contracts].sort(
          (a, b) => new Date(b.signed_date) - new Date(a.signed_date),
        );
        latestContract = sortedContracts[0];
      }

      const value = await taskForm.validateFields();
      const payload = {
        legal_case: selectedCase.id,
        title: value.title,
        assignee: latestContract?.assigned_legal_assistant?.user_id || null,
        description: value.description,
        deadline: value.deadline
          ? value.deadline.format("YYYY-MM-DDTHH:mm:ss")
          : null,
        priority: value.priority,
      };

      const newTask = await taskService.create(payload);
      message.success("Thêm công việc thành công.");

      const updatedTasks = [newTask, ...(selectedCase.tasks || [])];
      setSelectedCase((prev) => ({ ...prev, tasks: updatedTasks }));
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedCase.id ? { ...item, tasks: updatedTasks } : item,
        ),
      );

      taskForm.resetFields();
      setIsTaskModalOpen(false);
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra khi tạo nhiệm vụ");
    }
  };

  // --- UTILS ---
  const formatCurrency = (value) => {
    if (!value) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "TODO":
        return "default";
      case "IN_PROGRESS":
        return "processing";
      case "DONE":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW":
        return "green";
      case "MEDIUM":
        return "blue";
      case "HIGH":
        return "orange";
      case "URGENT":
        return "red";
      default:
        return "default";
    }
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Vụ việc / Ngày tạo",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-bold text-blue-900 text-base">
            {record.title}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(record.created_at).toLocaleDateString("vi-VN")}
          </span>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "client",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.client?.user_avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-semibold">{record.client?.user_fullName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <PhoneOutlined /> {record.client?.user_phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tiến độ",
      key: "stage",
      render: (_, record) => {
        const totalSteps = record.progress_steps?.length || 0;
        const completedSteps =
          record.progress_steps?.filter((s) => s.is_completed).length || 0;

        return (
          <Tooltip title={`${completedSteps} / ${totalSteps} bước hoàn thành`}>
            <Tag color="cyan" icon={<ClockCircleOutlined />}>
              {totalSteps > 0
                ? `${Math.round((completedSteps / totalSteps) * 100)}%`
                : "Chưa thiết lập"}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Hợp đồng",
      key: "contracts",
      render: (_, record) => {
        const totalVal = record.contracts?.reduce(
          (sum, item) => sum + Number(item.total_value || 0),
          0,
        );
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge count={record.contracts?.length || 0} showZero color="blue">
              <Tag>Hợp đồng</Tag>
            </Badge>
            {record.contracts?.length > 0 && (
              <span className="text-xs text-green-600 font-bold">
                {formatCurrency(totalVal)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCase(record);
                setIsModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-blue-900 border-l-4 border-blue-900 pl-3">
        Danh sách Vụ việc được phân công
      </h2>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6 }}
        className="shadow-sm bg-white rounded-lg"
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-4 bg-gray-50 border-t">
              {record.progress_steps?.length > 0 ? (
                <Steps
                  size="small"
                  current={
                    record.progress_steps.filter((s) => s.is_completed).length
                  }
                  items={record.progress_steps.map((s) => ({ title: s.title }))}
                />
              ) : (
                <Text className="text-gray-400 italic">
                  Luật sư chưa thiết lập lộ trình thực hiện cho vụ việc này.
                </Text>
              )}
            </div>
          ),
        }}
      />

      {/* --- MODAL CHI TIẾT --- */}
      <Modal
        title={
          <div className="flex justify-between items-center pr-8">
            <span className="text-xl font-bold text-blue-900">
              Hồ sơ vụ việc: {selectedCase?.title}
            </span>

            {/* Nút Đóng vụ việc chỉ hiện khi vụ việc CHƯA đóng */}
            {selectedCase && selectedCase.status !== "LIQUIDATED" && (
              <Popconfirm
                title="Xác nhận kết thúc vụ việc?"
                description="Bạn có chắc chắn hồ sơ này đã hoàn tất mọi thủ tục?"
                onConfirm={handleCloseCase}
                okText="Đóng vụ việc"
                cancelText="Hủy"
                okButtonProps={{ danger: true }} 
              >
                <Button
                  type="primary"
                  danger
                  icon={<CheckCircleFilled />}
                  className="shadow-sm"
                >
                  Kết thúc vụ việc
                </Button>
              </Popconfirm>
            )}

            {/* Nếu đã đóng rồi thì hiện một cái Tag xanh lá cho đẹp */}
            {selectedCase?.status === "LIQUIDATED" && (
              <Tag color="success" className="text-sm px-3 py-1">
                Đã hoàn thành
              </Tag>
            )}
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setContractFile(null);
        }}
        width={900}
        footer={null}
      >
        {selectedCase && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: (
                  <span>
                    <ProjectOutlined /> Thông tin & Lộ trình
                  </span>
                ),
                children: (
                  <div className="flex flex-col gap-4 mt-2">
                    {/* Thông tin Khách hàng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card
                        size="small"
                        title="Khách hàng"
                        variant="borderless"
                        className="bg-orange-50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            size={50}
                            src={selectedCase.client?.user_avatar}
                            icon={<UserOutlined />}
                          />
                          <div>
                            <div className="font-bold">
                              {selectedCase.client?.user_fullName}
                            </div>
                            <div className="text-gray-500">
                              {selectedCase.client?.user_email}
                            </div>
                            <div className="text-gray-500">
                              {selectedCase.client?.user_phone}
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card
                        size="small"
                        title="Bên đối lập (Nếu có)"
                        variant="borderless"
                        className="bg-red-50"
                      >
                        <p>
                          <strong>Họ tên:</strong>{" "}
                          {selectedCase.opposing_party_name || "Chưa rõ"}
                        </p>
                        <p>
                          <strong>Địa chỉ:</strong>{" "}
                          {selectedCase.opposing_party_address || "Chưa rõ"}
                        </p>
                      </Card>

                      <div className="md:col-span-2">
                        <h4 className="font-bold text-gray-700 mb-1">
                          Nội dung vụ việc:
                        </h4>
                        <div className="bg-gray-100 p-3 rounded text-justify">
                          {selectedCase.description}
                        </div>
                      </div>
                    </div>

                    {selectedCase.progress_steps?.length > 0 ||
                    selectedCase.contracts?.length > 0 ? (
                      <Card
                        title={
                          <span className="text-blue-700 font-bold">
                            <SolutionOutlined className="mr-2" />
                            Lộ trình thực hiện
                          </span>
                        }
                        size="small"
                        className="border-blue-100 shadow-sm rounded-xl"
                      >
                        <Steps
                          orientation="vertical"
                          className="mt-2"
                          items={(selectedCase.progress_steps || []).map(
                            (step, index) => {
                              const isCompleted = step.is_completed;
                              const isActive =
                                !isCompleted &&
                                (index === 0 ||
                                  selectedCase.progress_steps[index - 1]
                                    .is_completed);
                              const isOverdue =
                                !isCompleted &&
                                dayjs(step.deadline).isBefore(dayjs());

                              let stepStatus = "wait";
                              let icon = undefined;

                              if (isCompleted) {
                                stepStatus = "finish";
                                icon = (
                                  <CheckCircleFilled className="text-green-500" />
                                );
                              } else if (isActive) {
                                stepStatus = "process";
                                icon = (
                                  <SyncOutlined
                                    spin
                                    className="text-blue-500"
                                  />
                                );
                              } else if (isOverdue) {
                                stepStatus = "error";
                                icon = (
                                  <InfoCircleOutlined className="text-red-500" />
                                );
                              }

                              return {
                                status: stepStatus,
                                icon: icon,
                                title: (
                                  <span
                                    className={`text-sm ${
                                      isCompleted
                                        ? "text-gray-400 line-through"
                                        : isActive
                                          ? "text-blue-600 font-bold"
                                          : "text-gray-700 font-medium"
                                    }`}
                                  >
                                    {step.title}
                                  </span>
                                ),
                                content: (
                                  <div
                                    className={`mt-2 mb-4 p-3 rounded-lg border transition-all ${
                                      isActive
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-gray-50 border-gray-100"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <div
                                        className={`text-xs ${isOverdue ? "text-red-500 font-bold" : "text-gray-500"}`}
                                      >
                                        <ClockCircleOutlined className="mr-1" />
                                        {isOverdue
                                          ? "Đã quá hạn: "
                                          : "Hạn chót: "}
                                        {dayjs(step.deadline).format(
                                          "HH:mm - DD/MM/YYYY",
                                        )}
                                      </div>

                                      {/* Nếu đã xong thì hiện ngày hoàn thành thực tế */}
                                      {isCompleted && step.completed_at && (
                                        <Tag
                                          color="success"
                                          className="m-0 text-[10px] border-none"
                                        >
                                          Xong:{" "}
                                          {dayjs(step.completed_at).format(
                                            "DD/MM/YY",
                                          )}
                                        </Tag>
                                      )}
                                    </div>

                                    {!isCompleted && (
                                      <Popconfirm
                                        title="Xác nhận hoàn thành bước này?"
                                        okText="Xác nhận"
                                        cancelText="Hủy"
                                        onConfirm={() =>
                                          handleCompleteStep(step.id)
                                        }
                                      >
                                        <Button
                                          size="small"
                                          type={
                                            isActive ? "primary" : "default"
                                          }
                                          className={
                                            isActive
                                              ? "bg-blue-600 shadow-sm"
                                              : ""
                                          }
                                          icon={<CheckOutlined />}
                                        >
                                          Đánh dấu xong
                                        </Button>
                                      </Popconfirm>
                                    )}
                                  </div>
                                ),
                              };
                            },
                          )}
                        />
                      </Card>
                    ) : (
                      <Card
                        title={
                          <span className="text-blue-700 font-bold">
                            Lập Lộ Trình & Tạo Hợp Đồng
                          </span>
                        }
                        size="small"
                        className="bg-blue-50 border-blue-200"
                      >
                        <Form
                          form={setupForm}
                          layout="vertical"
                          onFinish={handleCreateTimelineAndContract}
                        >
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-700 border-b pb-2 mb-3">
                              1. Phân bổ các bước tiến độ
                            </h4>
                            <Form.List name="steps">
                              {(fields, { add, remove }) => (
                                <>
                                  {fields.map(
                                    ({ key, name, ...restField }, index) => (
                                      <div
                                        key={key}
                                        className="flex gap-3 items-start mb-2 bg-white p-3 rounded shadow-sm border border-gray-200"
                                      >
                                        <div className="mt-2 font-bold text-gray-400">
                                          #{index + 1}
                                        </div>
                                        <Form.Item
                                          {...restField}
                                          name={[name, "title"]}
                                          className="mb-0 flex-1"
                                          rules={[
                                            {
                                              required: true,
                                              message: "Nhập tên bước",
                                            },
                                          ]}
                                        >
                                          <Input placeholder="Tên công việc (VD: Thu thập hồ sơ...)" />
                                        </Form.Item>
                                        <Form.Item
                                          {...restField}
                                          name={[name, "deadline"]}
                                          className="mb-0"
                                          rules={[
                                            {
                                              required: true,
                                              message: "Chọn hạn chót",
                                            },
                                          ]}
                                        >
                                          <DatePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Hạn chót"
                                          />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                          className="text-red-500 mt-2 cursor-pointer hover:text-red-700 text-lg"
                                          onClick={() => remove(name)}
                                        />
                                      </div>
                                    ),
                                  )}
                                  <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    className="bg-white"
                                  >
                                    Thêm bước công việc
                                  </Button>
                                </>
                              )}
                            </Form.List>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-700 border-b pb-2 mb-3">
                              2. Lập hợp đồng dịch vụ
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Form.Item
                                name="total_value"
                                label="Giá trị hợp đồng (VNĐ)"
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng nhập giá trị hợp đồng",
                                  },
                                ]}
                              >
                                <InputNumber
                                  className="w-full"
                                  size="large"
                                  formatter={(value) =>
                                    `${value}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ",",
                                    )
                                  }
                                  parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                  }
                                  placeholder="Nhập số tiền..."
                                />
                              </Form.Item>
                            </div>
                            {/* <Form.Item
                              name="content"
                              label="Nội dung / Điều khoản chính"
                              rules={[
                                {
                                  required: true,
                                  message: "Vui lòng nhập nội dung hợp đồng",
                                },
                              ]}
                            >
                              <Input.TextArea
                                rows={4}
                                placeholder="Nhập các thỏa thuận, điều khoản..."
                              />
                            </Form.Item> */}

                            <Form.Item label="Đính kèm file hợp đồng (Bản dự thảo / Bản scan PDF)">
                              <input
                                type="file"
                                className="w-full border p-2 rounded cursor-pointer bg-white"
                                onChange={(e) => {
                                  if (
                                    e.target.files &&
                                    e.target.files.length > 0
                                  ) {
                                    setContractFile(e.target.files[0]);
                                  } else {
                                    setContractFile(null);
                                  }
                                }}
                              />
                            </Form.Item>
                          </div>

                          <div className="text-right mt-4">
                            <Button
                              type="primary"
                              size="large"
                              htmlType="submit"
                              icon={<SaveOutlined />}
                              loading={loading}
                            >
                              Lưu Lộ Trình & Tạo Hợp Đồng
                            </Button>
                          </div>
                        </Form>
                      </Card>
                    )}
                  </div>
                ),
              },

              // TAB 2: HỢP ĐỒNG
              {
                key: "2",
                label: (
                  <span>
                    <FileProtectOutlined /> Hợp đồng (
                    {selectedCase.contracts?.length || 0})
                  </span>
                ),
                children: (
                  <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                    {selectedCase.contracts?.length > 0 ? (
                      selectedCase.contracts.map((contract, index) => (
                        <Card
                          key={contract.id}
                          type="inner"
                          title={`Hợp đồng #${index + 1}: ${contract.contract_number}`}
                          extra={
                            <Tag color="blue">{contract.status_display}</Tag>
                          }
                          className="bg-gray-50"
                        >
                          <Descriptions column={2} size="small">
                            <Descriptions.Item label="Ngày ký">
                              {contract.signed_date || "Chưa ký"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá trị">
                              <span className="text-green-600 font-bold">
                                {formatCurrency(contract.total_value)}
                              </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Luật sư PT">
                              {contract.assigned_lawyer?.user_fullName ||
                                "Chưa có"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trợ lý">
                              {contract.assigned_legal_assistant
                                ?.user_fullName || "Chưa có"}
                            </Descriptions.Item>
                            {/* Hiển thị link Tải/Xem file nếu có */}
                            {contract.signed_file && (
                              <Descriptions.Item label="File đính kèm">
                                <a
                                  href={contract.signed_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs flex items-center gap-1"
                                >
                                  <FilePdfOutlined /> Xem file
                                </a>
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-gray-500 text-xs italic line-clamp-2">
                              {contract.content}
                            </p>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-10">
                        Vụ việc này chưa có hợp đồng nào.
                      </div>
                    )}
                  </div>
                ),
              },

              // TAB 3: TÀI LIỆU
              {
                key: "3",
                label: (
                  <span>
                    <FilePdfOutlined /> Tài liệu (
                    {selectedCase.documents?.length || 0})
                  </span>
                ),
                children: (
                  <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto p-1">
                    <div className="flex justify-end sticky top-0 z-10 bg-white pb-2">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 shadow-md"
                      >
                        Thêm tài liệu mới
                      </Button>
                    </div>

                    {selectedCase.documents?.length > 0 ? (
                      selectedCase.documents.map((doc, index) => (
                        <Card
                          key={doc.id}
                          type="inner"
                          size="small"
                          className="bg-white shadow-sm mb-2 border border-gray-100 hover:border-blue-300 transition-all"
                          title={
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-blue-900">
                                  #{index + 1}: {doc.document_name}
                                </span>
                                <Tag
                                  color={
                                    statusConfig[doc.status]?.color || "default"
                                  }
                                >
                                  {statusConfig[doc.status]?.text ||
                                    "Không xác định"}
                                </Tag>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.status === "DRAFT" && (
                                  <Space size="small">
                                    <Tooltip title="Duyệt tài liệu">
                                      <Button
                                        size="small"
                                        icon={<CheckOutlined />}
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={() =>
                                          handleConfirmDocument(doc.id)
                                        }
                                      />
                                    </Tooltip>
                                    <Tooltip title="Từ chối">
                                      <Button
                                        size="small"
                                        icon={<CloseOutlined />}
                                        danger
                                        onClick={() => handleReject(doc.id)}
                                      />
                                    </Tooltip>
                                  </Space>
                                )}
                                <Popconfirm
                                  title="Xóa tài liệu này?"
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  onConfirm={() => handleDeleteDocument(doc.id)}
                                >
                                  <Button
                                    danger
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>
                              </div>
                            </div>
                          }
                        >
                          <Descriptions
                            column={2}
                            size="small"
                            layout="horizontal"
                            bordered
                            className="bg-gray-50"
                          >
                            <Descriptions.Item label="Người upload">
                              <Space>
                                <Avatar
                                  size="small"
                                  src={doc.upload_by?.user_avatar}
                                  icon={<UserOutlined />}
                                />
                                <span className="text-xs">
                                  {doc.upload_by?.user_fullName || "Không rõ"}
                                </span>
                              </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">
                              <span className="text-xs">
                                <ClockCircleOutlined className="mr-1" />
                                {new Date(doc.uploaded_at).toLocaleString(
                                  "vi-VN",
                                )}
                              </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã vụ việc">
                              <span className="text-xs font-mono">
                                #{doc.legal_case}
                              </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tệp tin">
                              <a
                                href={doc.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline text-xs flex items-center gap-1"
                              >
                                <FilePdfOutlined /> Xem / Tải file
                              </a>
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      ))
                    ) : (
                      <Empty
                        description="Vụ việc này chưa có tài liệu nào."
                        className="py-10"
                      />
                    )}
                  </div>
                ),
              },

              // TAB 4: NHẬT KÝ
              {
                key: "4",
                label: (
                  <span>
                    <FileTextOutlined /> Nhật ký (
                    {selectedCase.logs?.length || 0})
                  </span>
                ),
                children: (
                  <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                    <div className="flex justify-end">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsLogModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 shadow-md"
                      >
                        Ghi nhật ký mới
                      </Button>
                    </div>
                    {selectedCase.logs?.length > 0 ? (
                      selectedCase.logs.map((log, index) => (
                        <Card
                          key={log.id}
                          type="inner"
                          className="bg-white shadow-sm mb-4 border border-gray-200"
                          title={
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-900">
                                #{index + 1}: {log.action}
                              </span>
                              <Popconfirm
                                title="Xóa nhật ký này?"
                                okText="Xóa"
                                cancelText="Hủy"
                              >
                                <Button
                                  danger
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>
                            </div>
                          }
                        >
                          <Descriptions
                            column={2}
                            size="small"
                            layout="vertical"
                          >
                            <Descriptions.Item
                              label={
                                <span className="font-semibold">
                                  Người thực hiện
                                </span>
                              }
                            >
                              <Space>
                                <Avatar
                                  size="small"
                                  src={log.created_by?.user_avatar}
                                  icon={<UserOutlined />}
                                  style={{ backgroundColor: "#87d068" }}
                                />
                                <span>
                                  {log.created_by?.user_fullName || "Không rõ"}
                                </span>
                              </Space>
                            </Descriptions.Item>

                            <Descriptions.Item
                              label={
                                <span className="font-semibold">
                                  Thời gian diễn ra
                                </span>
                              }
                            >
                              <span className="text-blue-600 font-bold">
                                <ClockCircleOutlined className="mr-1" />
                                {new Date(log.date_occurred).toLocaleString(
                                  "vi-VN",
                                )}
                              </span>
                            </Descriptions.Item>

                            <Descriptions.Item
                              label={
                                <span className="text-gray-400">
                                  Ngày ghi hệ thống
                                </span>
                              }
                            >
                              <span className="text-gray-400 text-xs">
                                {new Date(log.created_at).toLocaleString(
                                  "vi-VN",
                                )}
                              </span>
                            </Descriptions.Item>
                          </Descriptions>
                          <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">
                              <FileTextOutlined /> Chi tiết / Ghi chú:
                            </span>
                            <p className="text-gray-800 whitespace-pre-line text-sm m-0">
                              {log.note || "Không có ghi chú thêm."}
                            </p>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-10">
                        Vụ việc này chưa có nhật ký nào.
                      </div>
                    )}
                  </div>
                ),
              },

              // TAB 5: NHIỆM VỤ
              {
                key: "5",
                label: (
                  <span>
                    <FileProtectOutlined /> Nhiệm vụ (
                    {selectedCase.tasks?.length || 0})
                  </span>
                ),
                children: (
                  <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                    <div className="flex justify-end">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsTaskModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 shadow-md"
                      >
                        Thêm nhiệm vụ
                      </Button>
                    </div>

                    {selectedCase.tasks?.length > 0 ? (
                      selectedCase.tasks.map((t, index) => (
                        <div
                          key={t.id || index}
                          className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="text-base font-semibold text-gray-800 m-0">
                              {t.title}
                            </h4>
                            <div className="flex gap-2">
                              <Tag color={getPriorityColor(t.priority)}>
                                {t.priority}
                              </Tag>
                              <Tag color={getStatusColor(t.status)}>
                                {t.status}
                              </Tag>
                            </div>
                          </div>

                          {t.description && (
                            <p className="text-sm text-gray-600 m-0 line-clamp-2">
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <ClockCircleOutlined
                                className={
                                  new Date(t.deadline) < new Date() &&
                                  t.status !== "DONE"
                                    ? "text-red-500"
                                    : ""
                                }
                              />
                              <span
                                className={
                                  new Date(t.deadline) < new Date() &&
                                  t.status !== "DONE"
                                    ? "text-red-500 font-medium"
                                    : ""
                                }
                              >
                                {new Date(t.deadline).toLocaleString("vi-VN")}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {t.creator && (
                                <Tooltip
                                  title={`Người giao: ${t.creator.user_fullName}`}
                                >
                                  <Avatar
                                    src={t.creator.user_avatar}
                                    size="small"
                                    icon={<UserOutlined />}
                                  />
                                </Tooltip>
                              )}
                              <span className="text-gray-300">➜</span>
                              {t.assignee ? (
                                <Tooltip
                                  title={`Thực hiện: ${t.assignee.user_fullName}`}
                                >
                                  <Avatar
                                    src={t.assignee.user_avatar}
                                    size="small"
                                    className="border border-blue-200"
                                    icon={<UserOutlined />}
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Chưa phân công">
                                  <Avatar
                                    size="small"
                                    className="bg-gray-200"
                                    icon={<UserOutlined />}
                                  />
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8">
                        <Empty description="Chưa có nhiệm vụ nào cho vụ việc này" />
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* --- MODAL GHI NHẬT KÝ --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-900">
            <EditOutlined />{" "}
            <span className="font-bold">Ghi nhật ký công việc</span>
          </div>
        }
        open={isLogModalOpen}
        onCancel={() => setIsLogModalOpen(false)}
        footer={null}
      >
        <Form
          form={logForm}
          layout="vertical"
          onFinish={handleSaveLog}
          initialValues={{ date_occurred: dayjs(), action: "" }}
        >
          <Form.Item
            label={<span className="font-semibold">Hành động / Công việc</span>}
            name="action"
            rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
          >
            <Input
              placeholder="VD: Gặp khách hàng, Nộp hồ sơ..."
              size="large"
              prefix={<FileTextOutlined className="text-gray-400" />}
            />
          </Form.Item>
          <Form.Item
            label="Thời gian thực hiện"
            name="date_occurred"
            rules={[{ required: true, message: "Chọn thời gian" }]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="Chi tiết / Ghi chú" name="note">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả chi tiết..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button onClick={() => setIsLogModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              className="bg-blue-600"
            >
              Lưu nhật ký
            </Button>
          </div>
        </Form>
      </Modal>

      {/* --- MODAL THÊM CÔNG VIỆC --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-900">
            <EditOutlined />{" "}
            <span className="font-bold">Thêm công việc phụ</span>
          </div>
        }
        open={isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={taskForm} layout="vertical" onFinish={handleSaveTask}>
          <Form.Item
            label="Tiêu đề công việc"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Tên công việc" />
          </Form.Item>
          <Form.Item
            label="Hạn chót"
            name="deadline"
            rules={[{ required: true, message: "Vui lòng chọn hạn chót" }]}
          >
            <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item label="Độ ưu tiên" name="priority" initialValue="MEDIUM">
            <Select>
              <Select.Option value="LOW">Thấp</Select.Option>
              <Select.Option value="MEDIUM">Trung bình</Select.Option>
              <Select.Option value="HIGH">Cao</Select.Option>
              <Select.Option value="URGENT">Khẩn cấp</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết..." />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsTaskModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Tạo công việc
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* --- MODAL TẢI TÀI LIỆU --- */}
      <Modal
        title="Tải lên tài liệu mới"
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setNewDocName("");
          setSelectedFile(null);
        }}
        onOk={handleUpload}
        confirmLoading={uploadLoading}
        okText="Tải lên"
        cancelText="Hủy"
      >
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <Text strong>Tên tài liệu:</Text>
            <input
              className="w-full border p-2 rounded mt-1"
              placeholder="VD: Chứng cứ hóa đơn..."
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
            />
          </div>
          <div>
            <Text strong>Chọn tệp (PDF, Ảnh, Docx):</Text>
            <input
              type="file"
              className="w-full mt-1"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0)
                  setSelectedFile(e.target.files[0]);
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignedCases;
