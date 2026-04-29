import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tabs,
  Table,
  Tag,
  Card,
  Button,
  Avatar,
  Modal,
  Badge,
  Empty,
  Typography,
  Statistic,
  Divider,
  Descriptions,
  message,
  Form,
  Select,
  DatePicker,
  Input,
  Tooltip,
  Timeline,
  Progress,
  InputNumber,
  Rate, // <-- Thêm Rate
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  UserOutlined,
  FileSearchOutlined,
  FileProtectOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CloseCircleOutlined,
  EditOutlined,
  CloudDownloadOutlined,
  SignatureOutlined,
  CreditCardOutlined,
  SearchOutlined,
  ReloadOutlined,
  StarOutlined, // <-- Thêm Icon Đánh giá
} from "@ant-design/icons";
import Navbar from "../../components/Navbar";
import legalCaseService from "../../services/legalCaseService";
import documentService from "../../services/documentService";
import appoimentService from "../../services/appoimentService";
import paymentService from "../../services/paymentService";
import contractService from "../../services/contractService";
import feedbackService from "../../services/feedbackService"; // <-- Import feedbackService
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ClientDashboard = () => {
  const [customAmount, setCustomAmount] = useState(0); // Lưu số tiền nhập tùy chỉnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myAppoiments, setMyAppoiments] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [createAppointLoading, setCreateAppointLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [paymentType, setPaymentType] = useState("FULL");
  const [caseSearchText, setCaseSearchText] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  // --- STATE CHO CHỨC NĂNG ĐÁNH GIÁ (MỚI) ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);
  const [goalStatus, setGoalStatus] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Lọc cho bảng Vụ việc
  const filteredCases = useMemo(() => {
    return myCases.filter((item) => {
      const matchSearch = item.title
        ?.toLowerCase()
        .includes(caseSearchText.toLowerCase());

      const matchStatus =
        caseStatusFilter === "ALL" ? true : item.status === caseStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [myCases, caseSearchText, caseStatusFilter]);

  // Lọc cho bảng Lịch hẹn
  const filteredAppointments = useMemo(() => {
    return myAppoiments
      .filter((item) => {
        const matchSearch = item.title
          ?.toLowerCase()
          .includes(searchText.toLowerCase());

        const matchStatus = statusFilter ? item.status === statusFilter : true;

        let matchDate = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
          const start = dateRange[0].startOf("day");
          const end = dateRange[1].endOf("day");
          const appointmentDate = dayjs(item.date_time);
          matchDate = appointmentDate.isBetween(start, end, null, "[]");
        }

        return matchSearch && matchStatus && matchDate;
      })
      .sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
  }, [searchText, dateRange, statusFilter, myAppoiments]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");
    const msg = params.get("msg");

    if (!paymentStatus) return;

    setTimeout(() => {
      if (paymentStatus === "success") {
        message.success(msg || "Thanh toán thành công!");
      } else if (paymentStatus === "failed") {
        message.warning(msg || "Thanh toán thất bại!");
      } else if (paymentStatus === "error") {
        message.error(msg || "Có lỗi xảy ra!");
      }
    }, 300);

    window.history.replaceState({}, document.title, location.pathname);
  }, [location.search, location.pathname]);

  // --- XỬ LÝ UPLOAD TÀI LIỆU ---
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
      await documentService.create(formData);
      message.success("Tải lên thành công!");
      setIsUploadModalOpen(false);
      setNewDocName("");
      setSelectedFile(null);
      fetchCases();
    } catch (error) {
      console.error("Upload lỗi:", error);
      message.error("Có lỗi xảy ra khi tải lên.");
    } finally {
      setUploadLoading(false);
    }
  };

  const fontStyle = {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  };

  const latestContract = useMemo(() => {
    if (!selectedCase?.contracts || selectedCase.contracts.length === 0)
      return null;
    const sorted = [...selectedCase.contracts].sort(
      (a, b) => new Date(b.signed_date) - new Date(a.signed_date),
    );
    return sorted[0];
  }, [selectedCase]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res_list_case = await legalCaseService.list_legaCase();
      setMyCases(res_list_case);
      const res_list_appoiment = await appoimentService.get_appiments();
      setMyAppoiments(res_list_appoiment);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    if (selectedCase && myCases.length > 0) {
      const freshCase = myCases.find((c) => c.id === selectedCase.id);
      if (freshCase) {
        setSelectedCase(freshCase);
      }
    }
  }, [myCases, selectedCase]);

  // --- HÀM XỬ LÝ KHÁCH HÀNG TỰ ĐÁNH GIÁ (MỚI) ---
  const handleSubmitReview = async () => {
    if (!selectedCaseForReview) return;
    try {
      // 1. Cập nhật trạng thái đạt mục tiêu (Giống hệt Tư vấn viên)
      await legalCaseService.verifyGoalStatus(
        selectedCaseForReview.id,
        goalStatus,
      );

      // 2. Tạo Feedback nếu có Luật sư
      if (selectedCaseForReview.assigned_lawyer) {
        const feedbackData = {
          lawyer: selectedCaseForReview.assigned_lawyer.user_id,
          // Client không cần truyền client_id vì Backend tự lấy từ token (request.user)
          rating: rating,
          comment:
            comment.trim() !== ""
              ? comment
              : "Khách hàng không để lại nhận xét chi tiết.",
        };
        await feedbackService.createFeedback(feedbackData);
      }

      message.success(
        "Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn rất quan trọng với chúng tôi.",
      );

      // Đóng modal & dọn dẹp
      setIsReviewModalOpen(false);
      setGoalStatus(1);
      setRating(5);
      setComment("");

      // Tải lại bảng
      fetchCases();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi gửi đánh giá!");
    }
  };

  const handleCreateAppointment = async (values) => {
    setCreateAppointLoading(true);

    const currentCase = myCases.find((c) => c.id === values.legal_case);
    console.log(currentCase);
    try {
      const attendeeIds = [];
      if (currentCase?.assigned_lawyer?.user_id)
        attendeeIds.push(currentCase?.assigned_lawyer.user_id);
      if (currentCase?.assistant?.user_id)
        attendeeIds.push(currentCase?.assistant.user_id);
      const payload = {
        title: `Hẹn tư vấn vụ việc: ${currentCase.title}`,
        legal_case: values.legal_case,
        attendees: attendeeIds,
        date_time: values.date_time.toISOString(),
        end_time: values.date_time.add(1, "hour").toISOString(),
        note: values.note,
        location: values.location || "Văn phòng Luật Sư",
        status: "PENDING",
      };

      if (editingAppointment) {
        await appoimentService.update_appointment(
          payload,
          editingAppointment.id,
        );
        message.success("Đã cập nhật lịch hẹn!");
      } else {
        await appoimentService.create(payload);
        message.success("Đã gửi yêu cầu đặt lịch!");
      }
      setIsAppointModalOpen(false);
      form.resetFields();
      fetchCases();
    } catch (error) {
      console.error("Lỗi đặt lịch:", error);
      if (error.response && error.response.data) {
        const serverError =
          error.response.data.detail ||
          error.response.data.non_field_errors?.[0] ||
          "Dữ liệu không hợp lệ.";
        message.error(`Đặt lịch thất bại: ${serverError}`);
      } else {
        message.error("Không thể kết nối đến máy chủ.");
      }
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const handleSignContract = async () => {
    const finalAmount = paymentType === "CUSTOM" ? customAmount : null;

    if (paymentType === "CUSTOM" && (!customAmount || customAmount < 1000)) {
      return message.warning(
        "Vui lòng nhập số tiền thanh toán hợp lệ (tối thiểu 1,000đ)",
      );
    }
    setLoading(true);
    try {
      const res = await paymentService.create(
        selectedContract.id,
        paymentType,
        finalAmount,
      );
      message.loading({
        content: "Đang chuyển hướng thanh toán...",
        duration: 1,
      });

      setIsPaymentModalOpen(false);
      const paymentUrl = res?.payment_url || res?.data?.payment_url;

      if (!paymentUrl) {
        message.error("Không nhận được link thanh toán.");
        return;
      }
      window.location.href = paymentUrl;
    } catch (error) {
      message.error("Không thể thực hiện ký hợp đồng.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContract = (contractId) => {
    Modal.confirm({
      title: "Xác nhận hủy hợp đồng?",
      content:
        "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn hủy hợp đồng này?",
      okText: "Hủy hợp đồng",
      okType: "danger",
      onOk: async () => {
        try {
          await contractService.cancel(contractId);
          message.success("Đã yêu cầu hủy hợp đồng.");

          setSelectedCase((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              contracts: prev.contracts.map((c) =>
                c.id === contractId
                  ? {
                      ...c,
                      status: "CANCELLED",
                      status_display: "Đã hủy",
                    }
                  : c,
              ),
            };
          });

          fetchCases();
        } catch (e) {
          message.error("Lỗi khi hủy hợp đồng.");
          console.log(e);
        }
      },
    });
  };

  const handleDeclineParticipation = async (appointmentId) => {
    try {
      await appoimentService.declined_appoiment(appointmentId);
      message.info("Chức năng từ chối đang được cập nhật.");
      fetchCases();
    } catch (error) {
      console.log(error);
      message.error("Có lỗi xảy ra.");
    }
  };

  const handleCancell = async (appoiment_id) => {
    setCreateAppointLoading(true);
    try {
      await appoimentService.camcel_appoiment(appoiment_id);
      message.success("Hủy lịch hẹn thành công.");
      fetchCases();
    } catch (error) {
      console.log(error);
      message.error("Hủy lịch hẹn thất bại.");
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const handleConfirm = async (appointment_id) => {
    setCreateAppointLoading(true);
    try {
      await appoimentService.confirm_appoiment(appointment_id);
      message.success("Xác nhận lịch hẹn thành công.");
      fetchCases();
    } catch (error) {
      console.log(error);
      message.error("Xác nhận lịch hẹn thành công.");
    } finally {
      setCreateAppointLoading(false);
    }
  };

  const openBookAppointmentModal = (caseId = null) => {
    setIsAppointModalOpen(true);
    if (caseId) {
      form.setFieldsValue({ legal_case: caseId });
    } else {
      form.resetFields();
    }
  };

  const openEditAppointmentModal = (appointment) => {
    setEditingAppointment(appointment);
    setIsAppointModalOpen(true);
    form.setFieldsValue({
      legal_case: appointment.legal_case,
      location: appointment.location,
      date_time: dayjs(appointment.date_time),
      note: appointment.note,
    });
  };

  const formatCurrency = (value) => {
    if (!value) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // --- COMPONENT CON: THẺ NHÂN VIÊN TRONG MODAL ---
  const DetailedStaffCard = ({ staff, role, color, bgTone }) => {
    if (!staff) return null;
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all mb-3">
        <div
          style={{ backgroundColor: bgTone }}
          className="p-3 border-b border-gray-100 flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <Avatar
              size={48}
              src={staff.user_avatar}
              icon={<UserOutlined />}
              style={{
                border: `2px solid white`,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <div>
              <Text
                strong
                style={{ fontSize: 15, display: "block", color: "#262626" }}
              >
                {staff.user_fullName}
              </Text>
              <Tag
                color={color}
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 11,
                  border: "none",
                }}
              >
                {role}
              </Tag>
            </div>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <PhoneOutlined />
            </div>
            <div className="flex flex-col">
              <Text type="secondary" style={{ fontSize: 10 }}>
                Điện thoại
              </Text>
              <Text
                copyable={{ text: staff.user_phone }}
                style={{ fontSize: 13, color: "#595959", fontWeight: 500 }}
              >
                {staff.user_phone}
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <MailOutlined />
            </div>
            <div className="flex flex-col overflow-hidden">
              <Text type="secondary" style={{ fontSize: 10 }}>
                Email
              </Text>
              <Text
                copyable={{ text: staff.user_email }}
                ellipsis={{ tooltip: staff.user_email }}
                style={{ fontSize: 13, color: "#595959", maxWidth: 200 }}
              >
                {staff.user_email}
              </Text>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TableStaffItem = ({ person, roleLabel, roleColor }) => (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      <Avatar
        src={person.user_avatar}
        size="small"
        style={{ backgroundColor: roleColor, flexShrink: 0 }}
        icon={<UserOutlined />}
      />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Text strong style={{ fontSize: 14, color: "#262626" }}>
            {person.user_fullName}
          </Text>
          <Tag
            color={roleColor}
            style={{
              fontSize: 10,
              lineHeight: "16px",
              padding: "0 4px",
              margin: 0,
            }}
          >
            {roleLabel}
          </Tag>
        </div>

        <div className="flex flex-col gap-0.5 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <PhoneOutlined style={{ fontSize: 10 }} />
            <Text
              copyable={{ text: person.user_phone }}
              style={{ fontSize: 12, color: "#595959" }}
            >
              {person.user_phone}
            </Text>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MailOutlined style={{ fontSize: 10 }} />
            <Text
              copyable={{ text: person.user_email }}
              ellipsis
              style={{ fontSize: 12, color: "#595959", maxWidth: 180 }}
            >
              {person.user_email}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );

  const appointmentColumns = [
    {
      title: "Thông tin cuộc hẹn",
      key: "info",
      width: "30%",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Text strong style={{ fontSize: 15, color: "#1d39c4" }}>
            {record.case_title}
          </Text>
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarOutlined />
            <Text>
              {new Date(record.date_time).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Người gặp",
      key: "attendee_details",
      width: "30%",
      render: (_, record) => {
        if (!record.attendee_details || record.attendee_details.length === 0) {
          return (
            <Text type="secondary" italic>
              Chưa có người tham gia
            </Text>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            {record.attendee_details.map((p) => {
              let statusColor = "default";
              let statusText = "";

              if (p.status === "ACCEPTED") {
                statusColor = "green";
                statusText = "Đã chấp nhận";
              } else if (p.status === "PENDING") {
                statusColor = "orange";
                statusText = "Chờ phản hồi";
              } else if (p.status === "REJECTED") {
                statusColor = "red";
                statusText = "Từ chối";
              }

              const roleMap = {
                0: { label: "Khách hàng", color: "default" },
                1: { label: "Tư vấn viên", color: "purple" },
                2: { label: "Trợ lý luật sư", color: "green" },
                3: { label: "Luật sư", color: "blue" },
                4: { label: "Quản lý", color: "red" },
              };

              const roleInfo = roleMap[p.user.user_role] || {
                label: "Không xác định",
                color: "default",
              };
              return (
                <div
                  key={p.user.user_id}
                  className="flex items-center justify-between"
                >
                  <TableStaffItem
                    person={p.user}
                    roleLabel={roleInfo.label}
                    roleColor={roleInfo.color}
                  />
                  <Tag color={statusColor}>{statusText}</Tag>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Địa điểm & Ghi chú",
      key: "location",
      width: "25%",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <EnvironmentOutlined className="text-red-500" /> {record.location}
          </div>
          {record.note && (
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <InfoCircleOutlined className="mt-0.5" />
              <span className="line-clamp-2">{record.note}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center",
      width: "15%",
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

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      width: "15%",
      render: (_, record) => {
        const canAction =
          record.status !== "CANCELLED" && record.status !== "COMPLETED";

        const isCreator =
          record.creator === currentUser.user_id ||
          record.creator?.user_id === currentUser.user_id;

        const currentAttendee = record.attendee_details?.find(
          (p) => p.user.user_id === currentUser.user_id,
        );

        if (!canAction) return <Tag>Lịch đã đóng</Tag>;

        return (
          <div className="flex flex-col gap-2">
            {isCreator ? (
              <>
                <Tooltip title="Cập nhật yêu cầu lịch hẹn">
                  <Button
                    type="primary"
                    size="small"
                    className="bg-yellow-400 hover:bg-yellow-300 border-none"
                    icon={<EditOutlined />}
                    onClick={() => openEditAppointmentModal(record)}
                  >
                    Cập nhật
                  </Button>
                </Tooltip>

                <Tooltip title="Hủy yêu cầu lịch hẹn">
                  <Button
                    danger
                    type="primary"
                    size="small"
                    className="bg-red-700 hover:bg-red-600 border-none"
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleCancell(record.id)}
                  >
                    Hủy lịch
                  </Button>
                </Tooltip>
              </>
            ) : (
              currentAttendee && (
                <div className="flex flex-col gap-1">
                  {currentAttendee.status === "PENDING" ? (
                    <>
                      <Button
                        type="primary"
                        size="small"
                        className="bg-green-600 hover:bg-green-500 border-none"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleConfirm(record.id)}
                      >
                        Xác nhận
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        className="bg-red-600 hover:bg-red-500 border-none"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleDeclineParticipation(record.id)}
                      >
                        Từ chối
                      </Button>
                    </>
                  ) : (
                    <Tag
                      color={
                        currentAttendee.status === "ACCEPTED"
                          ? "success"
                          : "error"
                      }
                    >
                      {currentAttendee.status === "ACCEPTED"
                        ? "BẠN ĐÃ ĐỒNG Ý"
                        : "BẠN ĐÃ TỪ CHỐI"}
                    </Tag>
                  )}
                </div>
              )
            )}
          </div>
        );
      },
    },
  ];

  const caseColumns = [
    {
      title: "Vụ việc",
      dataIndex: "title",
      key: "title",
      width: "25%",
      render: (text) => (
        <div>
          <Text strong style={{ fontSize: 16, color: "#1d39c4" }}>
            {text}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hồ sơ pháp lý
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: "20%",
      render: (_, record) => {
        let color = "default";
        let text = "Không rõ";

        if (record.status === "PROCESSING") {
          color = "processing";
          text = "Đang xử lý";
        } else if (record.status === "CONFIRMED") {
          color = "success";
          text = "Xác nhận";
        } else if (record.status === "CANCELLED") {
          color = "error";
          text = "Đã hủy";
        } else if (record.status === "REJECTED") {
          color = "warning";
          text = "Từ chối";
        } else if (record.status === "LIQUIDATED") {
          color = "blue";
          text = "Hoàn thành";
        }

        return (
          <Tag color={color} className="font-medium">
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Đội ngũ phụ trách",
      key: "lawyer",
      width: "45%",
      render: (_, record) => {
        const lawyer = record.assigned_lawyer;
        const assistant = record.assistant;
        const consultant = record.consultant;

        if (!lawyer && !assistant && !consultant) {
          return (
            <Text italic type="secondary">
              Chưa phân công
            </Text>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            {lawyer && (
              <TableStaffItem
                person={lawyer}
                roleLabel="Luật sư"
                roleColor="#1890ff"
              />
            )}

            {assistant && (
              <>
                {lawyer && (
                  <Divider
                    style={{ margin: "4px 0", borderColor: "#f0f0f0" }}
                  />
                )}
                <TableStaffItem
                  person={assistant}
                  roleLabel="Trợ lý"
                  roleColor="#52c41a"
                />
              </>
            )}

            {consultant && (
              <>
                {(lawyer || assistant) && (
                  <Divider
                    style={{ margin: "4px 0", borderColor: "#f0f0f0" }}
                  />
                )}
                <TableStaffItem
                  person={consultant}
                  roleLabel="Tư vấn viên"
                  roleColor="#faad14"
                />
              </>
            )}
          </div>
        );
      },
    },
    {
      key: "action",
      align: "right",
      render: (_, record) => {
        return (
          <div className="flex flex-col gap-2">
            {/* TH 1: Vụ việc đang chạy -> Nút Đặt lịch */}
            {record.status === "CONFIRMED" && (
              <Tooltip title="Đặt lịch hẹn cho vụ việc này">
                <Button
                  type="primary"
                  size="small"
                  className="bg-green-600 hover:bg-green-500 border-none"
                  icon={<CalendarOutlined />}
                  onClick={() => openBookAppointmentModal(record.id)}
                >
                  Đặt lịch
                </Button>
              </Tooltip>
            )}

            {/* TH 2: Vụ việc Hoàn Thành & CHƯA đánh giá -> Nút Đánh giá */}
            {record.status === "LIQUIDATED" &&
              record.goal_achievement_status === 0 && (
                <Tooltip title="Đánh giá chất lượng dịch vụ & luật sư">
                  <Button
                    type="primary"
                    size="small"
                    className="bg-orange-500 hover:bg-orange-400 border-none"
                    icon={<StarOutlined />}
                    onClick={() => {
                      setSelectedCaseForReview(record);
                      setIsReviewModalOpen(true);
                    }}
                  >
                    Đánh giá
                  </Button>
                </Tooltip>
              )}

            {/* TH 3: Vụ việc Hoàn Thành & ĐÃ đánh giá -> Thẻ text */}
            {record.status === "LIQUIDATED" &&
              record.goal_achievement_status !== 0 && (
                <Tag color="success" className="text-center">
                  Đã đánh giá
                </Tag>
              )}

            <Button
              type="default"
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => {
                setSelectedCase(record);
                setIsModalOpen(true);
              }}
            >
              Chi tiết
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]" style={fontStyle}>
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>
              Hồ sơ của tôi
            </Title>
            <Text type="secondary">
              Quản lý tiến trình và liên hệ với luật sư
            </Text>
          </div>

          <div className="flex gap-4 items-center">
            <Statistic
              title="Lịch hẹn sắp tới"
              value={myAppoiments.length}
              prefix={<CalendarOutlined className="text-orange-500" />}
              styles={{
                content: { fontSize: 20 },
              }}
            />

            <div
              style={{
                width: 1,
                height: 40,
                background: "#f0f0f0",
              }}
            />

            <Statistic
              title="Vụ việc"
              value={myCases.length}
              prefix={<FileProtectOutlined className="text-blue-500" />}
              styles={{
                content: { fontSize: 20 },
              }}
            />
          </div>
        </div>

        <Card variant="borderless" className="shadow-sm rounded-xl">
          <Tabs
            defaultActiveKey="1"
            size="large"
            items={[
              {
                key: "1",
                label: (
                  <span>
                    <CalendarOutlined /> Lịch hẹn tư vấn
                  </span>
                ),
                children: (
                  <>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <Input
                          placeholder="Tìm tên vụ việc..."
                          prefix={<SearchOutlined className="text-gray-400" />}
                          className="w-64"
                          allowClear
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />

                        <DatePicker.RangePicker
                          placeholder={["Từ ngày", "Đến ngày"]}
                          format="DD/MM/YYYY"
                          value={dateRange}
                          onChange={(values) => setDateRange(values)}
                          className="w-72"
                        />

                        <Select
                          placeholder="Trạng thái"
                          className="w-40 shadow-sm"
                          allowClear
                          value={statusFilter}
                          onChange={(value) => setStatusFilter(value)}
                        >
                          <Select.Option value="CONFIRMED">
                            Đã chấp nhận
                          </Select.Option>
                          <Select.Option value="PENDING">
                            Chờ phản hồi
                          </Select.Option>
                          <Select.Option value="CANCELLED">
                            Đã hủy
                          </Select.Option>
                          <Select.Option value="COMPLETED">
                            Hoàn thành
                          </Select.Option>
                        </Select>
                      </div>

                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setSearchText("");
                          setDateRange(null);
                          setStatusFilter(null);
                        }}
                        className="flex items-center"
                      >
                        Làm mới
                      </Button>
                    </div>
                    <Table
                      dataSource={filteredAppointments}
                      columns={appointmentColumns}
                      rowKey="id"
                      pagination={false}
                      locale={{ emptyText: "Chưa có lịch hẹn nào" }}
                    />
                  </>
                ),
              },
              {
                key: "2",
                label: (
                  <span>
                    <FileTextOutlined /> Vụ việc đang xử lý
                  </span>
                ),
                children: (
                  <>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <Input
                          placeholder="Tìm tiêu đề vụ việc..."
                          prefix={<SearchOutlined />}
                          style={{ width: 250 }}
                          value={caseSearchText}
                          onChange={(e) => setCaseSearchText(e.target.value)}
                          allowClear
                        />
                        <Select
                          value={caseStatusFilter}
                          style={{ width: 180 }}
                          onChange={(value) => setCaseStatusFilter(value)}
                          options={[
                            { value: "ALL", label: "Tất cả trạng thái" },
                            { value: "PROCESSING", label: "Đang xử lý" },
                            { value: "CONFIRMED", label: "Xác nhận" },
                            { value: "CANCELLED", label: "Đã hủy" },
                            { value: "REJECTED", label: "Bị từ chối" },
                            { value: "LIQUIDATED", label: "Hoàn thành" },
                          ]}
                        />
                      </div>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setCaseSearchText("");
                          setCaseStatusFilter("ALL");
                        }}
                        className="flex items-center"
                      >
                        Làm mới
                      </Button>
                    </div>
                    <Table
                      dataSource={filteredCases}
                      columns={caseColumns}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 5 }}
                      locale={{ emptyText: "Bạn chưa có hồ sơ vụ việc nào" }}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* --- MODAL CHI TIẾT --- */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        styles={{
          body: { padding: 0 },
        }}
      >
        {selectedCase && (
          <div>
            <div className="bg-blue-900 p-6 flex justify-between items-start">
              <div>
                <Text className="text-blue-200 uppercase text-xs font-bold tracking-wider">
                  Hồ sơ #{selectedCase.id}
                </Text>
                <Title level={3} style={{ color: "white", margin: 0 }}>
                  {selectedCase.title}
                </Title>
              </div>
              <Tag
                color="gold"
                className="px-3 py-1 font-bold border-none text-sm"
              >
                {selectedCase.current_stage_display}
              </Tag>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-4 bg-gray-50 p-6 border-r border-gray-100">
                <Text
                  strong
                  type="secondary"
                  className="uppercase text-xs block mb-4"
                >
                  Đội ngũ phụ trách
                </Text>

                {latestContract ? (
                  <>
                    {latestContract.assigned_lawyer && (
                      <DetailedStaffCard
                        staff={latestContract.assigned_lawyer}
                        role="LUẬT SƯ PHỤ TRÁCH"
                        color="blue"
                        bgTone="#e6f7ff"
                      />
                    )}

                    {latestContract.assistant && (
                      <DetailedStaffCard
                        staff={latestContract.assistant}
                        role="TRỢ LÝ PHÁP LÝ"
                        color="green"
                        bgTone="#f6ffed"
                      />
                    )}
                  </>
                ) : selectedCase.assigned_staff ? (
                  <DetailedStaffCard
                    staff={selectedCase.assigned_staff}
                    role="TƯ VẤN VIÊN"
                    color="orange"
                    bgTone="#fff7e6"
                  />
                ) : (
                  <Empty description="Chưa phân công" />
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Text
                    strong
                    type="secondary"
                    className="uppercase text-xs block mb-2 text-red-400"
                  >
                    Bên đối lập
                  </Text>
                  <Text strong className="block text-base">
                    {selectedCase.opposing_party_name}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    <EnvironmentOutlined />{" "}
                    {selectedCase.opposing_party_address}
                  </Text>
                </div>
              </div>

              <div className="md:col-span-8 p-6 flex flex-col gap-6">
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-end mb-3">
                    <Title level={5} style={{ margin: 0 }}>
                      <SyncOutlined
                        spin={selectedCase.status === "PROCESSING"}
                        className="text-blue-500 mr-2"
                      />
                      Tiến độ hoàn thành
                    </Title>
                    {selectedCase.status === "CANCELLED" && (
                      <Tag color="error" className="m-0">
                        Hồ sơ đã hủy
                      </Tag>
                    )}
                  </div>

                  <Progress
                    percent={selectedCase.overall_progress || 0}
                    status={
                      selectedCase.status === "CANCELLED"
                        ? "exception"
                        : selectedCase.overall_progress === 100
                          ? "success"
                          : "active"
                    }
                    strokeWidth={12}
                  />
                </div>
                <div>
                  <Title level={5}>
                    <FileTextOutlined className="text-blue-500 mr-2" /> Nội dung
                    vụ việc
                  </Title>
                  <Paragraph className="bg-gray-50 p-4 rounded-lg text-gray-600 text-justify">
                    {selectedCase.description}
                  </Paragraph>
                </div>

                <div>
                  <div className="mt-2">
                    <Tabs
                      defaultActiveKey="1"
                      items={[
                        {
                          key: "1",
                          label: (
                            <span>
                              <FileProtectOutlined />
                              Hợp đồng ({selectedCase.contracts?.length || 0})
                            </span>
                          ),
                          children: (
                            <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar p-1">
                              {selectedCase.contracts?.length > 0 ? (
                                selectedCase.contracts.map(
                                  (contract, index) => {
                                    const isDraft = contract.status === "DRAFT";
                                    const isSigned =
                                      contract.status === "SIGNED";
                                    const isCanceled =
                                      contract.status === "CANCELLED";
                                    const hasDebt =
                                      contract.remaining_balance > 0;

                                    return (
                                      <Card
                                        key={contract.id}
                                        type="inner"
                                        size="small"
                                        className="shadow-sm border-gray-200 hover:border-blue-300 transition-all"
                                        title={
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              count={index + 1}
                                              style={{
                                                backgroundColor: "#1677ff",
                                              }}
                                            />
                                            <span className="font-semibold text-gray-700">
                                              {contract.contract_number}
                                            </span>
                                          </div>
                                        }
                                        extra={
                                          <div className="flex gap-2 items-center">
                                            <Tag
                                              color={
                                                isCanceled
                                                  ? "red"
                                                  : isDraft
                                                    ? "orange"
                                                    : "green"
                                              }
                                              className="m-0 uppercase text-[10px]"
                                            >
                                              {contract.status_display}
                                            </Tag>

                                            {contract.signed_file && (
                                              <Button
                                                type="link"
                                                size="small"
                                                icon={<CloudDownloadOutlined />}
                                                href={contract.signed_file}
                                                target="_blank"
                                                className="p-0"
                                              >
                                                Tải file
                                              </Button>
                                            )}
                                          </div>
                                        }
                                      >
                                        <Descriptions
                                          bordered
                                          size="small"
                                          column={1}
                                          styles={{
                                            label: {
                                              width: "140px",
                                              color: "#666",
                                            },
                                          }}
                                        >
                                          <Descriptions.Item label="Luật sư phụ trách">
                                            <div className="flex items-center gap-2">
                                              <Avatar
                                                size={20}
                                                src={
                                                  contract.assigned_lawyer
                                                    ?.user_avatar
                                                }
                                              />
                                              <Text strong>
                                                {
                                                  contract.assigned_lawyer
                                                    ?.user_fullName
                                                }
                                              </Text>
                                            </div>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Giá trị hợp đồng">
                                            <Text strong>
                                              {Number(
                                                contract.total_value,
                                              ).toLocaleString()}
                                              đ
                                            </Text>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Đã thanh toán">
                                            <Text type="success" strong>
                                              {contract.total_paid?.toLocaleString() ||
                                                0}
                                              đ
                                            </Text>
                                          </Descriptions.Item>

                                          {hasDebt && (
                                            <Descriptions.Item label="Số tiền còn lại">
                                              <Text type="danger" strong>
                                                {contract.remaining_balance?.toLocaleString() ||
                                                  0}
                                                đ
                                              </Text>
                                            </Descriptions.Item>
                                          )}
                                        </Descriptions>

                                        <div className="mt-4">
                                          {isDraft && (
                                            <Button
                                              block
                                              type="primary"
                                              icon={<SignatureOutlined />}
                                              className="bg-green-600 hover:bg-green-700 border-none h-10 font-medium"
                                              onClick={() => {
                                                setSelectedContract(contract);
                                                setIsPaymentModalOpen(true);
                                              }}
                                            >
                                              Ký hợp đồng & Thanh toán ngay
                                            </Button>
                                          )}

                                          {isSigned && hasDebt && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center animate-pulse-slow">
                                              <div>
                                                <span className="text-[10px] text-blue-500 font-bold uppercase block tracking-wider">
                                                  Số dư cần tất toán
                                                </span>
                                                <span className="text-lg font-bold text-blue-700">
                                                  {contract.remaining_balance?.toLocaleString() ||
                                                    0}
                                                  đ
                                                </span>
                                              </div>
                                              <Button
                                                type="primary"
                                                icon={<CreditCardOutlined />}
                                                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                                                onClick={() => {
                                                  setSelectedContract({
                                                    ...contract,
                                                    isFinalPayment: false, // Để false vì khách có thể nhập ít hơn
                                                    amountToPay: 0, // Khởi tạo bằng 0
                                                  });
                                                  setIsPaymentModalOpen(true);
                                                }}
                                              >
                                                Thanh toán nốt
                                              </Button>
                                            </div>
                                          )}

                                          {isSigned && (
                                            <div className="text-right mt-2">
                                              <Button
                                                danger
                                                type="text"
                                                size="small"
                                                className="text-[11px] opacity-50 hover:opacity-100"
                                                onClick={() =>
                                                  handleCancelContract(
                                                    contract.id,
                                                  )
                                                }
                                              >
                                                Hủy hợp đồng này
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </Card>
                                    );
                                  },
                                )
                              ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mt-2">
                                  <FileTextOutlined
                                    style={{
                                      fontSize: "32px",
                                      color: "#bfbfbf",
                                    }}
                                  />
                                  <Text
                                    type="secondary"
                                    className="mt-2 text-gray-400"
                                  >
                                    Vụ việc này hiện chưa phát sinh hợp đồng.
                                  </Text>
                                </div>
                              )}
                            </div>
                          ),
                        },
                        {
                          key: "2",
                          label: (
                            <span>
                              <FilePdfOutlined />
                              Tài liệu ({selectedCase.documents?.length || 0})
                            </span>
                          ),
                          children: (
                            <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto p-1 custom-scrollbar">
                              <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => setIsUploadModalOpen(true)}
                                className="w-full mb-2"
                              >
                                Tải lên tài liệu/chứng cứ mới
                              </Button>
                              {selectedCase.documents?.length > 0 ? (
                                selectedCase.documents.map((doc) => (
                                  <Card
                                    key={doc.id}
                                    type="inner"
                                    size="small"
                                    className="shadow-sm border-gray-200"
                                    title={
                                      <div className="flex items-center gap-2">
                                        <FilePdfOutlined className="text-red-500" />
                                        <span>{doc.document_name}</span>
                                      </div>
                                    }
                                    extra={
                                      <Button
                                        type="link"
                                        size="small"
                                        href={doc.file}
                                        target="_blank"
                                        icon={<DownloadOutlined />}
                                      >
                                        Xem
                                      </Button>
                                    }
                                  >
                                    <Descriptions
                                      column={1}
                                      size="small"
                                      bordered={false}
                                    >
                                      <Descriptions.Item label="Người tải lên">
                                        <Text strong>
                                          {doc.upload_by?.user_fullName}
                                        </Text>
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Ngày tải lên">
                                        {doc.uploaded_at
                                          ? new Date(
                                              doc.uploaded_at,
                                            ).toLocaleString("vi-VN")
                                          : "N/A"}
                                      </Descriptions.Item>
                                    </Descriptions>
                                  </Card>
                                ))
                              ) : (
                                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                  <Text
                                    type="secondary"
                                    className="text-gray-400"
                                  >
                                    Chưa có tài liệu hay chứng cứ nào.
                                  </Text>
                                </div>
                              )}
                            </div>
                          ),
                        },
                        {
                          key: "3",
                          label: (
                            <span>
                              <ClockCircleOutlined />
                              Lịch sử hoạt động
                            </span>
                          ),
                          children: (
                            <div className="max-h-[550px] overflow-y-auto pr-2 custom-scrollbar p-2">
                              {Array.isArray(selectedCase?.logs) &&
                              selectedCase.logs.length > 0 ? (
                                <Timeline
                                  className="mt-4 ml-2"
                                  items={selectedCase.logs.map((log) => ({
                                    color: "blue",
                                    content: (
                                      <div className="flex flex-col gap-1 pb-4">
                                        <Text
                                          strong
                                          className="text-gray-800 text-base"
                                        >
                                          {log?.action}
                                        </Text>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Tag
                                            color="processing"
                                            className="m-0 text-[11px] border-none"
                                          >
                                            {log?.stage_display || "Hệ thống"}
                                          </Tag>
                                          <Text
                                            type="secondary"
                                            className="text-xs"
                                          >
                                            {log?.date_occurred
                                              ? new Date(
                                                  log.date_occurred,
                                                ).toLocaleString("vi-VN", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                                })
                                              : "N/A"}
                                          </Text>
                                        </div>
                                        {log?.note && (
                                          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mt-2 border border-gray-100 italic">
                                            {log.note}
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  }))}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                  <ClockCircleOutlined
                                    style={{
                                      fontSize: "32px",
                                      color: "#bfbfbf",
                                    }}
                                  />
                                  <Text
                                    type="secondary"
                                    className="mt-2 text-gray-400"
                                  >
                                    Vụ việc này chưa có ghi nhận lịch sử nào.
                                  </Text>
                                </div>
                              )}
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Đóng lại</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL KHÁCH HÀNG TỰ ĐÁNH GIÁ (MỚI) --- */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-orange-500 text-lg border-b pb-2 mb-2">
            <StarOutlined /> Đánh giá chất lượng dịch vụ
          </div>
        }
        open={isReviewModalOpen}
        onOk={handleSubmitReview}
        onCancel={() => {
          setIsReviewModalOpen(false);
          setGoalStatus(1);
          setRating(5);
          setComment("");
        }}
        okText="Gửi đánh giá"
        cancelText="Để sau"
      >
        {selectedCaseForReview && (
          <div style={{ padding: "10px 0" }}>
            <p>
              Vụ việc:{" "}
              <strong className="text-blue-600">
                {selectedCaseForReview.title}
              </strong>
            </p>
            <p>
              Luật sư phụ trách:{" "}
              <strong>
                {selectedCaseForReview.assigned_lawyer?.user_fullName ||
                  "Chưa phân công"}
              </strong>
            </p>

            <Divider orientation="left" plain style={{ margin: "12px 0" }}>
              1. Mức độ đạt mục tiêu của bạn
            </Divider>
            <Select
              style={{ width: "100%" }}
              value={goalStatus}
              onChange={(value) => setGoalStatus(value)}
            >
              <Option value={1}>
                <CheckCircleOutlined style={{ color: "#52c41a" }} /> Đạt mong
                muốn ban đầu của tôi
              </Option>
              <Option value={2}>
                <CloseCircleOutlined style={{ color: "#f5222d" }} /> Không đạt
                mong muốn
              </Option>
            </Select>

            <Divider
              orientation="left"
              plain
              style={{ margin: "20px 0 12px 0" }}
            >
              2. Đánh giá mức độ hài lòng
            </Divider>
            <div style={{ marginBottom: "15px" }}>
              <Text style={{ marginRight: "15px", fontWeight: 500 }}>
                Chất lượng dịch vụ:{" "}
              </Text>
              <Rate value={rating} onChange={setRating} />
            </div>
            <TextArea
              rows={4}
              placeholder="Vui lòng chia sẻ thêm trải nghiệm của bạn về dịch vụ và thái độ của luật sư..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}
      </Modal>

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
              placeholder="VD: Chứng cứ hóa đơn, Đơn khởi kiện..."
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
            />
          </div>
          <div>
            <Text strong>Chọn tệp (PDF, Ảnh):</Text>
            <input
              type="file"
              className="w-full mt-1"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-green-700 text-lg border-b pb-2 mb-4">
            <CalendarOutlined /> Đặt lịch hẹn mới
          </div>
        }
        open={isAppointModalOpen}
        onCancel={() => {
          setIsAppointModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createAppointLoading}
        okText="Gửi yêu cầu"
        cancelText="Hủy bỏ"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAppointment}>
          <Form.Item
            name="legal_case"
            label="Chọn vụ việc cần tư vấn"
            rules={[{ required: true, message: "Vui lòng chọn vụ việc!" }]}
          >
            <Select placeholder="Chọn hồ sơ vụ việc...">
              {myCases
                .filter((c) => c.status == "CONFIRMED")
                .map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    #{c.id} - {c.title}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Địa điểm mong muốn"
            rules={[{ required: true, message: "Vui lòng chọn địa điểm!" }]}
          >
            <Input placeholder="Địa điểm mong muốn." />
          </Form.Item>
          <Form.Item
            name="date_time"
            label="Thời gian mong muốn"
            rules={[{ required: true, message: "Vui lòng chọn ngày giờ!" }]}
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="DD/MM/YYYY HH:mm"
              className="w-full"
              placeholder="Chọn ngày và giờ hẹn"
            />
          </Form.Item>
          <Form.Item name="note" label="Nội dung/Ghi chú">
            <TextArea
              rows={4}
              placeholder="VD: Tôi muốn gặp luật sư để trao đổi về tình tiết mới..."
            />
          </Form.Item>
          <div className="bg-blue-50 p-3 rounded text-xs text-blue-600 flex gap-2">
            <InfoCircleOutlined className="mt-0.5" />{" "}
            <span>
              Lịch hẹn sẽ ở trạng thái "Chờ xác nhận" cho đến khi Luật sư hoặc
              Trợ lý phê duyệt.
            </span>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận ký hợp đồng & Thanh toán"
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        onOk={handleSignContract}
        okText="Tiến hành thanh toán"
        cancelText="Để sau"
      >
        <div className="py-4">
          <Text strong>Chọn hình thức thanh toán:</Text>
          <Select
            className="w-full mt-2"
            value={paymentType}
            onChange={(val) => {
              setPaymentType(val);
              // Nếu chọn lại các mốc cố định, ta cập nhật lại số tiền tự động
              if (val === "FULL")
                setCustomAmount(selectedContract?.total_value);
              if (val === "PARTIAL")
                setCustomAmount(selectedContract?.total_value / 2);
            }}
          >
            <Select.Option value="FULL">
              Thanh toán toàn bộ (100%)
            </Select.Option>
            <Select.Option value="PARTIAL">
              Thanh toán đặt cọc (50%)
            </Select.Option>
            <Select.Option value="CUSTOM">Nhập số tiền khác</Select.Option>
          </Select>

          {/* Hiển thị ô nhập tiền nếu chọn "Nhập số tiền khác" hoặc luôn hiển thị để điều chỉnh */}
          {paymentType === "CUSTOM" && (
            <div className="mt-4">
              <Text strong>Nhập số tiền muốn thanh toán:</Text>
              <InputNumber
                className="w-full mt-2"
                size="large"
                min={1000} // Số tiền tối thiểu
                max={
                  selectedContract?.remaining_balance ||
                  selectedContract?.total_value
                }
                value={customAmount}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                onChange={(val) => setCustomAmount(val)}
                addonAfter="đ"
              />
              <Text type="secondary" className="text-[12px]">
                Tối đa:{" "}
                {formatCurrency(
                  selectedContract?.remaining_balance ||
                    selectedContract?.total_value,
                )}
              </Text>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
            <div className="flex justify-between mb-1">
              <Text>Tổng giá trị hợp đồng:</Text>
              <Text strong>
                {formatCurrency(selectedContract?.total_value)}
              </Text>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
              <Text>Số tiền cần thanh toán ngay:</Text>
              <Text strong className="text-xl text-blue-600">
                {/* Logic hiển thị số tiền dựa trên lựa chọn */}
                {paymentType === "CUSTOM"
                  ? formatCurrency(customAmount)
                  : paymentType === "FULL"
                    ? formatCurrency(selectedContract?.total_value)
                    : formatCurrency(selectedContract?.total_value / 2)}
              </Text>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDashboard;
