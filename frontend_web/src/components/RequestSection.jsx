import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Select } from "antd";
import {
  SendOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import legalCaseService from "../services/legalCaseService";
import servicePackageService from "../services/servicePackageService";
import userService from "../services/userService";

const { TextArea } = Input;
const { Option } = Select;

const RequestSection = () => {
  const [form] = Form.useForm();
  const [services, setServices] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const response_servicces = await servicePackageService.list_service();
        setServices(response_servicces);
        const response_lawyers = await userService.lawyers();
        setLawyers(response_lawyers);
      } catch (error) {
        console.log(error);
        message.error("Không thể tải danh sách gói dịch vụ");
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const onFinish = async (values) => {
    try {
      message.loading({ content: "Đang gửi yêu cầu...", key: "request" });
      const payload = {
        title: values.title,
        description: values.description,
        opposing_party_name: values.opponent_name,
        opposing_party_address: values.opponent_address,
        service_package: values.service_package_id,
        assigned_lawyer: values.assigned_lawyer,
      };

      await legalCaseService.create(payload);
      message.success({
        content: "Yêu cầu đã được gửi thành công!",
        key: "request",
      });
      form.resetFields();
    } catch (error) {
      message.error({
        content: error.response?.data?.error || "Yêu cầu thất bại",
        key: "request",
      });
    }
  };

  return (
    <section
      id="request-support"
      className="py-24 bg-white px-6 border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wide">
              Hỗ trợ trực tuyến
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Gửi yêu cầu pháp lý <br />
              <span className="text-blue-600">Nhanh chóng & Bảo mật</span>
            </h2>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
              Chọn gói dịch vụ phù hợp và mô tả vụ việc. Hệ thống AI của chúng
              tôi sẽ kiểm tra xung đột lợi ích ngay lập tức.
            </p>

            <div className="space-y-8">
              <div className="flex gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <AppstoreAddOutlined />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                    1. Chọn gói dịch vụ
                  </h4>
                  <p className="text-gray-500">
                    Lựa chọn lĩnh vực pháp lý bạn cần tư vấn.
                  </p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <FileTextOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      2. Mô tả vấn đề
                    </h4>
                    <p className="text-gray-500">
                      Nhập tiêu đề và mô tả chi tiết diễn biến sự việc của bạn.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <UserSwitchOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      3. Thông tin đối lập
                    </h4>
                    <p className="text-gray-500">
                      Cung cấp thông tin bên tranh chấp để tránh xung đột lợi
                      ích.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <SendOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      4. Nhận phản hồi
                    </h4>
                    <p className="text-gray-500">
                      Luật sư sẽ xem xét hồ sơ và liên hệ lại với bạn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">
              Điền thông tin yêu cầu
            </h3>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
              requiredMark="optional"
            >
              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Tiêu đề sự việc
                  </span>
                }
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
              >
                <Input
                  className="rounded-xl border-gray-200"
                  placeholder="Ví dụ: Đơn phương ly hôn..."
                />
              </Form.Item>
              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Gói dịch vụ cần hỗ trợ
                  </span>
                }
                name="service_package_id"
                rules={[
                  { required: true, message: "Vui lòng chọn một gói dịch vụ!" },
                ]}
              >
                <Select
                  placeholder="Chọn gói dịch vụ"
                  loading={loadingServices}
                  className="rounded-xl overflow-hidden"
                >
                  {services.map((pkg) => (
                    <Option key={pkg.id} value={pkg.id}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{pkg.name}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Chọn luật sư hổ trợ
                  </span>
                }
                name="assigned_lawyer"
              >
                <Select
                  placeholder="Chọn luật sư hổ trợ"
                  loading={loadingServices}
                  className="rounded-xl overflow-hidden"
                >
                  {lawyers.map((law) => (
                    <Option key={law.user_id} value={law.user_id}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{law.user_fullName}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <div className="bg-white p-6 rounded-2xl mb-6 border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <InfoCircleOutlined className="text-blue-500" /> Thông tin Bên
                  đối lập
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="opponent_name"
                    rules={[{ required: true, message: "Nhập tên!" }]}
                    className="mb-0"
                  >
                    <Input
                      className="rounded-xl"
                      placeholder="Họ tên bên kia..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="opponent_address"
                    rules={[{ required: true, message: "Nhập địa chỉ!" }]}
                    className="mb-0"
                  >
                    <Input
                      className="rounded-xl"
                      prefix={<EnvironmentOutlined className="text-gray-400" />}
                      placeholder="Địa chỉ..."
                    />
                  </Form.Item>
                </div>
              </div>

              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Mô tả chi tiết diễn biến
                  </span>
                }
                name="description"
                rules={[
                  { required: true, message: "Vui lòng mô tả chi tiết!" },
                ]}
              >
                <TextArea
                  rows={5}
                  className="rounded-xl border-gray-200"
                  placeholder="Vui lòng cung cấp các mốc thời gian và chi tiết quan trọng..."
                  showCount
                  maxLength={2000}
                />
              </Form.Item>

              <Form.Item className="mb-0 mt-8">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="h-14 bg-blue-900 hover:!bg-blue-800 font-bold text-lg rounded-xl flex items-center justify-center gap-2"
                >
                  Gửi yêu cầu <ArrowRightOutlined />
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestSection;