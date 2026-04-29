import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Space, Tag, message, Select, Popconfirm, Avatar, Descriptions, Tabs, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined, UnlockOutlined, TeamOutlined, UserOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import userService from '../../services/userService';

const ROLE_MAP = {
    0: { label: "Khách hàng", color: "default" },
    1: { label: "Tư vấn viên", color: "blue" },
    2: { label: "Trợ lý luật sư", color: "purple" },
    3: { label: "Luật sư", color: "green" },
    4: { label: "Quản lý", color: "red" }
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // States cho UI và Form
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    // States cho Bộ lọc & Tabs
    const [activeTab, setActiveTab] = useState('staff'); // 'staff' hoặc 'client'
    const [searchText, setSearchText] = useState('');
    const [filterRole, setFilterRole] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAllUsers();
            setUsers(data || []); 
        } catch (error) {
            console.log(error);
            message.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // -----------------------------------------------------
    // LOGIC LỌC DỮ LIỆU (MẠNH MẼ & TỐI ƯU BẰNG USEMEMO)
    // -----------------------------------------------------
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // 1. Lọc theo Tab (Nhân viên vs Khách hàng)
            const isStaffTab = activeTab === 'staff';
            if (isStaffTab && user.user_role === 0) return false;
            if (!isStaffTab && user.user_role !== 0) return false;

            // 2. Lọc theo chuỗi tìm kiếm (Tên, Email, SĐT, Username)
            if (searchText) {
                const lowerSearch = searchText.toLowerCase();
                const matchName = user.user_fullName?.toLowerCase().includes(lowerSearch);
                const matchEmail = user.user_email?.toLowerCase().includes(lowerSearch);
                const matchPhone = user.user_phone?.toLowerCase().includes(lowerSearch);
                const matchUsername = user.user_name?.toLowerCase().includes(lowerSearch);
                
                if (!matchName && !matchEmail && !matchPhone && !matchUsername) return false;
            }

            // 3. Lọc theo Vai trò (Chỉ áp dụng cho Tab Nhân viên)
            if (isStaffTab && filterRole !== null) {
                if (user.user_role !== filterRole) return false;
            }

            // 4. Lọc theo Trạng thái hoạt động
            if (filterStatus !== null) {
                if (user.is_active !== filterStatus) return false;
            }

            return true;
        });
    }, [users, activeTab, searchText, filterRole, filterStatus]);

    // Xóa bộ lọc
    const clearFilters = () => {
        setSearchText('');
        setFilterRole(null);
        setFilterStatus(null);
    };

    // -----------------------------------------------------
    // LOGIC FORM & API
    // -----------------------------------------------------
    const showModal = (record = null) => {
        if (record) {
            setEditingId(record.user_id);
            form.setFieldsValue({ ...record, password: '' });
        } else {
            setEditingId(null);
            form.resetFields();
            // Nếu đang ở Tab Khách hàng thì mặc định role 0, ngược lại là role 1
            form.setFieldsValue({ user_role: activeTab === 'client' ? 0 : 1 }); 
        }
        setIsModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            if (editingId) {
                const updateData = { ...values };
                if (!updateData.password) delete updateData.password;
                
                await userService.updateUser(editingId, updateData);
                message.success("Cập nhật thông tin thành công");
            } else {
                await userService.createStaff(values);
                message.success("Tạo tài khoản mới thành công");
            }
            setIsModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.log(error);
            const errorMsg = error.response?.data?.user_name?.[0] 
                || error.response?.data?.user_email?.[0] 
                || error.response?.data?.error 
                || "Lỗi hệ thống khi lưu thông tin";
            message.error(errorMsg);
        }
    };

    const handleToggleStatus = async (record) => {
        try {
            await userService.toggleUserActiveStatus(record.user_id, !record.is_active);
            message.success(record.is_active ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
            fetchUsers();
        } catch (error) {
            console.log(error);
            message.error("Lỗi khi cập nhật trạng thái");
        }
    };

    // -----------------------------------------------------
    // CỘT BẢNG & RENDER MỞ RỘNG
    // -----------------------------------------------------
    const columns = [
        {
            title: activeTab === 'staff' ? 'Nhân sự' : 'Khách hàng',
            key: 'user',
            render: (_, record) => {
                const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.user_fullName || record.user_name)}&background=random`;
                return (
                    <Space size="middle">
                        <Avatar 
                            size={48} 
                            src={record.user_avatar || defaultAvatar} 
                            icon={!record.user_avatar && !record.user_fullName && <UserOutlined />}
                            className="border border-gray-200 shadow-sm"
                        />
                        <div>
                            <div className="font-bold text-gray-800 text-base">{record.user_fullName || "Chưa cập nhật"}</div>
                            <div className="text-xs text-gray-400">@{record.user_name}</div>
                        </div>
                    </Space>
                )
            },
        },
        {
            title: 'Liên hệ',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <div className="text-sm text-gray-600 font-medium">{record.user_email}</div>
                    <div className="text-xs text-gray-500">{record.user_phone || "Chưa có SĐT"}</div>
                </div>
            ),
        },
        // Ẩn cột Vai trò nếu đang ở tab Khách hàng (vì ai cũng là khách)
        ...(activeTab === 'staff' ? [{
            title: 'Vai trò',
            dataIndex: 'user_role',
            key: 'user_role',
            render: role => {
                const config = ROLE_MAP[role] || { label: "Không xác định", color: "default" };
                return <Tag color={config.color} className="px-3 py-1 rounded-full font-medium">{config.label}</Tag>;
            },
        }] : []),
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: active => active ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Đã khóa</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="text" className="text-blue-600 bg-blue-50 hover:bg-blue-100" icon={<EditOutlined />} onClick={() => showModal(record)} />
                    <Popconfirm
                        title={record.is_active ? "Bạn muốn khóa tài khoản này?" : "Bạn muốn mở khóa tài khoản này?"}
                        onConfirm={() => handleToggleStatus(record)}
                        okText="Đồng ý"
                        cancelText="Hủy"
                        okButtonProps={{ danger: record.is_active }}
                    >
                        <Button 
                            type="text" 
                            danger={record.is_active}
                            className={!record.is_active ? "text-green-600 bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"}
                            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />} 
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const expandedRowRender = (record) => {
        if (record.user_role === 0) {
            return (
                <div className="p-4 bg-gray-50 text-gray-600 rounded-lg border border-gray-100">
                    <b>Địa chỉ liên hệ:</b> {record.user_address || 'Chưa cập nhật'}
                </div>
            );
        }

        const profile = record.staff_profile || {};
        return (
            <div className="p-5 bg-blue-50/30 rounded-lg border border-blue-100 shadow-inner my-2">
                <Descriptions title={<span className="text-blue-800 font-semibold">Hồ sơ chuyên môn</span>} size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Chuyên môn"><b className="text-gray-700">{profile.specialization || 'Chưa cập nhật'}</b></Descriptions.Item>
                    <Descriptions.Item label="Kinh nghiệm"><b className="text-gray-700">{profile.experience_years ? `${profile.experience_years} năm` : '0 năm'}</b></Descriptions.Item>
                    <Descriptions.Item label="Số thẻ hành nghề"><b className="text-gray-700">{profile.license_number || 'Chưa cập nhật'}</b></Descriptions.Item>
                    <Descriptions.Item label="Ngày tham gia"><b className="text-gray-700">{profile.date_joined || 'Chưa cập nhật'}</b></Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={4}>{record.user_address || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Tiểu sử / Giới thiệu" span={4}>
                        <div className="whitespace-pre-wrap text-gray-600 bg-white p-3 rounded border border-gray-200 w-full">
                            {profile.bio || 'Chưa có thông tin giới thiệu.'}
                        </div>
                    </Descriptions.Item>
                </Descriptions>
            </div>
        );
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <Space size="middle">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
                            <TeamOutlined className="text-white text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 m-0">Quản lý tài khoản</h1>
                            <p className="text-gray-500 m-0 mt-1">Quản lý hồ sơ nhân sự và danh sách khách hàng</p>
                        </div>
                    </Space>
                    <Button 
                        type="primary" 
                        size="large"
                        icon={<PlusOutlined />} 
                        onClick={() => showModal()}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md font-medium"
                    >
                        {activeTab === 'staff' ? 'Thêm nhân viên' : 'Thêm khách hàng'}
                    </Button>
                </div>

                {/* BỘ LỌC TÌM KIẾM */}
                <div className="bg-white p-4 mb-6 rounded-xl shadow-sm border border-gray-100">
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={8}>
                            <Input 
                                placeholder="Tìm theo tên, username, email, SĐT..." 
                                prefix={<SearchOutlined className="text-gray-400" />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                allowClear
                                size="large"
                                className="w-full rounded-lg"
                            />
                        </Col>
                        {activeTab === 'staff' && (
                            <Col xs={12} md={5}>
                                <Select 
                                    placeholder="Lọc theo chức vụ" 
                                    className="w-full" 
                                    size="large"
                                    value={filterRole}
                                    onChange={val => setFilterRole(val)}
                                    allowClear
                                >
                                    <Select.Option value={1}>Tư vấn viên</Select.Option>
                                    <Select.Option value={2}>Trợ lý luật sư</Select.Option>
                                    <Select.Option value={3}>Luật sư</Select.Option>
                                    <Select.Option value={4}>Quản lý (Admin)</Select.Option>
                                </Select>
                            </Col>
                        )}
                        <Col xs={12} md={5}>
                            <Select 
                                placeholder="Trạng thái tài khoản" 
                                className="w-full" 
                                size="large"
                                value={filterStatus}
                                onChange={val => setFilterStatus(val)}
                                allowClear
                            >
                                <Select.Option value={true}>Đang hoạt động</Select.Option>
                                <Select.Option value={false}>Đã khóa</Select.Option>
                            </Select>
                        </Col>
                        <Col xs={24} md={activeTab === 'staff' ? 6 : 11} className="text-right">
                            <Button 
                                icon={<ClearOutlined />} 
                                onClick={clearFilters}
                                className="text-gray-500 hover:text-red-500"
                            >
                                Xóa bộ lọc
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* TABS & TABLE */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-2">
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={(key) => {
                            setActiveTab(key);
                            clearFilters(); // Reset bộ lọc khi chuyển tab
                        }}
                        className="px-4 pt-2"
                        items={[
                            { label: <span className="text-base font-medium px-4">Đội ngũ Nhân viên</span>, key: 'staff' },
                            { label: <span className="text-base font-medium px-4">Khách hàng</span>, key: 'client' },
                        ]}
                    />
                    
                    <Table 
                        dataSource={filteredUsers} 
                        columns={columns} 
                        loading={loading} 
                        rowKey="user_id"
                        expandable={{ expandedRowRender }}
                        pagination={{ pageSize: 10, className: "pr-4 pb-4" }}
                        className="custom-modern-table"
                    />
                </div>
            </div>

            {/* MODAL THÊM / SỬA */}
            <Modal
                title={<span className="text-xl font-bold text-gray-800">{editingId ? "Chỉnh sửa hồ sơ" : (activeTab === 'staff' ? "Thêm nhân viên mới" : "Thêm khách hàng mới")}</span>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                okText="Lưu thông tin"
                cancelText="Hủy"
                centered
                width={700}
                className="custom-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-6 grid grid-cols-2 gap-x-6">
                    <Form.Item label="Tên đăng nhập" name="user_name" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
                        <Input disabled={!!editingId} placeholder="Ví dụ: nhatanh123" size="large" />
                    </Form.Item>

                    <Form.Item label={editingId ? "Mật khẩu mới (Tùy chọn)" : "Mật khẩu"} name="password" rules={[{ required: !editingId, message: 'Vui lòng nhập mật khẩu' }]}>
                        <Input.Password placeholder="Nhập mật khẩu..." size="large" />
                    </Form.Item>

                    <Form.Item label="Họ và Tên" name="user_fullName" className="col-span-2" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                        <Input placeholder="Nhập họ và tên..." size="large" />
                    </Form.Item>

                    <Form.Item label="Email" name="user_email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không đúng định dạng' }]}>
                        <Input placeholder="example@gmail.com" size="large" />
                    </Form.Item>

                    <Form.Item label="Số điện thoại" name="user_phone">
                        <Input placeholder="09xxxx..." size="large" />
                    </Form.Item>

                    <Form.Item label="Địa chỉ" name="user_address" className="col-span-2">
                        <Input placeholder="Nhập địa chỉ..." size="large" />
                    </Form.Item>

                    {/* Chỉ cho phép đổi chức vụ nếu là thêm nhân viên. Khách hàng mặc định là role 0 */}
                    <Form.Item label="Vai trò (Quyền hạn)" name="user_role" className="col-span-2">
                        <Select size="large" disabled={activeTab === 'client'} placeholder="Chọn quyền cho tài khoản">
                            <Select.Option value={0}>Khách hàng</Select.Option>
                            <Select.Option value={1}>Tư vấn viên</Select.Option>
                            <Select.Option value={2}>Trợ lý luật sư</Select.Option>
                            <Select.Option value={3}>Luật sư</Select.Option>
                            <Select.Option value={4}>Quản lý (Admin)</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;