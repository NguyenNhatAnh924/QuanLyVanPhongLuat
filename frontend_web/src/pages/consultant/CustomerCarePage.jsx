import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Select, message, Card, Typography, Space, Rate, Input, Divider } from 'antd';
import { PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import feedbackService from '../../services/feedbackService'; 

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input; 

const CustomerCarePage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  
  const [goalStatus, setGoalStatus] = useState(1); 
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const loadPendingCases = async () => {
    setLoading(true);
    try {
      const allCases = await legalCaseService.list_legaCase();
      const pending = allCases.filter(
        (c) => c.status === 'LIQUIDATED' && c.goal_achievement_status === 0
      );
      setData(pending);
    } catch (error) {
      message.error("Không thể tải danh sách đối soát!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingCases();
  }, []);

  const handleConfirmVerify = async () => {
    if (!selectedCase) return;
    try {
      await legalCaseService.verifyGoalStatus(selectedCase.id, goalStatus);
      
      if (selectedCase.assigned_lawyer) {
        const feedbackData = {
          lawyer: selectedCase.assigned_lawyer.user_id,
          client_id: selectedCase.client?.user_id,
          rating: rating,
          comment: comment.trim() !== "" ? comment : "Khách hàng không để lại nhận xét chi tiết."
        };
        await feedbackService.createFeedback(feedbackData);
      }
      
      message.success(`Đã xác nhận kết quả và lưu đánh giá cho vụ việc: ${selectedCase.title}`);
      setIsModalOpen(false);
      setGoalStatus(1);
      setRating(5);
      setComment("");
      loadPendingCases(); 
    } catch (error) {
      const errorMsg = error.response?.data?.client_id || "Lỗi khi cập nhật trạng thái đối soát hoặc đánh giá!";
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: 'Tên vụ việc',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Khách hàng',
      key: 'client_info',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text>{record.client?.user_fullName}</Text>
          <Text type="secondary" size="small">{record.client?.user_phone}</Text>
        </Space>
      ),
    },
    {
      title: 'Luật sư phụ trách',
      key: 'lawyer',
      render: (_, record) => record.assigned_lawyer?.user_fullName || "Chưa rõ",
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<PhoneOutlined />} 
          onClick={() => {
            setSelectedCase(record);
            setIsModalOpen(true);
          }}
        >
          Đối soát ngay
        </Button>
      ),
    },
  ];

  return (
    <Card style={{ margin: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Title level={3}>
        <PhoneOutlined /> Trạm Chăm sóc & Đối soát Khách hàng
      </Title>
      <Text type="secondary">
        Dành cho Tư vấn viên: Liên hệ khách hàng để xác nhận mức độ đạt mục tiêu sau khi vụ việc hoàn thành.
      </Text>

      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading} 
        rowKey="id" 
        style={{ marginTop: '20px' }}
        locale={{ emptyText: 'Hiện không có vụ việc nào cần đối soát' }}
      />

      <Modal
        title="Xác nhận kết quả & Đánh giá hậu mãi"
        open={isModalOpen}
        onOk={handleConfirmVerify}
        onCancel={() => {
          setIsModalOpen(false);
          setGoalStatus(1);
          setRating(5);
          setComment("");
        }}
        okText="Lưu thông tin"
        cancelText="Hủy"
      >
        {selectedCase && (
          <div style={{ padding: '10px 0' }}>
            <p>Vụ việc: <strong>{selectedCase.title}</strong></p>
            <p>Khách hàng: <strong>{selectedCase.client?.user_fullName}</strong></p>
            <p>Luật sư phụ trách: <strong>{selectedCase.assigned_lawyer?.user_fullName || "Chưa rõ"}</strong></p>

            <Divider orientation="left" plain>1. Xác nhận mục tiêu</Divider>
            <Select
              style={{ width: '100%' }}
              value={goalStatus}
              onChange={(value) => setGoalStatus(value)}
            >
              <Option value={1}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Đạt mong muốn của khách
              </Option>
              <Option value={2}>
                <CloseCircleOutlined style={{ color: '#f5222d' }} /> Không đạt mong muốn
              </Option>
            </Select>

            <Divider orientation="left" plain>2. Nhập đánh giá từ khách hàng</Divider>
            <div style={{ marginBottom: '10px' }}>
              <Text style={{ marginRight: '10px' }}>Đánh giá Luật sư: </Text>
              <Rate value={rating} onChange={setRating} />
            </div>
            <TextArea 
              rows={3} 
              placeholder="Nhập nhận xét của khách hàng về luật sư và dịch vụ..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default CustomerCarePage;