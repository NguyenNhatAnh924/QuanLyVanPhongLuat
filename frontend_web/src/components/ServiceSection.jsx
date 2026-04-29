import React from 'react';
import { Card, Button } from 'antd';
import { 
  BankOutlined,
  HomeOutlined,
  TeamOutlined,
  ReadOutlined,
  FileProtectOutlined,
  AuditOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const SERVICES = [
  {
    id: 1,
    title: "Luật Hôn nhân & Gia đình",
    desc: "Tư vấn ly hôn, tranh chấp tài sản, giành quyền nuôi con và các thủ tục nhận nuôi con nuôi.",
    icon: <TeamOutlined />,
    color: "text-pink-500",
    bg: "bg-pink-50"
  },
  {
    id: 2,
    title: "Luật Đất đai & Nhà ở",
    desc: "Giải quyết tranh chấp đất đai, tư vấn thủ tục sang tên sổ đỏ, thừa kế và quy hoạch.",
    icon: <HomeOutlined />,
    color: "text-green-600",
    bg: "bg-green-50"
  },
  {
    id: 3,
    title: "Luật Doanh nghiệp",
    desc: "Tư vấn thành lập công ty, sáp nhập, giải thể và soạn thảo điều lệ doanh nghiệp.",
    icon: <BankOutlined />,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    id: 4,
    title: "Tranh tụng Hình sự",
    desc: "Bào chữa cho bị can, bị cáo. Bảo vệ quyền lợi hợp pháp cho người bị hại tại tòa án.",
    icon: <FileProtectOutlined />,
    color: "text-red-600",
    bg: "bg-red-50"
  },
  {
    id: 5,
    title: "Tư vấn Dân sự",
    desc: "Đại diện giải quyết các tranh chấp dân sự, đòi nợ, bồi thường thiệt hại ngoài hợp đồng.",
    icon: <ReadOutlined />,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    id: 6,
    title: "Soạn thảo Hợp đồng",
    desc: "Rà soát pháp lý, soạn thảo các loại hợp đồng thương mại, lao động, mua bán đảm bảo chặt chẽ.",
    icon: <AuditOutlined />,
    color: "text-orange-600",
    bg: "bg-orange-50"
  }
];

const ServiceSection = () => {
  return (
    <section id="services" className="py-24 bg-gray-50 px-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wide">
            Lĩnh vực hoạt động
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dịch vụ pháp lý chuyên nghiệp
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Chúng tôi cung cấp giải pháp pháp lý toàn diện trên nhiều lĩnh vực, đảm bảo quyền lợi tốt nhất cho thân chủ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((item) => (
            <Card 
              key={item.id}
              className="hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-2xl overflow-hidden group h-full"
              styles={{ body: { padding: '32px' } }}
            >
              <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-6 ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{item.icon}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                {item.title}
              </h3>
              
              <p className="text-gray-500 mb-6 leading-relaxed line-clamp-3">
                {item.desc}
              </p>

              <a href="#" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors gap-2">
                Xem chi tiết <ArrowRightOutlined />
              </a>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">Bạn có vấn đề pháp lý khác?</p>
            <Button 
                size="large" 
                className="h-12 px-8 bg-blue-900 hover:!bg-blue-800 text-white font-bold rounded-lg"
            >
                Liên hệ tư vấn miễn phí ngay
            </Button>
        </div>

      </div>
    </section>
  );
};

export default ServiceSection;