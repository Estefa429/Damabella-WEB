import { API } from "@/services/ApiConfigure";

export interface Clients {
    id_client : number;
    name : string;
    type_doc : number;
    doc : string;
    phone : string;
    address : string;
    email : string;
    state : boolean;
    city : string;
}

export type CreateClientsDTO = Omit<Clients, 'id_client' | 'state'>
export type UpdateClientsDTO = Partial<Omit<Clients, 'id_client' | 'state'>>

export const getAllClients = async (): Promise<Clients[] | null> => {
    try{
        const response = await API.get('/clients/get_clients/')
        if (response.data.success === true) {
            return response.data.results
        }else{
            console.warn("error al traer clientes")
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const getClientsById = async (id_client : number): Promise<Clients | null> => {
    try{
        const response = await API.get(`/clients/${id_client}/get_clients_by_id/`)
        if (response.data.success === true) {
            return response.data.results
        }else{
            console.warn(response.data.message)
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const createClients = async (data: CreateClientsDTO): Promise<Clients | null> =>{
    try{
        const response = await API.post('/clients/create_clients/',data)
        if (response.data.success === true) {
            return response.data.object
        }else{
            console.warn("error al crear un cliente")
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const deleteClients = async (id_client : number): Promise<boolean> =>{
    try{
        const response = await API.delete(`/clients/${id_client}/delete_clients/`)
        if (response.data.success === true) {
            return true
        }else{
            console.warn(response.data.message)
            return false
        }
    }catch(error:any){
        return false
    }
}

export const updateClients = async(
    id_client : number,
     data : UpdateClientsDTO
    ): Promise<Clients | null> => {
        try{
            const response = await API.put(`/clients/${id_client}/update_clients/`, data)
            if (response.data.success === true) {
                return response.data.client
            }else{
                console.warn(response.data.message)
                return null
            }
        }catch(error:any){
            console.error(error)
            return null
        }
    }

export const searchClients = async(query : Partial<Clients>): Promise<Clients[] | null> => {
    try{
        const response = await API.get('/clients/search_clients/',{
            params : query
        })
        if (response.data.success === true) {
            return response.data.results
        }else{
            console.warn("error al encontrar clientes")
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const StateClient = async(
    id_client : number,
    state : boolean
): Promise<Clients | null> => {
    try{
        const response = await API.patch(`/clients/${id_client}/patch_state/`,{
            state : state
        })
        if (response.data.success === true) {
            return response.data.object
        }else{
            console.warn(response.data.message)
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}