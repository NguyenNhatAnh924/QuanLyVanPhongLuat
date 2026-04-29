import axiosClient from "../api/axiosClient";

const taskService = {
    async list_task () {
        const res = await axiosClient.get("tasks/");
        return res.data;
    },
    async create(payload) {
        const res = await axiosClient.post("tasks/", payload);
        return (await res).data;
    },
    async update(id, payload) {
        const res = await axiosClient.patch(`tasks/${id}/`, payload);
        return res.data;
    },
    async updateTaskStatus(taskId, status) {
        const res = await axiosClient.patch(`tasks/${taskId}/`, { status });
        return res.data;
    }
};
export default taskService;