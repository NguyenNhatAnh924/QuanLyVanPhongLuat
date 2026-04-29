import React from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import loginBg from "../assets/ChatGPT Image 00_40_57 21 thg 3, 2026.png"; // Thay 'your-image.jpg' bằng tên file của bạn


export function SignIn() {
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      message.loading({ content: "Đang đăng nhập...", key: "auth" });
      const res = await authService.login(values.user_name, values.password);
      message.success({ content: "Đăng nhập thành công!", key: "auth" });
      if(res.user.user_role === 4){
        navigate("/admin");
      }else if( res.user.user_role === 0){
        navigate("/");
      }else if(res.user.user_role === 1){
        navigate("/consultant/requests")
      }else if( res.user.user_role === 3){
        navigate("/lawyer/cases")
      }else if(res.user.user_role === 2){
        navigate("/assistant/cases");
      }
      
    } catch (error) {
      console.error(error);
      message.error({ content: "Sai tài khoản hoặc mật khẩu!", key: "auth" });
    }
  };

  return (
    <section className="h-screen flex gap-4 p-4 overflow-hidden bg-white">
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4">
        
        <div className="text-center w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Sign In</h2>
          <p className="text-gray-600 mb-6">Enter your email and password.</p>
          
          <Form
            layout="vertical"
            onFinish={handleLogin}
            size="large"
            className="text-left"
          >
            <Form.Item
              label={<span className="font-medium text-sm">Tên người dùng</span>}
              name="user_name"
              rules={[{ required: true, message: "Please input email!" }]}
              className="mb-3" 
            >
              <Input placeholder="nhập tên người dùng" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium text-sm">Mật khẩu</span>}
              name="password"
              rules={[{ required: true, message: "Please input password!" }]}
              className="mb-3" 
            >
              <Input.Password placeholder="Nhập mật khẩu" className="rounded-lg" />
            </Form.Item>

            <div className="flex justify-between items-center mb-4">
               <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Tôi đồng ý với điều khoản</Checkbox>
               </Form.Item>
               <a href="#" className="text-sm font-bold text-gray-900 hover:text-blue-600">
                  Quên mật khẩu
               </a>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              className="h-10 bg-gray-900 hover:!bg-gray-800 rounded-lg font-bold uppercase"
            >
              Đăng nhập
            </Button>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button className="h-10 flex items-center justify-center gap-2 rounded-lg">
                <img src="https://www.material-tailwind.com/logos/logo-google.png" alt="google" className="h-5 w-5" />
                <span className="text-xs font-bold text-gray-700">Google</span>
              </Button>
              
              <Button className="h-10 flex items-center justify-center gap-2 rounded-lg">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" alt="twitter" className="h-4 w-4" />
                <span className="text-xs font-bold text-gray-700">Twitter</span>
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Not registered? </span>
              <Link to="/register" className="font-bold text-gray-900 hover:underline">
                Create account
              </Link>
            </div>
          </Form>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 h-full">
        <img
          src={loginBg}
          className="h-full w-full object-cover rounded-3xl contrast-90 brightness-75"
          alt="background"
        />
      </div>
    </section>
  );
}

export default SignIn;