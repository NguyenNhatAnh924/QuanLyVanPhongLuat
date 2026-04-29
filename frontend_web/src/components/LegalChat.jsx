import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  Button,
  Input,
  List,
  Avatar,
  Tag,
  Spin,
  Tooltip,
  Card,
  Typography,
} from "antd";
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const LegalChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Xin chào! Tôi là trợ lý ảo của văn phòng luật. Tôi có thể giúp gì cho bạn về Luật Lao Động?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const getChatSessionId = () => {
    let sId = localStorage.getItem("chat_session_id");
    if (!sId) {
      sId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("chat_session_id", sId);
    }
    return sId;
  };

  const handleCreateCaseQuickly = async (caseData) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Bạn cần đăng nhập để chúng tôi có thể lưu trữ hồ sơ và liên hệ lại nhé!",
        },
      ]);
      return;
    }
    const sKey = getChatSessionId();
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/cases/",
        {
          title: caseData.title || "Yêu cầu từ Chatbot",
          description: caseData.description,
          opposing_party_name: caseData.opp_name || "Chưa rõ",
          opposing_party_address: caseData.opp_addr || "Chưa rõ",
          session_key: sKey,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "✅ Tuyệt vời! Hồ sơ của bạn đã được tạo thành công. Luật sư sẽ xem xét và phản hồi bạn sớm nhất.",
        },
      ]);
    } catch (error) {
      console.error("Lỗi tạo hồ sơ:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    const sKey = getChatSessionId();
    const token = localStorage.getItem("accessToken");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/chat/",
        { prompt: input, session_key: sKey },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        },
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.data.answer,
          sources: response.data.sources,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Hệ thống đang bận..." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        const token = localStorage.getItem("access_token");
        try {
          const res = await axios.get(
            "http://127.0.0.1:8000/api/chat/history/",
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              withCredentials: true,
            },
          );
          const history = res.data.map((m) => ({
            role: m.role === "assistant" ? "bot" : "user",
            text: m.content,
          }));
          if (history.length > 0) {
            setMessages(history);
          }
        } catch (e) {
          console.log("Chưa có lịch sử cũ.");
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  return (
    <>
      <div style={styles.floatingButton}>
        <Tooltip title="Trợ giúp pháp lý">
          <Button
            type="primary"
            shape="circle"
            icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
            size="large"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: 60,
              height: 60,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          />
        </Tooltip>
      </div>

      {isOpen && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <CustomerServiceOutlined
                style={{ marginRight: 8, color: "#1890ff" }}
              />
              <span>Tư vấn Luật AI </span>
            </div>
          }
          extra={
            <CloseOutlined
              onClick={() => setIsOpen(false)}
              style={{ cursor: "pointer" }}
            />
          }
          style={styles.chatPopup}
          bodyStyle={{
            display: "flex",
            flexDirection: "column",
            height: "400px",
            padding: 0,
          }}
        >
          <div style={styles.messageList}>
            <List
              dataSource={messages}
              renderItem={(msg) => (
                <List.Item
                  style={{
                    border: "none",
                    padding: "12px 16px",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        msg.role === "user" ? "row-reverse" : "row",
                      maxWidth: "90%",
                      alignItems: "flex-start",
                    }}
                  >
                    <Avatar
                      icon={
                        msg.role === "user" ? (
                          <UserOutlined />
                        ) : (
                          <CustomerServiceOutlined />
                        )
                      }
                      style={{
                        backgroundColor:
                          msg.role === "user" ? "#1890ff" : "#87d068",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        margin:
                          msg.role === "user" ? "0 10px 0 0" : "0 0 0 10px",
                        padding: "8px 12px",
                        backgroundColor:
                          msg.role === "user" ? "#e6f7ff" : "#f5f5f5",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {msg.role === "bot" && msg.suggested_case && (
                        <Button
                          type="primary"
                          danger
                          ghost
                          size="small"
                          onClick={() =>
                            handleCreateCaseQuickly(msg.suggested_case)
                          }
                          style={{ marginTop: 10, borderRadius: "4px" }}
                        >
                          Gửi yêu cầu tư vấn này cho Luật sư ngay
                        </Button>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: "1px solid #ddd",
                          }}
                        >
                          <Text type="secondary" size="small">
                            <InfoCircleOutlined /> Nguồn tra cứu:
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            {msg.sources.map((s, i) => (
                              <Tag
                                color="blue"
                                key={i}
                                style={{ marginBottom: 4 }}
                              >
                                {s}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
            {isLoading && (
              <div style={{ padding: "10px 20px" }}>
                <Spin size="small" tip="Đang tra cứu luật..." />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
            <Input.Search
              placeholder="Hỏi về nghỉ phép, tiền lương..."
              enterButton={<SendOutlined />}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSearch={handleSendMessage}
              loading={isLoading}
            />
          </div>
        </Card>
      )}
    </>
  );
};

const styles = {
  floatingButton: {
    position: "fixed",
    bottom: 30,
    right: 30,
    zIndex: 1000,
  },
  chatPopup: {
    position: "fixed",
    bottom: 100,
    right: 30,
    width: 400,
    zIndex: 1000,
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    backgroundColor: "#fff",
    paddingBottom: "10px",
  },
};

export default LegalChatPopup;