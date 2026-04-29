import axiosClient from "../api/axiosClient";

const feedbackService = {
    getAllFeedbacks() {
        return axiosClient.get("feedbacks/");
    },

    getFeedbackById(id) {
        return axiosClient.get(`feedbacks/${id}/`);
    },

    createFeedback(value) {
        return axiosClient.post("feedbacks/", value);
    },

    updateFeedback(id, value) {
        return axiosClient.patch(`feedbacks/${id}/`, value);
    },

    deleteFeedback(id) {
        return axiosClient.delete(`feedbacks/${id}/`);
    }
};

export default feedbackService;