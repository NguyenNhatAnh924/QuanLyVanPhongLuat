import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Card, Space, Tag, message, InputNumber, Switch, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SolutionOutlined } from '@ant-design/icons';
import servicePackageService from '../../services/servicePackageService';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    // 1. Lấy danh sách dịch vụ
    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await servicePackageService.list_service();
            setServices(data);
        } catch (error) {
            console.log(error);
            message.error("Không thể tải danh sách dịch vụ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // 2. Mở modal để thêm hoặc sửa
    const showModal = (record = null) => {
        if (record) {
            setEditingId(record.id);
            form.setFieldsValue(record);
        } else {
            setEditingId(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    // 3. Xử lý lưu dữ liệu (Create/Update)
    const handleSave = async (values) => {
        try {
            if (editingId) {
                await servicePackageService.update_service(editingId, values);
                message.success("Cập nhật dịch vụ thành công");
            } else {
                await servicePackageService.create_service(values);
                message.success("Thêm dịch vụ mới thành công");
            }
            setIsModalVisible(false);
            fetchServices();
        } catch (error) {
            console.log(error);
            message.error("Lỗi khi lưu thông tin dịch vụ");
        }
    };

    // 4. Xử lý xóa
    const handleDelete = async (id) => {
        try {
            await servicePackageService.delete_service(id);
            message.success("Đã xóa dịch vụ");
            fetchServices();
        } catch (error) {
            console.log(error);
            message.error("Xóa thất bại");
        }
    };

    const columns = [
        {
            title: 'Tên dịch vụ',
            dataIndex: 'name',
            key: 'name',
            render: text => <b className="text-gray-800">{text}</b>,
        },
        {
            title: 'Giá niêm yết',
            dataIndex: 'price',
            key: 'price',
            render: price => <span className="text-blue-600 font-bold">{Number(price).toLocaleString()} VNĐ</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: active => active ? <Tag color="green">Đang kinh doanh</Tag> : <Tag color="red">Ngừng kinh doanh</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => showModal(record)} />
                    <Popconfirm
                        title="Bạn có chắc muốn xóa dịch vụ này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Space size="middle">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <SolutionOutlined className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 m-0">Danh mục dịch vụ pháp lý</h1>
                            <p className="text-gray-500 m-0">Quản lý các gói dịch vụ niêm yết trên hệ thống</p>
                        </div>
                    </Space>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => showModal()}
                        className="h-10 rounded-lg bg-blue-600"
                    >
                        Thêm gói dịch vụ
                    </Button>
                </div>

                <Table 
                    dataSource={services} 
                    columns={columns} 
                    loading={loading} 
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                />
            </div>

            <Modal
                title={<b>{editingId ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}</b>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu thông tin"
                cancelText="Hủy"
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    <Form.Item 
                        label="Tên gói dịch vụ" 
                        name="name" 
                        rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
                    >
                        <Input placeholder="Ví dụ: Tư vấn ly hôn trọn gói" />
                    </Form.Item>

                    <Form.Item 
                        label="Giá tiền (VNĐ)" 
                        name="price" 
                        rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                        <InputNumber 
                            className="w-full" 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="Nhập số tiền..."
                        />
                    </Form.Item>

                    <Form.Item label="Mô tả phạm vi công việc" name="description">
                        <Input.TextArea rows={4} placeholder="Chi tiết các đầu việc trong gói này..." />
                    </Form.Item>

                    <Form.Item label="Kinh doanh" name="is_active" valuePropName="checked" initialValue={true}>
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ServiceManagement;