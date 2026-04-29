import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Tag, message, Upload, Popconfirm, DatePicker, Switch } from 'antd';
import { PlusOutlined, UploadOutlined, BookOutlined, RobotOutlined, DeleteOutlined } from '@ant-design/icons';
import lawService from '../../services/lawService';

const LawKnowledgeManager = () => {
    const [laws, setLaws] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();

    const fetchLaws = async () => {
        setLoading(true);
        try {
            const data = await lawService.getAllReferences();
            setLaws(data);
        } catch (error) {
            console.log(error);
            message.error("Không thể tải danh sách luật");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLaws();
    }, []);

    const handleDelete = async (id) => {
        try {
            await lawService.deleteLaw(id);
            message.success("Đã xóa văn bản luật");
            fetchLaws();
        } catch (error) {
            console.log(error);
            message.error("Xóa thất bại");
        }
    };

    // Hàm mới: Gạt nút bật/tắt hiệu lực của bộ luật trực tiếp trên bảng
    const handleToggleActive = async (checked, record) => {
        try {
            await lawService.updateLawReference(record.id, { is_active: checked });
            message.success(`Đã ${checked ? 'Bật' : 'Tắt'} trạng thái hiệu lực của ${record.law_name}`);
            fetchLaws();
        } catch (error) {
            console.log(error);
            message.error("Cập nhật trạng thái thất bại");
            fetchLaws(); // Khôi phục trạng thái cũ trên UI nếu lỗi
        }
    };

    const onFinish = async (values) => {
        if (fileList.length === 0) {
            return message.warning("Vui lòng chọn file .docx trước khi nạp!");
        }

        const key = 'upload_status';
        try {
            message.loading({ content: 'AI đang phân tích và tạo Vector. Vui lòng không đóng trang...', key, duration: 0 });
            
            // Xây dựng payload để gọi API theo cấu trúc lawService mới
            const payload = {
                file: fileList[0].originFileObj,
                lawName: values.law_name,
                category: values.category,
                description: values.description,
                // Format ngày thành chuỗi chuẩn YYYY-MM-DD nếu có chọn ngày
                effectiveDate: values.effective_date ? values.effective_date.format('YYYY-MM-DD') : null,
                isActive: values.is_active !== undefined ? values.is_active : true,
            };

            await lawService.uploadLawFile(payload);

            message.success({ content: 'Nạp tri thức pháp luật thành công!', key, duration: 2 });
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
            fetchLaws();
        } catch (error) {
            console.log(error);
            message.error({ content: 'Lỗi hệ thống khi nạp tri thức', key, duration: 3 });
        }
    };

    const columns = [
        { 
            title: 'Tên bộ luật', 
            dataIndex: 'law_name', 
            key: 'law_name', 
            render: text => <b className="text-gray-800">{text}</b> 
        },
        { 
            title: 'Lĩnh vực', 
            dataIndex: 'category', 
            key: 'category', 
            render: cat => cat ? <Tag color="blue">{cat}</Tag> : <i className="text-gray-400">Chưa phân loại</i>
        },
        { 
            title: 'Ngày hiệu lực', 
            dataIndex: 'effective_date', 
            key: 'effective_date',
            render: date => date ? new Date(date).toLocaleDateString('vi-VN') : <span className="text-gray-400">---</span>
        },
        { 
            title: 'Trạng thái', 
            dataIndex: 'is_active', 
            key: 'is_active',
            align: 'center',
            render: (isActive, record) => (
                <Switch 
                    checked={isActive} 
                    onChange={(checked) => handleToggleActive(checked, record)} 
                    checkedChildren="Đang áp dụng" 
                    unCheckedChildren="Hết hiệu lực"
                />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa vĩnh viễn dữ liệu tri thức này?"
                    description="AI sẽ không thể truy xuất bộ luật này nữa."
                    onConfirm={() => handleDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Space size="middle">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <BookOutlined className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 m-0">Tri thức pháp luật AI</h1>
                            <p className="text-gray-500 m-0">Quản lý và nạp dữ liệu huấn luyện cho trợ lý ảo</p>
                        </div>
                    </Space>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsModalVisible(true)}
                        className="h-10 rounded-lg bg-blue-600 font-semibold"
                    >
                        Nạp văn bản .docx
                    </Button>
                </div>

                <Table 
                    dataSource={laws} 
                    columns={columns} 
                    loading={loading} 
                    rowKey="id"
                    className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal 
                title={<b>Nạp văn bản luật mới</b>}
                open={isModalVisible} 
                onCancel={() => {
                    setIsModalVisible(false);
                    setFileList([]);
                    form.resetFields();
                }}
                footer={null}
                centered
                width={600}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={onFinish} 
                    className="mt-4"
                    initialValues={{ is_active: true }} // Mặc định luật mới thêm là đang áp dụng
                >
                    <Form.Item 
                        label="Tên hiển thị bộ luật" 
                        name="law_name" 
                        rules={[{required: true, message: 'Nhập tên bộ luật'}]}
                    >
                        <Input placeholder="Ví dụ: Bộ luật Lao động 2019" className="rounded-md" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item label="Lĩnh vực" name="category">
                            <Input placeholder="Ví dụ: Lao động" className="rounded-md" />
                        </Form.Item>

                        <Form.Item label="Ngày có hiệu lực" name="effective_date">
                            <DatePicker format="DD/MM/YYYY" className="w-full rounded-md" placeholder="Chọn ngày" />
                        </Form.Item>
                    </div>

                    <Form.Item label="Mô tả tóm tắt" name="description">
                        <Input.TextArea rows={2} placeholder="Nhập tóm tắt phạm vi điều chỉnh của luật này..." className="rounded-md" />
                    </Form.Item>

                    <Form.Item label="Tình trạng hiệu lực" name="is_active" valuePropName="checked">
                        <Switch checkedChildren="Còn hiệu lực" unCheckedChildren="Hết hiệu lực" />
                    </Form.Item>

                    <Form.Item label="Tệp văn bản (.docx)" required>
                        <Upload.Dragger
                            maxCount={1}
                            beforeUpload={() => false}
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            accept=".docx"
                            className="bg-gray-50"
                        >
                            <p className="ant-upload-drag-icon"><UploadOutlined className="text-blue-500" /></p>
                            <p className="ant-upload-text font-medium">Kéo thả hoặc nhấn để chọn file</p>
                            <p className="ant-upload-hint">Chỉ chấp nhận định dạng .docx</p>
                        </Upload.Dragger>
                    </Form.Item>

                    <Button 
                        type="primary" 
                        htmlType="submit"
                        block
                        icon={<RobotOutlined />}
                        className="h-11 mt-4 bg-blue-600 rounded-md font-bold"
                    >
                        BẮT ĐẦU HUẤN LUYỆN AI
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default LawKnowledgeManager;