import { API } from "@/services/ApiConfigure";

export interface State {
  id_state:   number;
  name_state: string;
}

export const getAllStates = async (): Promise<State[] | null> => {
  try {
    const response = await API.get('/states/get_states/');
    if (response.data.success === true) return response.data.results;
    console.warn(response.data.message);
    return null;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};