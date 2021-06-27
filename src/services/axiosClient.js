import axios from 'axios'

let axiosInstance

if (typeof window !== 'undefined') {
    
    axiosInstance = axios.create({
        baseURL: process.env.DARTILES_API,
    })

    axiosInstance.interceptors.request.use(
        request => {
            request.headers.Authorization = `Bearer ${window.localStorage.getItem('token')}`
            return request
        }
    )
    
    axiosInstance.interceptors.response.use(
        response => ({ data: response.data }),
        error => ({ error: error.response.data })
    )
}


export default axiosInstance