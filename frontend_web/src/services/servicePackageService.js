import axiosClient from "../api/axiosClient";

const servicePackageService = {
    async list_service() {
        const res = await axiosClient.get("services/");
        return res.data;
    },

    async create_service(data) {
        const res = await axiosClient.post("services/", data);
        return res.data;
    },

    async update_service(id, data) {
        const res = await axiosClient.put(`services/${id}/`, data);
        return res.data;
    },

    async delete_service(id) {
        const res = await axiosClient.delete(`services/${id}/`);
        return res.data;
    },

    async get_service_detail(id) {
        const res = await axiosClient.get(`services/${id}/`);
        return res.data;
    }
};

export default servicePackageService;