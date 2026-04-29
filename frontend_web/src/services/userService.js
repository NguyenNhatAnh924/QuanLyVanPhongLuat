import axiosUser from "../api/axiosUser";

const userService = {
    async lawyers() {
        const res = await axiosUser.get('users/lawyers/');
        return res.data.lawyers;
    },

    async assigned_legal() {
        const res = await axiosUser.get('users/assistants/');
        return res.data.assistants;
    },

    async employee() {
        const res = await axiosUser.get('users/staff_list/');
        return res.data.staff_list;
    },

    async getAllUsers() {
        const res = await axiosUser.get('users/');
        return res.data; 
    },

    async getUserById(userId) {
        const res = await axiosUser.get(`users/${userId}/`);
        return res.data;
    },

    async createStaff(staffData) {
        const res = await axiosUser.post('users/create_staff/', staffData);
        return res.data;
    },

    async updateUser(userId, updateData) {
        const res = await axiosUser.patch(`users/${userId}/`, updateData);
        return res.data;
    },

    async toggleUserActiveStatus(userId, isActive) {
        const res = await axiosUser.patch(`users/${userId}/`, {
            is_active: isActive
        });
        return res.data;
    },

    async deleteUser(userId) {
        const res = await axiosUser.delete(`users/${userId}/`);
        return res.data;
    },

    async getCurrentUser() {
        const res = await axiosUser.get('users/is_login/');
        return res.data.user;
    },

    async updateProfile(formData) {
        const res = await axiosUser.patch('users/update_profile/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Rất quan trọng để gửi file
            },
        });
        return res.data;
    }
};

export default userService;