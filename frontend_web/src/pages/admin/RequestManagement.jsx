import React, { useEffect, useState, useCallback } from "react";
import { Table, Tag, Button, Space, Tooltip, Modal, message, Select, Descriptions, Flex, Alert } from "antd";
import {
  EyeOutlined,
  UsergroupAddOutlined,
  WarningOutlined
} from "@ant-design/icons";
import legalCaseService from "../../services/legalCaseService";
import userService from "../../services/userService";

const RequestManagement = () => {
  const [data, setData] = useState([]);

  const [listLawyers, setListLawyers] = useState([]);
  const [listAssistants, setListAssistants] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const lawyersData = await userService.lawyers();
        const assistantsData = await userService.assigned_legal(); 
        
        const lwList = Array.isArray(lawyersData) ? lawyersData : lawyersData?.lawyers || [];
        const asList = Array.isArray(assistantsData) ? assistantsData : assistantsData?.assistants || [];

        setListLawyers(lwList.map(u => ({ label: u.user_fullName, value: u.user_id })));
        setListAssistants(asList.map(u => ({ label: u.user_fullName, value: u.user_id })));
        
      } catch (error) {
        console.log("Lỗi lấy nhân viên:", error);
      }
    };
    fetchStaff();
  }, []);

  const fetchLegalCases = useCallback(async () => {
    try {
      const res = await legalCaseService.list_legaCase();
      setData(res.results || res || []);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    fetchLegalCases();
  }, [fetchLegalCases]);

  const showDetail = (record) => {
    setSelectedRequest(record);
    setSelectedLawyerId(record.assigned_lawyer?.user_id || null); 
    setSelectedAssistantId(record.assistant?.user_id || record.assigned_legal_assistant?.user_id || null);
    setIsModalOpen(true);
  };

  const handleAssign = async () => {
    try {
      await legalCaseService.assignStaff(selectedRequest.id, selectedLawyerId, selectedAssistantId);
      message.success("Lưu phân công nhân sự thành công!");
      setIsModalOpen(false);
      fetchLegalCases(); 
    } catch (error) {
      message.error("Lỗi phân công");
      console.log(error);
    }
  };

  const handleReject = async () => {
      try {
          await legalCaseService.updateStatus(selectedRequest.id, "REJECTED");
          message.success("Đã từ chối hồ sơ");
          setIsModalOpen(false);
          fetchLegalCases();
      } catch (error) { console.log(error); }
  }

  const columns = [
    {
      title: "Mã HS",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-semibold text-gray-500">#{id}</span>
    },
    { 
      title: "Tiêu đề vụ việc", 
      dataIndex: "title", 
      key: "title",
      render: (text) => <span className="font-medium text-blue-800">{text}</span>
    },
    {
      title: "Khách hàng",
      dataIndex: ["client", "user_fullName"],
      key: "client_name",
      render: (text) => <span className="text-gray-800">{text || "Không xác định"}</span>,
    },
    {
        title: "Luật sư chủ trì",
        dataIndex: ["assigned_lawyer", "user_id"], 
        key: "assigned_lawyer",
        render: (lawyerId) => {
            const lawyer = listLawyers.find(item => item.value === lawyerId);
            return lawyer ? <Tag color="geekblue">{lawyer.label}</Tag> : <span className="text-gray-400 italic text-xs">Chưa phân công</span>;
        }
    },
    {
        title: "Trợ lý hỗ trợ",
        key: "assistant",
        render: (_, record) => {
            const astId = record.assistant?.user_id || record.assigned_legal_assistant?.user_id;
            const assistant = listAssistants.find(item => item.value === astId);
            return assistant ? <Tag color="cyan">{assistant.label}</Tag> : <span className="text-gray-400 italic text-xs">Chưa phân công</span>;
        }
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      render: (status) => {
        let color = "default";
        let text = "Chờ xử lý";
        if (status === "PROCESSING") { color = "processing"; text = "Đang xử lý"; }
        if (status === "CONFIRMED") { color = "success"; text = "Đã xác nhận"; }
        if (status === "REJECTED") { color = "error"; text = "Từ chối"; }
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem & Phân công">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => showDetail(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Phân công (Admin)</h2>
        <Button>Xuất Excel</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={
          <Flex align="center" gap="small" className="text-xl text-blue-900 mb-2">
            <span className="font-bold">CHI TIẾT & PHÂN CÔNG VỤ VIỆC</span>
            <Tag color="blue" className="text-base rounded-md m-0">#{selectedRequest?.id}</Tag>
          </Flex>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={800} 
        centered
        footer={[
          <Button key="deny" danger type="text" onClick={handleReject}>
            Từ chối hồ sơ
          </Button>,
          <Button
            key="assign"
            type="primary"
            className="bg-blue-600"
            icon={<UsergroupAddOutlined />}
            onClick={handleAssign}
          >
            Lưu phân công
          </Button>,
        ]}
      >
        {selectedRequest && (
          <Flex vertical gap="middle" className="pt-2">
            
            {selectedRequest.is_coi_flagged && (
              <Alert
                message="Hệ thống AI Cảnh báo Xung đột lợi ích (COI)"
                description={<div className="whitespace-pre-line text-sm mt-1">{selectedRequest.coi_note}</div>}
                type="error"
                showIcon
                icon={<WarningOutlined />}
                className="rounded-lg border-red-200 bg-red-50"
              />
            )}

            <Descriptions 
              size="small" 
              bordered 
              column={2} 
              className="bg-white shadow-sm rounded-lg overflow-hidden"
              styles={{ label: { fontWeight: "600", color: "#4b5563", width: "130px", backgroundColor: "#f9fafb" } }}
            >
              <Descriptions.Item label="Tiêu đề" span={2}>
                <span className="font-bold text-blue-800">{selectedRequest.title}</span>
              </Descriptions.Item>
              
              <Descriptions.Item label="Khách hàng">
                {selectedRequest.client?.user_fullName || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT Khách">
                {selectedRequest.client?.user_phone || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Bên đối lập">
                <span className="text-red-600 font-medium">{selectedRequest.opposing_party_name || "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Đ/C Đối lập">
                {selectedRequest.opposing_party_address || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày gửi">
                {new Date(selectedRequest.created_at).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedRequest.status === "CONFIRMED" ? "success" : "processing"} className="m-0">
                  {selectedRequest.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <span className="font-bold text-gray-700 uppercase text-xs mb-2 block border-b pb-1">Mô tả nội dung sự việc</span>
                <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed m-0">
                  {selectedRequest.description}
                </p>
            </div>

            <div className="border border-blue-100 bg-blue-50/30 p-5 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 uppercase text-sm">
                  <UsergroupAddOutlined /> Chỉ định nhân sự phụ trách
                </h4>
                
                <Flex gap="middle" className="w-full">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            👤 Luật sư chủ trì <span className="text-red-500">*</span>
                        </label>
                        <Select
                            style={{ width: '100%' }}
                            size="large"
                            placeholder="-- Chọn Luật sư --"
                            options={listLawyers} 
                            value={selectedLawyerId}
                            onChange={(val) => setSelectedLawyerId(val)}
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🧑‍💼 Trợ lý hỗ trợ (Tùy chọn)
                        </label>
                        <Select
                            style={{ width: '100%' }}
                            size="large"
                            placeholder="-- Chọn Trợ lý --"
                            options={listAssistants}
                            value={selectedAssistantId}
                            onChange={(val) => setSelectedAssistantId(val)}
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </div>
                </Flex>
            </div>
            
          </Flex>
        )}
      </Modal>
    </div>
  );
};

export default RequestManagement;