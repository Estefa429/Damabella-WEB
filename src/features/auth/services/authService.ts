import { API } from '@/services/ApiConfigure';

export const generateRecoveryCode = async (email: string): Promise<void> => {
  try {
    await API.post('/auth/request-otp/', { email });
  } catch (error: any) {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || 'Error al solicitar el código de recuperación';

    if (status === 404) {
      throw new Error('No existe una cuenta con este correo.');
    }

    if (status === 400) {
      throw new Error(detail);
    }

    throw new Error(detail);
  }
};

export const verifyRecoveryCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const response = await API.post('/auth/validate-otp/', { email, code });
    return response.data?.valid !== false;
  } catch (error: any) {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || 'Error al verificar el código';

    if (status === 404 || status === 400) {
      return false;
    }

    throw new Error(detail);
  }
};

export const updateUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await API.post('/auth/reset-password/', {
      email,
      password: newPassword,
    });

    return response.data?.success !== false;
  } catch (error: any) {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || 'Error al actualizar la contraseña';

    if (status === 404 || status === 400) {
      throw new Error(detail);
    }

    throw new Error(detail);
  }
};







