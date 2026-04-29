import React, { useState, useEffect, useRef } from 'react';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import userService from '../../services/userService';

const UserProfile = () => {
  const [formData, setFormData] = useState({
    user_name: '', 
    user_fullName: '',
    user_email: '',
    user_phone: '',
    user_address: '',
    user_avatar: 'https://i.pravatar.cc/150?img=11', 
  });

  const [avatarFile, setAvatarFile] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await userService.getCurrentUser();
      setFormData({
        user_name: userData.user_name || '',
        user_fullName: userData.user_fullName || '',
        user_email: userData.user_email || '',
        user_phone: userData.user_phone || '',
        user_address: userData.user_address || '',
        user_avatar: userData.user_avatar 
          ? `http://127.0.0.1:8000${userData.user_avatar}` 
          : 'https://i.pravatar.cc/150?img=11',
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, user_avatar: previewUrl });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('user_fullName', formData.user_fullName);
      submitData.append('user_phone', formData.user_phone);
      submitData.append('user_address', formData.user_address);
      
      if (avatarFile) {
        submitData.append('user_avatar', avatarFile);
      }

      const response = await userService.updateProfile(submitData);
      
      if (response.message) {
        alert('Đã cập nhật thông tin thành công!');
        if (avatarFile) URL.revokeObjectURL(formData.user_avatar);
        setAvatarFile(null);
      }
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('Cập nhật thất bại. Vui lòng kiểm tra lại!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-slate-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Quản lý tài khoản</h1>
          <p className="text-gray-500 mt-1">Cập nhật thông tin cá nhân của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 uppercase tracking-wide border-b pb-2">
              Thông tin cá nhân
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
                  <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    name="user_fullName"
                    value={formData.user_fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="user_email"
                    value={formData.user_email}
                    disabled
                    title="Bạn không thể thay đổi email sau khi đăng ký"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    name="user_phone"
                    value={formData.user_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    name="user_address"
                    value={formData.user_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-all active:scale-95"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="h-32 bg-blue-900 w-full relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
              </div>

              <div className="px-6 pb-6 text-center">
                <div className="relative inline-block -mt-16 mb-4">
                  <img
                    src={formData.user_avatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"
                  />
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                  />

                  <button 
                    type="button" 
                    onClick={triggerFileInput}
                    className="absolute bottom-2 right-2 p-1.5 bg-slate-800 text-white rounded-full hover:bg-slate-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </button>
                </div>

                <h3 className="text-xl font-bold text-slate-800">{formData.user_fullName || 'Khách hàng'}</h3>
                <p className="text-gray-500 text-sm mb-6">{formData.user_email}</p>

                <div className="flex justify-center gap-6 border-t border-gray-100 pt-6">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-800">--</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Yêu cầu</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-800">--</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Hợp đồng</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;