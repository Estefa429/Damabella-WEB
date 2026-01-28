/**
 * Utilidades para sincronizar datos entre el panel administrativo y la página del cliente
 */

/**
 * Fuerza la sincronización de productos y categorías
 * Dispara un evento de almacenamiento para que todas las tabs se actualicen
 */
export const forceSyncProducts = () => {
  const event = new StorageEvent('storage', {
    key: 'damabella_productos',
    newValue: localStorage.getItem('damabella_productos'),
    oldValue: null,
    storageArea: localStorage,
    url: window.location.href
  });
  window.dispatchEvent(event);
};

/**
 * Fuerza la sincronización de categorías
 */
export const forceSyncCategories = () => {
  const event = new StorageEvent('storage', {
    key: 'damabella_categorias',
    newValue: localStorage.getItem('damabella_categorias'),
    oldValue: null,
    storageArea: localStorage,
    url: window.location.href
  });
  window.dispatchEvent(event);
};

/**
 * Fuerza ambas sincronizaciones
 */
export const forceSync = () => {
  forceSyncProducts();
  forceSyncCategories();
};

/**
 * Obtiene todas las categorías del localStorage
 */
export const getAllCategories = () => {
  try {
    const stored = localStorage.getItem('damabella_categorias');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error leyendo categorías:', error);
    return [];
  }
};

/**
 * Obtiene todos los productos del localStorage
 */
export const getAllProducts = () => {
  try {
    const stored = localStorage.getItem('damabella_productos');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error leyendo productos:', error);
    return [];
  }
};

/**
 * Obtiene productos de una categoría específica
 */
export const getProductsByCategory = (categoryName: string) => {
  const products = getAllProducts();
  return products.filter((p: any) => p.categoria === categoryName && p.activo === true);
};
