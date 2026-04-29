import axiosClient from "../api/axiosClient";

const appoimentService = {
    async create (formData) {
        const res = await axiosClient.post("appointments/", formData);
        return res.data;
    },

    async get_appiments () {
        const res = await axiosClient.get(`appointments/`);
        return res.data;
    },

    async camcel_appoiment(appoiment_id){
        const res = await axiosClient.patch(`appointments/${appoiment_id}/`,{
            status: "CANCELLED"
        });
        return res.data;
    },

    async confirm_appoiment(appoiment_id){
        const res = await axiosClient.post(`appointments/${appoiment_id}/respond/`,{
            status: "ACCEPTED"
        });
        return res.data;
    },
    
    async declined_appoiment(appoiment_id){
        const res = await axiosClient.post(`appointments/${appoiment_id}/respond/`,{
            status: "DECLINED"
        });
        return res.data;
    },

    async update_appointment (formData, appointment_id){
        const res = await axiosClient.patch(`appointments/${appointment_id}/`, formData, {
            status: "PENDING"
        });
        return res.data;
    },
    async updateAttendeeStatus(appointment_id, target_user_id, newStatus) {
        const res = await axiosClient.post(`appointments/${appointment_id}/update-attendee-status/`, {
            user_id: target_user_id,
            status: newStatus
        });
        return res.data;
    },

};
export default appoimentService;