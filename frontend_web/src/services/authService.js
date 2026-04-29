import axiosClient from "../api/axiosClient";

const authService = {
    async login(user_name, password) {
        const res = await axiosClient.post('users/login/', {
            user_name,
            password,
        });

        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('accessToken', res.data.token.access);
        localStorage.setItem('refreshToken', res.data.token.refresh);

        return res.data;
    },

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    async register(values) {
        const res = await axiosClient.post('users/register/',
            {
                user_fullName: values.user_fullName,
                user_name: values.user_name,
                user_email: values.user_email,
                user_phone: values.user_phone,
                user_address: values.user_address,
                password: values.password,
                repassword: values.repassword,
            }
        );
        return res.data;
    },

    async islogin(){
        const res = await axiosClient.get('users/is_login/')
        return res.data.user|| res.data;
    }
};

export default authService;