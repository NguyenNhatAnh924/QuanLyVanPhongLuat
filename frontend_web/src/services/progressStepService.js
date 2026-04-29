import axiosClient from "../api/axiosClient";

const progressStepService = {
    async list_steps(caseId = null) {
        const url = caseId ? `progress-steps/?legal_case=${caseId}` : "progress-steps/";
        const res = await axiosClient.get(url);
        return res.data;
    },

    async create(payload) {
        const res = await axiosClient.post("progress-steps/", payload);
        return res.data;
    },

    async update(id, payload) {
        const res = await axiosClient.patch(`progress-steps/${id}/`, payload);
        return res.data;
    },

    async updateStepStatus(stepId, is_completed) {
        const res = await axiosClient.patch(`progress-steps/${stepId}/`, { is_completed });
        return res.data;
    },

    async delete(id) {
        const res = await axiosClient.delete(`progress-steps/${id}/`);
        return res.data;
    }
};

export default progressStepService;