import axiosClient from "../api/axiosClient";

const dashboardService = {
    async getOverview() {
        const res = await axiosClient.get("/dashboard/overview/");
        return res.data;
    },

    async getCases() {
        const res = await axiosClient.get("/dashboard/cases/");
        return res.data;
    },

    async getCasesByStatus() {
        const res = await axiosClient.get("/dashboard/cases_by_status/");
        return res.data;
    },

    async getServiceUsageStats() {
        const res = await axiosClient.get("/dashboard/service_usage_stats/");
        return res.data;
    },

    async getContracts() {
        const res = await axiosClient.get("/dashboard/contracts/");
        return res.data;
    },

    async getContractsByStatus() {
        const res = await axiosClient.get("/dashboard/contracts_by_status/");
        return res.data;
    },

    async getCasesByMonth() {
        const res = await axiosClient.get("/dashboard/cases_by_month/");
        return res.data;
    },

    async getContractsByMonth() {
        const res = await axiosClient.get("/dashboard/contracts_by_month/");
        return res.data;
    },

    async getStaffList() {
        const res = await axiosClient.get("/dashboard/staff/");
        return res.data;
    },

    async getStaffPerformance() {
        const res = await axiosClient.get("/dashboard/staff_performance/");
        return res.data;
    },

    async getCaseProgress() {
        const res = await axiosClient.get("/dashboard/case_progress/");
        return res.data;
    },

    async getRevenueByMonth() {
        const res = await axiosClient.get("/dashboard/revenue_by_month/");
        return res.data;
    }
};

export default dashboardService;