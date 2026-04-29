import React from 'react';
import { Button } from 'antd';
import { CheckCircleFilled, ArrowRightOutlined } from '@ant-design/icons';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* --- CỘT 1: HÌNH ẢNH (Collage Effect) --- */}
          <div className="relative">
            {/* Ảnh Chính (To) */}
            <img 
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop" 
              alt="Team meeting" 
              className="w-full h-[500px] object-cover rounded-2xl shadow-xl"
            />

            {/* Ảnh Phụ (Nhỏ - Nằm đè lên góc dưới) */}
            <img 
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1769&auto=format&fit=crop" 
              alt="Handshake" 
              className="hidden md:block absolute -bottom-10 -left-10 w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-white"
            />

            {/* Thẻ Thống Kê Nổi (Góc trên phải) */}
            <div className="absolute top-10 -right-6 bg-blue-900 text-white p-6 rounded-xl shadow-lg animate-bounce-slow">
              <div className="text-4xl font-bold mb-1">15+</div>
              <div className="text-sm font-medium opacity-80">Năm Kinh Nghiệm</div>
            </div>
          </div>

          {/* --- CỘT 2: NỘI DUNG VĂN BẢN --- */}
          <div className="lg:pl-10">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wide">
              Về chúng tôi
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Chúng tôi bảo vệ quyền lợi hợp pháp của bạn
            </h2>
            
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              LuatSu Online được thành lập với sứ mệnh mang đến công lý và sự an tâm cho mọi khách hàng. Đội ngũ luật sư của chúng tôi không chỉ giỏi chuyên môn mà còn tận tâm với từng hồ sơ.
            </p>

            <p className="text-gray-600 mb-8">
              Chúng tôi hiểu rằng mỗi vụ kiện là một câu chuyện, và chúng tôi ở đây để giúp bạn viết nên một kết thúc tốt đẹp nhất. Sự hài lòng của khách hàng là thước đo thành công duy nhất của chúng tôi.
            </p>

            {/* Danh sách cam kết (Checklist) */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircleFilled className="text-blue-600 text-xl" />
                <span className="font-medium text-gray-800">Đội ngũ luật sư 100% có chứng chỉ hành nghề.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircleFilled className="text-blue-600 text-xl" />
                <span className="font-medium text-gray-800">Bảo mật thông tin khách hàng tuyệt đối.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircleFilled className="text-blue-600 text-xl" />
                <span className="font-medium text-gray-800">Chi phí minh bạch, không phát sinh.</span>
              </div>
            </div>

            {/* Nút bấm */}
            <Button 
              type="primary" 
              size="large" 
              className="h-12 px-8 bg-blue-900 hover:!bg-blue-800 font-bold rounded-lg flex items-center gap-2 shadow-lg"
            >
              Xem Hồ Sơ Năng Lực <ArrowRightOutlined />
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;