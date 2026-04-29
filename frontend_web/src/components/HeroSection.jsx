import React from 'react';
import { Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <header className="relative h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
        <div className="inline-block px-4 py-1 mb-6 rounded-full bg-blue-600/20 border border-blue-400 text-blue-300 font-semibold text-sm animate-bounce">
           ✨ Giải pháp pháp lý 4.0
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          Luật sư của bạn, <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
             Mọi lúc mọi nơi.
          </span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Kết nối với hàng ngàn luật sư uy tín hàng đầu. Tư vấn trực tuyến, đặt lịch hẹn nhanh chóng và bảo mật tuyệt đối.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
           <Button 
              type="primary" 
              size="large" 
              className="h-14 px-10 text-lg font-bold bg-blue-600 hover:!bg-blue-500 rounded-full shadow-blue-500/50 shadow-lg border-none"
              onClick={() => navigate('/register')}
           >
              Tìm Luật Sư Ngay <RocketOutlined />
           </Button>
           <Button 
              size="large" 
              className="h-14 px-10 text-lg font-bold text-white bg-white/10 hover:bg-white/20 border-white/30 backdrop-blur-sm rounded-full"
           >
              Xem Quy Trình
           </Button>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;