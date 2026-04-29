
import axiosClient from "../api/axiosClient";

const legalCaseService = {
    async create (values) {
        const res = await axiosClient.post('cases/',values);
        return res.data;
    },

    async update(id, values) {
        const res = await axiosClient.patch(`cases/${id}/`, values);
        return res.data;
    },

    async updateStatus (id, status){
        let res;
        if ( status === "CONFIRMED"){
            res = await axiosClient.patch(`cases/${id}/confirm_case/`)
        }else if(status === "REJECTED"){
            res = await axiosClient.patch(`cases/${id}/reject_case/`);
        }else{
            res = await axiosClient.patch(`cases/${id}/accept_case/`);
        }
        return res.data;
    },

    async list_legaCase () {
        const res = await axiosClient.get('cases/');
        return res.data;
    },

    async assignStaff(case_id, lawyer_id, assitance_id){
        const res = await axiosClient.patch(`cases/${case_id}/`,{
            assigned_lawyer: lawyer_id,
            assistant: assitance_id,
        });
        return res.data;
    },
    async closeCase(id) {
        const res = await axiosClient.patch(`cases/${id}/close_case/`);
        return res.data;
    },

    async verifyGoalStatus(id, goalStatus) {
        const res = await axiosClient.patch(`cases/${id}/verify_goal_status/`, {
            goal_achievement_status: goalStatus
        });
        return res.data;
    },

    async listPendingVerification() {
        const res = await axiosClient.get('cases/', {
            params: {
                status: 'LIQUIDATED',
                goal_achievement_status: 0
            }
        });
        return res.data;
    },

    async globalIdentityCheck(name) {
        const res = await axiosClient.get('cases/global-identity-check/', {
            params: { name: name }
        });
        return res.data;
    },
};

export default legalCaseService;