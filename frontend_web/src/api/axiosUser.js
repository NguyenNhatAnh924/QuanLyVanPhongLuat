import axios from "axios";

const axiosUser = axios.create({
    baseURL : 'http://127.0.0.1:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosUser.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
});

axiosUser.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refreshToken");

        const res = await axios.post(
          "http://127.0.0.1:8000/api/users/refresh/",
          { refresh }
        );

        localStorage.setItem("accessToken", res.data.access);

        originalRequest.headers.Authorization =
          `Bearer ${res.data.access}`;

        return axiosUser(originalRequest);
      } catch (err) {
        console.log(err);
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
export default axiosUser