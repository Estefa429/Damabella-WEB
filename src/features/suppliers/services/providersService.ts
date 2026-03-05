import { API } from "@/services/ApiConfigure";

export interface TypesDocs {
    id_doc: number;
    name: string;
}

export interface Providers {
    id_provider: number;
    name: string;
    number_doc: string;
    contact_name: string;
    phone: string;
    address: string;
    email: string;
    is_active: boolean;
    published: boolean;
    created_at: string;
    updated_at: string;
    type_doc: number;
}

export type createProviderDTO = Omit<Providers, 'id_provider' | 'created_at' | 'updated_at'>
export type updateProviderDTO = Partial<Omit<Providers, 'id_provider' | 'created_at' | 'updated_at'>>

export const getAllProviders = async (): Promise<Providers[] | null> => {
    try{
        const response = await API.get('/providers/get_providers/');
        if (response.data.success === true) {
            return response.data.results
        }else{
            console.warn("error al traer proveedores")
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const getProvidersById = async (id_provider:number): Promise<Providers | null> =>{
    try{
        const response = await API.get(`/providers/${id_provider}/get_providers_by_id/`)
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

export const createProviders = async (data: createProviderDTO): Promise<Providers | null> => {
    try{
        const response = await API.post('/providers/create_providers/', data)
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

export const deleteProviders = async (id_provider:number): Promise<boolean> =>{
    try{
        const response = await API.delete(`/providers/${id_provider}/delete_providers/`)
        if (response.data.success === true) {
            // console.log(response.data.results)
            return true
        }else{
            console.warn(response.data.message)
            return false
        }
    }catch(error:any){
        console.error(error)
        return false
    }
}

export const updateProviders = async (
    id_provider: number,
    data: updateProviderDTO
): Promise<Providers | null> => {
    try{
        const response = await API.put(`/providers/${id_provider}/update_providers/`, data)
        if (response.data.success === true) {
            return response.data.provider
        }else{
            console.warn(response.data.message)
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const searchProviders = async (
    query: Partial<Providers>
): Promise<Providers[] | null> => {
    try{
        const response = await API.get('/providers/search_providers',{
            params: query
        })
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

export const patchState = async (
    id_provider: number,
    is_active:boolean
): Promise<Providers | null> =>{
    try{
        const response = await API.patch(`/providers/${id_provider}/patch_state/`, {
            is_active : is_active
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

export const getAllTypesDocs = async (): Promise<TypesDocs[] | null> =>{
    try{
        const response = await API.get('/typesDocs/get_types_docs/')
        if (response.data.success === true) {
            return response.data.results
        }else{
            console.warn(response.data.error)
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}