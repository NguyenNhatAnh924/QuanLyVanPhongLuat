import React, { useState, useEffect, useRef } from "react";
import { message } from "antd";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import userService from "../services/userService";

const StaffProfile = () => {
  const [formData, setFormData] = useState({
    user_name: "",
    user_fullName: "",
    user_email: "",
    user_phone: "",
    user_address: "",
    user_avatar: "",
    specialization: "",
    license_number: "",
    experience_years: "",
    bio: "",
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
        user_name: userData.user_name || "",
        user_fullName: userData.user_fullName || "",
        user_email: userData.user_email || "",
        user_phone: userData.user_phone || "",
        user_address: userData.user_address || "",
        user_avatar: userData.user_avatar
          ? `http://127.0.0.1:8000${userData.user_avatar}`
          : "https://i.pravatar.cc/150?img=11",
        specialization: userData.staff_profile?.specialization || "",
        license_number: userData.staff_profile?.license_number || "",
        experience_years: userData.staff_profile?.experience_years || 0,
        bio: userData.staff_profile?.bio || "",
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin:", error);
      message.error("Không thể tải thông tin nhân viên.");
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
      submitData.append("user_fullName", formData.user_fullName);
      submitData.append("user_phone", formData.user_phone);
      submitData.append("user_address", formData.user_address);

      submitData.append(
        "staff_profile.specialization",
        formData.specialization,
      );
      submitData.append(
        "staff_profile.license_number",
        formData.license_number,
      );
      submitData.append(
        "staff_profile.experience_years",
        formData.experience_years,
      );
      submitData.append("staff_profile.bio", formData.bio);

      if (avatarFile) {
        submitData.append("user_avatar", avatarFile);
      }

      const response = await userService.updateProfile(submitData);

      if (response.message) {
        message.success("Đã cập nhật hồ sơ nhân sự thành công!");
        if (avatarFile) URL.revokeObjectURL(formData.user_avatar);
        setAvatarFile(null);
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      message.error("Cập nhật thất bại. Vui lòng kiểm tra lại!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-blue-900">
          Đang tải hồ sơ nhân sự...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-blue-900 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Thông tin cơ bản
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      name="user_name"
                      value={formData.user_name}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email công việc
                    </label>
                    <input
                      type="email"
                      name="user_email"
                      value={formData.user_email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      name="user_fullName"
                      value={formData.user_fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      name="user_phone"
                      value={formData.user_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ hiện tại
                    </label>
                    <input
                      type="text"
                      name="user_address"
                      value={formData.user_address}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-blue-900 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Hồ sơ năng lực
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chuyên môn (Lĩnh vực)
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="VD: Luật Hôn nhân, Hình sự..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số thẻ hành nghề
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      placeholder="Nhập số thẻ (nếu có)"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số năm kinh nghiệm
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleChange}
                      min="0"
                      className="w-full md:w-1/2 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới thiệu bản thân (Bio)
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Viết một đoạn ngắn giới thiệu về kinh nghiệm làm việc của bạn..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pb-10">
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lưu Hồ Sơ
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden sticky top-24">
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
                    className="absolute bottom-2 right-2 p-1.5 bg-blue-900 text-white rounded-full hover:bg-blue-800 shadow-sm transition-colors cursor-pointer border-2 border-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                  </button>
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {formData.user_fullName || "Tên nhân sự"}
                </h3>
                <p className="text-blue-600 font-medium text-sm mb-1">
                  {formData.specialization || "Chuyên viên Pháp lý"}
                </p>
                <p className="text-gray-500 text-xs mb-6">
                  Kinh nghiệm: {formData.experience_years || 0} năm
                </p>

                <div className="flex justify-center gap-6 border-t border-gray-100 pt-6">
                  <div className="text-center">
                    <span className="block text-xl font-bold text-blue-900">
                      12
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Vụ việc
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-blue-900">
                      4.8⭐
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Đánh giá
                    </span>
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

export default StaffProfile;
