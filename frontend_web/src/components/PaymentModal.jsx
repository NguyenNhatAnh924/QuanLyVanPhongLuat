import React from 'react';
import { Modal, Descriptions, Divider, Typography, Tag, Space } from 'antd';

const { Title, Text } = Typography;

const PaymentModal = ({ visible, onClose, contract, amountToPay }) => {
  const bankId = "MB";
  const accountNo = "123456789";
  const template = "compact";
  const description = `Thanh toan HD ${contract?.contract_number}`;
  
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amountToPay}&addInfo=${encodeURIComponent(description)}`;

  return (
    <Modal
      title="📌 Thông tin thanh toán"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={450}
    >
      <div className="text-center">
        <Descriptions column={1} bordered size="small" className="mb-4">
          <Descriptions.Item label="Hợp đồng">{contract?.contract_number}</Descriptions.Item>
          <Descriptions.Item label="Số tiền thanh toán">
            <Title level={4} type="danger" style={{ margin: 0 }}>
              {new Intl.NumberFormat('vi-VN').format(amountToPay)} VNĐ
            </Title>
          </Descriptions.Item>
          <Descriptions.Item label="Nội dung">{description}</Descriptions.Item>
        </Descriptions>

        <Divider>Quét mã để chuyển khoản</Divider>
        
        <div className="bg-gray-50 p-4 rounded-xl inline-block border-2 border-dashed border-gray-200">
          <img src={qrUrl} alt="Payment QR" style={{ width: '250px' }} />
        </div>
        
        <div className="mt-4">
          <Text type="secondary" italic>
            * Hệ thống sẽ xác nhận sau khi nhận được thông báo từ ngân hàng.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;