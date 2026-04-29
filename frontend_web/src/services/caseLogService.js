
import axiosClient from "../api/axiosClient";

const caseLogService = {
    async createLog (value){
        const res = await axiosClient.post("logs/", value);
        return res.data;
    },
};

export default caseLogService;