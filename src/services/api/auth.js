import axiosInstance from "../axiosClient";

const login = userData => axiosInstance.post('/users/login', userData)
const register = userData => axiosInstance.post('/users', userData)

export default {
    login,
    register
}