import { API } from "@/services/ApiConfigure";

export interface Categories {
    id_category : number;
    name : string;
    description : string;
    is_active : boolean;
} 
export const getAllCategories = async (): Promise<Categories[] | null> => {
    try{
        const response = await API.get('/categories/get_categories/');
        if (response.data.success === true) {
            return response.data.results;
        } else{
            console.warn(response.data.error);
            return null
        }
    } catch (error:any){
        console.error(error)
        return null
    }
}

export const getCategoriesById = async(id_category:number): Promise<Categories | null> => {
    try{
        const response = await API.get(`/categories/${id_category}/get_categories_by_id/`)
        if (response.data.success === true) {
            return response.data.results;
        } else{
            console.warn(response.data.message || response.data.error)
            return null
        }
    } catch(error:any){
        console.error(error)
        return null
    }
}

export const createCategories = async (data: Pick<Categories, 'name' | 'description'>): Promise<Categories | null> =>{
    try{
        const response = await API.post('/categories/create_categories/', data);
        if (response.data.success === true) {
            return response.data.object 
        }else{
            console.warn(response.data.message || response.data.error)
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const deleteCategories = async (id_category: number): Promise<boolean> =>{
    try{
        const response = await API.delete(`categories/${id_category}/delete_categories/`);
        if (response.data.success === true) {
            console.log(response.data.results);
            return true;
        }else{
            console.warn(response.data.message || response.data.error);
            return false
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const updateCategories = async(
    id_category:number,
    data: Pick<Categories, 'name' | 'description'>
): Promise<Categories | null> => {
    try{
        const response = await API.put(`/categories/${id_category}/update_categories/`, data);
        if (response.data.success === true) {
            return response.data.category
        }else{
            console.warn(response.data.message || response.data.error)
            return null
        }
    } catch(error:any){
        console.error(error)
        return null
    }
}

export const searchCategories = async (
    query: Partial<Categories>
): Promise<Categories[] | null> => {
    try{
        const response = await API.get('/categories/search_categories/',{
            params: query, 
    });
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

export const patchState = async (
    id_category:number,
    is_active:boolean
): Promise<Categories | null> => {
    try{
        const response = await API.patch(`/categories/${id_category}/change_state/`, {
            is_active: is_active
        });
        if (response.data.success === true) {
            return response.data.categoria
        }else{
            console.warn(response.data.message || response.data.error);
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}