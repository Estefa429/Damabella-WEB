import { API } from "@/services/ApiConfigure";

export interface Categories {
    id_category : number;
    name : string;
    description : string;
    is_active : boolean;
}

export interface CategoryProductsCount {
    id_category: number;
    count: number;
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
            // El backend puede retornar la categoría en diferentes formatos
            const categoria = response.data.categoria || response.data.category || response.data.object || response.data.results;
            if (categoria) {
                return categoria;
            }
            // Si no retorna la categoría, traerla por separado
            return await getCategoriesById(id_category);
        }else{
            console.warn(response.data.message || response.data.error);
            return null
        }
    }catch(error:any){
        console.error(error)
        return null
    }
}

export const getProductsByCategory = async (id_category: number): Promise<number | null> => {
    try {
        const response = await API.get(`/categories/${id_category}/get_products_by_category/`);
        if (response.data.success === true) {
            // El servidor retorna el count de productos
            const count = response.data.count || response.data.results?.length || 0;
            console.log(`📦 getProductsByCategory - Categoría ${id_category}: ${count} productos`);
            return count;
        } else {
            console.warn(response.data.message || response.data.error);
            return 0;
        }
    } catch (error: any) {
        console.error('Error obteniendo productos por categoría:', error);
        return 0;
    }
}