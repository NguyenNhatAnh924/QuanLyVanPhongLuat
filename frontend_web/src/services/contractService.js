import axiosClient from "../api/axiosClient";

const contractService = {
    async createContract(formData) {
        const res = await axiosClient.post("contracts/", formData ,{
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        const legal_case  = formData.get("legal_case");
        if(!legal_case){
             throw new Error("Không tìm thấy legal_case trong FormData");
        }
        return res.data;
    },

    async contracts() {
        const res = await axiosClient.get('contracts/');
        return res.data;
    },

    async signed_contract (id){
        const res = await axiosClient.patch(`contracts/${id}/`,{
            status: "SIGNED"
        });
        return res.data;
    },

    async request_cancel (id){
        const res = await axiosClient.patch(`contracts/${id}/`,{
            status: "CANCEL_REQUESTED"
        });
        return res.data;
    },

    async cancel (id){
        const res = await axiosClient.patch(`contracts/${id}/`,{
            status: "CANCELLED"
        });
        return res.data;
    }
};

export default contractService;