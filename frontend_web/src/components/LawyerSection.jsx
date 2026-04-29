import React, { useEffect, useState } from "react";
import { Card, Button, Tag, Rate, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";
import {
  PhoneOutlined,
  MailOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import userService from "../services/userService";

const LawyerSection = () => {
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listLawyer = async () => {
      try {
        const res = await userService.lawyers();
        if (res && res.lawyers) {
          setLawyers(res.lawyers);
        } else if (Array.isArray(res)) {
          setLawyers(res);
        }
      } catch (error) {
        console.log("Lỗi tải danh sách luật sư", error);
      } finally {
        setLoading(false);
      }
    };
    listLawyer();
  }, []);

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
  };

  return (
    <section id="lawyers" className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wide">
            Đội ngũ chuyên gia
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Gặp gỡ Luật sư của chúng tôi
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Đội ngũ luật sư giàu kinh nghiệm, tận tâm và sẵn sàng chiến đấu vì
            quyền lợi hợp pháp của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading && [1, 2, 3, 4].map((i) => <Card key={i} loading={true} />)}

          {!loading &&
            lawyers.map((lawyer) => {
              const avatarSrc = lawyer.user_avatar
                ? `http://127.0.0.1:8000${lawyer.user_avatar}`
                : getDefaultAvatar(lawyer.user_fullName);
              return (
                <Card
                  key={lawyer.user_id}
                  hoverable
                  className="border-none shadow-md hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group"
                  cover={
                    <div className="h-64 overflow-hidden relative">
                      <img
                        alt={lawyer.user_fullName}
                        src={avatarSrc}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getDefaultAvatar(lawyer.user_fullName);
                        }}
                      />

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                        <Button
                          shape="circle"
                          icon={<PhoneOutlined />}
                          className="bg-white text-blue-600 border-none"
                        />
                        <Button
                          shape="circle"
                          icon={<MailOutlined />}
                          className="bg-white text-blue-600 border-none"
                        />
                      </div>
                    </div>
                  }
                >
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {lawyer.user_fullName}
                    </h3>

                    <p className="text-blue-600 text-sm font-medium mb-3">
                      {lawyer.staff_profile?.experience_years
                        ? `${lawyer.staff_profile.experience_years} năm kinh nghiệm`
                        : "Luật sư tư vấn"}
                    </p>

                    <div className="mb-4">
                      <Rate
                        disabled
                        defaultValue={5}
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {lawyer.staff_profile?.specialization && (
                        <Tag
                          color="blue"
                          className="rounded-full px-3 m-0 border-none bg-blue-50 text-blue-700 font-medium"
                        >
                          {lawyer.staff_profile.specialization}
                        </Tag>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">
                      {lawyer.staff_profile?.bio ||
                        "Luật sư chuyên nghiệp, tận tâm với khách hàng."}
                    </p>

                    <Button
                      type="default"
                      block
                      className="rounded-lg font-bold border-blue-600 text-blue-600 hover:!bg-blue-600 hover:!text-white transition-all"
                      onClick={() =>
                        navigate(`/lawyer-detail/${lawyer.user_id}`)
                      }
                    >
                      Đặt lịch hẹn
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>

        <div className="mt-12 text-center">
          <Button
            type="link"
            className="text-lg font-bold flex items-center gap-2 mx-auto text-gray-700 hover:text-blue-600"
          >
            Xem toàn bộ danh sách <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LawyerSection;