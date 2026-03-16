import axios from "axios";

export const API = axios.create({
    baseURL : 'http://127.0.0.1:8000/api/',
    headers : {
        'Content-Type': 'application/json'
    }
})

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('damabella_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // Si el token expiró y no hemos reintentado
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            try {
                const refresh = localStorage.getItem('damabella_refresh_token');
                if (!refresh) throw new Error('No refresh token');

                const response = await axios.post('http://127.0.0.1:8000/api/auth/refresh/', {
                    refresh
                });

                const newAccess = response.data.access;
                localStorage.setItem('damabella_access_token', newAccess);
                original.headers.Authorization = `Bearer ${newAccess}`;
                return API(original);

            } catch {
                // Refresh también expiró — cerrar sesión
                localStorage.removeItem('damabella_access_token');
                localStorage.removeItem('damabella_refresh_token');
                localStorage.removeItem('damabella_current_user');
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
)