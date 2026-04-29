import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Select,
  Space,
  Card,
  Typography,
  message,
  Input,
  Badge,
  Row,
  Col,
  Tooltip,
  Avatar,
} from "antd";
import {
  CheckCircleOutlined,
  SearchOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import taskService from "../../services/taskService";

const { Text, Title } = Typography;

const AssistantTaskCenter = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskService.list_task();
      setTasks(res || []);
    } catch (error) {
      message.error("Không thể tải danh sách nhiệm vụ");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  console.log(tasks);
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      message.success("Đã cập nhật trạng thái");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
    } catch (error) {
      message.error("Lỗi khi cập nhật");
      console.log(error);
    }
  };

  const getColumns = (isCompletedTable) => [
    {
      title: "Công việc",
      key: "task_info",
      render: (_, record) => (
        <div className="flex flex-col">
          <Text
            strong
            className={isCompletedTable ? "text-gray-400" : "text-teal-700"}
          >
            {record.title}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            Vụ: {record.legal_case_title}
          </Text>
          {!isCompletedTable && record.priority === "URGENT" && (
            <Tag color="red" size="small" className="w-fit mt-1">
              GẤP
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Người giao",
      dataIndex: "creator",
      key: "creator",
      align: "center",
      render: (creator) => (
        <Space orientation="vertical" size={0} className="items-center">
          <Tooltip title={`Luật sư: ${creator?.user_fullName || "N/A"}`}>
            <Avatar
              size="small"
              src={creator?.user_avatar}
              style={{ backgroundColor: "#87d068" }}
            >
              {creator?.user_fullName?.charAt(0)}
            </Avatar>
          </Tooltip>
          <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
            {creator?.user_fullName}{" "}
          </Text>
        </Space>
      ),
    },
    {
      title: isCompletedTable ? "Hoàn thành" : "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      width: 120,
      render: (deadline) => {
        const isOverdue = !isCompletedTable && new Date(deadline) < new Date();
        return (
          <div className="flex flex-col">
            <Text
              className={isOverdue ? "text-red-500 font-bold" : "text-gray-600"}
              style={{ fontSize: "12px" }}
            >
              {new Date(deadline).toLocaleDateString("vi-VN")}
            </Text>
            <Text type="secondary" style={{ fontSize: "10px" }}>
              {new Date(deadline).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </div>
        );
      },
    },
    {
      title: "TT",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => (
        <Select
          value={status}
          size="small"
          onChange={(val) => handleStatusChange(record.id, val)}
          className="w-full"
          variant="borderless"
          styles={{
            popup: {
              minWidth: "120px"
            },
          }}
        >
          <Select.Option value="TODO">Cần làm</Select.Option>
          <Select.Option value="IN_PROGRESS">Đang làm</Select.Option>
          <Select.Option value="DONE">Xong</Select.Option>
        </Select>
      ),
    },
  ];

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchText.toLowerCase()),
  );

  const pendingTasks = filteredTasks
    .filter((t) => t.status !== "DONE")
    .sort((a, b) => {
      if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

  const completedTasks = filteredTasks
    .filter((t) => t.status === "DONE")
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <Title level={4} className="!m-0 text-teal-800">
          📬 Trung tâm Điều phối Nhiệm vụ
        </Title>
        <Input
          placeholder="Tìm tên công việc..."
          prefix={<SearchOutlined />}
          className="w-80"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={13}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined className="text-orange-500" />
                <span>Nhiệm vụ cần xử lý</span>
                <Badge count={pendingTasks.length} showZero color="#faad14" />
              </Space>
            }
            className="shadow-sm rounded-xl border-t-4 border-t-orange-400"
          >
            <Table
              columns={getColumns(false)}
              dataSource={pendingTasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8, size: "small" }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <Card
            title={
              <Space>
                <HistoryOutlined className="text-green-500" />
                <span>Lịch sử hoàn thành</span>
                <Badge count={completedTasks.length} showZero color="#52c41a" />
              </Space>
            }
            className="shadow-sm rounded-xl border-t-4 border-t-green-400"
          >
            <Table
              columns={getColumns(true)}
              dataSource={completedTasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8, size: "small" }}
              size="small"
              className="completed-tasks-table"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AssistantTaskCenter;
