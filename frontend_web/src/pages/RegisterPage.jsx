import React from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import regiterlogo from "../assets/Frame_0000.png";

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleRegister = async (values) => {
    try {
      message.loading({
        content: "Đang xử lý",
        key: "register",
      });
      const res = await authService.register(values);
      message.success({
        content: "Đăng ký thành công!",
        key: "register",
      });
      console.log(res);
      navigate("/login");
    } catch (error) {
      message.error({ content: "Đăng ký thất bại!", key: "register" });
      console.log(error);
    }
  };

  return (
    <section className="h-screen flex bg-white">
      {/* --- PHẦN BÊN TRÁI: ẢNH --- */}
      <div className="hidden lg:block lg:w-2/5 h-full">
        <img
          src={regiterlogo}
          className="h-full w-full object-cover rounded-3xl contrast-90 brightness-75"
          alt="pattern"
        />
      </div>

      <div className="w-full lg:w-3/5 h-full overflow-y-auto flex flex-col items-center py-10 px-8">
        {" "}
        <div className="text-center w-full max-w-2xl mt-auto mb-auto">
          {" "}
          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            Join Us Today
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Enter your details to register.
          </p>
          <Form
            layout="vertical"
            onFinish={handleRegister}
            size="large"
            className="text-left"
            scrollToFirstError
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item
                label={<span className="font-medium text-sm">Họ và tên</span>}
                name="user_fullName"
                rules={[{ required: true, message: "Hãy nhập họ và tên!" }]}
                className="mb-4"
              >
                <Input placeholder="Nguyễn Văn A" className="rounded-lg" />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-medium text-sm">Tên đăng nhập</span>
                }
                name="user_name"
                rules={[{ required: true, message: "Hãy nhập username!" }]}
                className="mb-4"
              >
                <Input placeholder="username" className="rounded-lg" />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-sm">Email</span>}
                name="user_email"
                rules={[
                  { required: true, message: "Hãy nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
                className="mb-4"
              >
                <Input placeholder="name@mail.com" className="rounded-lg" />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-medium text-sm">Số điện thoại</span>
                }
                name="user_phone"
                rules={[{ required: true, message: "Hãy nhập SĐT!" }]}
                className="mb-4"
              >
                <Input placeholder="0901234567" className="rounded-lg" />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-sm">Địa chỉ</span>}
                name="user_address"
                rules={[{ required: true, message: "Hãy nhập địa chỉ!" }]}
                className="mb-4 md:col-span-2"
              >
                <Input
                  placeholder="Số nhà, Đường, Quận, Thành phố..."
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-sm">Mật khẩu</span>}
                name="password"
                rules={[{ required: true, message: "Hãy nhập mật khẩu!" }]}
                className="mb-4"
              >
                <Input.Password placeholder="********" className="rounded-lg" />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-medium text-sm">Nhập lại mật khẩu</span>
                }
                name="repassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Hãy xác nhận lại mật khẩu!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Mật khẩu không khớp!"));
                    },
                  }),
                ]}
                className="mb-4"
              >
                <Input.Password placeholder="********" className="rounded-lg" />
              </Form.Item>
            </div>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("Bạn phải đồng ý với điều khoản"),
                        ),
                },
              ]}
              className="mt-2"
            >
              <Checkbox className="text-gray-600">
                I agree the&nbsp;
                <a href="#" className="font-bold text-gray-900 hover:underline">
                  Terms and Conditions
                </a>
              </Checkbox>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              className="h-12 bg-gray-900 hover:!bg-gray-800 rounded-lg font-bold uppercase text-sm shadow-lg"
            >
              Đang ký
            </Button>

            <div className="mt-6 text-center text-gray-600 pb-8">
              Already have an account?
              <Link
                to="/login"
                className="font-bold text-gray-900 ml-1 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
