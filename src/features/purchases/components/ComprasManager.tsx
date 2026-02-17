import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Eye, X, Ban, AlertTriangle } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import ImageUploader from '../../../shared/components/native/image-uploader';
import { ProveedoresManager } from '../../suppliers/components/ProveedoresManager';

const STORAGE_KEY = 'damabella_compras';
const PROVEEDORES_KEY = 'damabella_proveedores';
const PRODUCTOS_KEY = 'damabella_productos';
const CATEGORIAS_KEY = 'damabella_categorias';

const COLOR_MAP = {
  'Negro': '#000000',
  'Blanco': '#FFFFFF',
  'Rojo': '#DC2626',
  'Azul': '#2563EB',
  'Verde': '#16A34A',
  'Rosa': '#EC4899',
  'Gris': '#6B7280',
  'Beige': '#D4A574',
};

interface ItemCompra {
  id: string;
  productoId: string;
  productoNombre: string;
  categoriaId?: string;
  categoriaNombre?: string;
  talla?: string;
  color?: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  subtotal: number;
  imagen?: string;
  referencia?: string;
}

interface Compra {
  id: number;
  numeroCompra: string;
  proveedorId: string;
  proveedorNombre: string;
  fechaCompra: string;
  fechaRegistro: string;
  items: ItemCompra[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'Pendiente' | 'Recibida' | 'Anulada';
  observaciones: string;
  createdAt: string;
}

// 🔧 FUNCIÓN AUXILIAR: Normalizar nombre de producto para búsqueda
const normalizarNombreProducto = (nombre: string): string => {
  return nombre.trim().toLowerCase();
};

// 🆕 FUNCIÓN PARA UNIFICAR PRODUCTOS DUPLICADOS
function unificarProductosDuplicados(productosActuales: any[]): any[] {
  const productosMap = new Map();
  productosActuales.forEach((producto: any) => {
    const nombreNormalizado = normalizarNombreProducto(producto.nombre);
    if (!productosMap.has(nombreNormalizado)) {
      productosMap.set(nombreNormalizado, { base: producto, duplicados: [] });
    } else {
      productosMap.get(nombreNormalizado).duplicados.push(producto);
    }
  });

  const productosUnificados: any[] = [];
  productosMap.forEach((grupo: any) => {
    const { base, duplicados } = grupo;
    let variantesMerged = [...(base.variantes || [])];
    duplicados.forEach((dup: any) => {
      if (dup.variantes && dup.variantes.length > 0) {
        dup.variantes.forEach((varianteDup: any) => {
          const varianteExistente = variantesMerged.find((v: any) => v.talla === varianteDup.talla);
          if (varianteExistente) {
            varianteDup.colores.forEach((colorDup: any) => {
              const colorExistente = varianteExistente.colores.find((c: any) => c.color === colorDup.color);
              if (colorExistente) {
                colorExistente.cantidad += colorDup.cantidad;
              } else {
                varianteExistente.colores.push(colorDup);
              }
            });
          } else {
            variantesMerged.push(varianteDup);
          }
        });
      }
    });

    productosUnificados.push({
      ...base,
      variantes: variantesMerged,
      updatedAt: new Date().toISOString(),
      lastUpdatedFrom: 'Unificación de duplicados'
    });
  });

  return productosUnificados;
}

// 🆕 FUNCIÓN PARA AGREGAR/ACTUALIZAR PRODUCTOS EN EL MÓDULO PRODUCTOS
/**
 * Agrega o actualiza un producto en la lista de productos (localStorage)
 * Búsqueda por NOMBRE NORMALIZADO, no por SKU
 * Si el producto existe (mismo nombre) → suma variantes
 * Si no existe → crea nuevo con SKU único
 * 
 * @param itemCompra - Item de la compra con datos del producto
 * @param productosActuales - Array actual de productos
 * @returns Array actualizado de productos
 */
function agregarOActualizarProducto(
  itemCompra: ItemCompra,
  productosActuales: any[]
): any[] {
  // ✅ VALIDAR categoryId (OBLIGATORIO, NO PUEDE SER VACÍO)
  if (!itemCompra.categoriaId || String(itemCompra.categoriaId).trim() === '') {
    console.error(`❌ [agregarOActualizarProducto] ABORTADO: categoryId faltante o vacío para ${itemCompra.productoNombre}`);
    console.error(`   Recibido:`, {
      categoriaId: itemCompra.categoriaId,
      categoriaNombre: itemCompra.categoriaNombre
    });
    return productosActuales;
  }

  const nombreNormalizado = normalizarNombreProducto(itemCompra.productoNombre);
  
  // 🔍 BUSCAR SI EXISTE POR NOMBRE NORMALIZADO (NO POR SKU)
  const productoExistente = productosActuales.find(
    (p: any) => normalizarNombreProducto(p.nombre) === nombreNormalizado
  );

  if (productoExistente) {
    // ✏️ ACTUALIZAR PRODUCTO EXISTENTE - AGREGAR VARIANTE
    console.log(`✏️ [agregarOActualizarProducto] Producto existente encontrado por nombre: ${productoExistente.nombre}`);
    console.log(`   Reutilizando:`, {
      id: productoExistente.id,
      nombre: productoExistente.nombre,
      SKU: productoExistente.referencia,
      variantesActuales: productoExistente.variantes?.length || 0
    });

    const productosActualizados = productosActuales.map((p: any) => {
      if (normalizarNombreProducto(p.nombre) === nombreNormalizado) {
        // Si no tiene variantes, crear la estructura
        let variantes = p.variantes || [];
        
        // Buscar si existe la talla en variantes
        let varianteTalla = variantes.find((v: any) => v.talla === itemCompra.talla);
        
        if (varianteTalla) {
          // Buscar si existe el color
          let colorItem = varianteTalla.colores.find((c: any) => c.color === itemCompra.color);
          if (colorItem) {
            // Sumar cantidad al color existente
            colorItem.cantidad += itemCompra.cantidad || 0;
            console.log(`   ➕ Color existente actualizado: ${itemCompra.color} += ${itemCompra.cantidad}`);
          } else {
            // Agregar nuevo color
            varianteTalla.colores.push({
              color: itemCompra.color,
              cantidad: itemCompra.cantidad || 0
            });
            console.log(`   ➕ Nuevo color agregado: ${itemCompra.color} = ${itemCompra.cantidad}`);
          }
        } else {
          // Agregar nueva talla con color
          variantes.push({
            talla: itemCompra.talla,
            colores: itemCompra.color ? [
              {
                color: itemCompra.color,
                cantidad: itemCompra.cantidad || 0
              }
            ] : []
          });
          console.log(`   ➕ Nueva talla agregada: ${itemCompra.talla}`);
        }

        // 🔧 MERGE: Mantener datos existentes, solo actualizar si vienen definidos en la compra
        // 🔒 CRÍTICO: La categoría SIEMPRE debe preservarse o asignarse si está en la compra
        const productoActualizado = {
          ...p,  // Primero mantener TODO el producto existente
          variantes,  // Actualizar variantes (cantidad)
          // Solo actualizar precio si viene definido y es diferente
          precioCompra: itemCompra.precioCompra && itemCompra.precioCompra > 0 ? itemCompra.precioCompra : p.precioCompra,
          precioVenta: itemCompra.precioVenta && itemCompra.precioVenta > 0 ? itemCompra.precioVenta : p.precioVenta,
          // Solo actualizar imagen si viene definida en la compra
          imagen: itemCompra.imagen && itemCompra.imagen.trim() !== '' ? itemCompra.imagen : p.imagen,
          // 🔒 CATEGORÍA: Usar categoría de la compra si viene definida. Si no, mantener existente. NUNCA quedar sin categoría.
          categoryId: (itemCompra.categoriaId && String(itemCompra.categoriaId).trim() !== '') 
            ? itemCompra.categoriaId 
            : (p.categoryId || itemCompra.categoriaId || ''),
          // 🆕 NOMBRE: Guardar también el nombre de la categoría para ProductosManager
          categoria: itemCompra.categoriaNombre || p.categoria || '',
          updatedAt: new Date().toISOString(),
          lastUpdatedFrom: `Compra - ${p.referencia}`
        };

        // 🔒 VALIDAR que la categoría NO quedó vacía
        if (!productoActualizado.categoryId) {
          console.warn(`⚠️ [agregarOActualizarProducto] ADVERTENCIA: Producto ${p.nombre} quedó sin categoryId después de actualizar`);
        }

        console.log(`✅ [agregarOActualizarProducto] ${p.nombre} actualizado:`);
        console.log(`   Talla: ${itemCompra.talla}, Color: ${itemCompra.color}, Cantidad: ${itemCompra.cantidad}`);
        console.log(`   Precios mantenidos - Compra: $${productoActualizado.precioCompra}, Venta: $${productoActualizado.precioVenta}`);
        console.log(`   Category ID: ${productoActualizado.categoryId}`);
        console.log(`   Imagen mantenida: ${productoActualizado.imagen ? 'Sí' : 'No'}`);

        return productoActualizado;
      }
      return p;
    });

    return productosActualizados;
  } else {
    // 🆕 CREAR NUEVO PRODUCTO (no existe en la lista)
    console.log(`🆕 [agregarOActualizarProducto] Creando nuevo producto: ${itemCompra.productoNombre}`);
    console.log(`   Category ID capturado: "${itemCompra.categoriaId}"`);

    // Generar referencia/SKU única para este producto
    const referencia = itemCompra.referencia || `SKU_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Construir variantes en el formato correcto (esperado por ProductosManager)
    const variantes = [];
    if (itemCompra.talla) {
      const varianteTalla = {
        talla: itemCompra.talla,
        colores: itemCompra.color ? [
          {
            color: itemCompra.color,
            cantidad: Math.round((itemCompra.cantidad || 0) * 100) / 100
          }
        ] : []
      };
      variantes.push(varianteTalla);
    }

    const nuevoProducto = {
      id: Date.now(),
      nombre: itemCompra.productoNombre,
      proveedor: 'Compras',
      categoryId: itemCompra.categoriaId,
      // 🆕 NOMBRE: Guardar también el nombre de la categoría
      categoria: itemCompra.categoriaNombre || '',
      precioVenta: itemCompra.precioVenta || 0,
      precioCompra: itemCompra.precioCompra || 0,
      activo: true,
      variantes: variantes,
      imagen: itemCompra.imagen || '',
      createdAt: new Date().toISOString(),
      // Campos adicionales para trazabilidad
      referencia: referencia,
      createdFromSKU: referencia
    };

    console.log(`✅ [agregarOActualizarProducto] Nuevo producto creado:`);
    console.log(`   Nombre: ${nuevoProducto.nombre}`);
    console.log(`   SKU: ${referencia}`);
    console.log(`   Category ID: ${nuevoProducto.categoryId}`);
    console.log(`   Precio Compra: $${nuevoProducto.precioCompra}`);
    console.log(`   Precio Venta: $${nuevoProducto.precioVenta}`);
    console.log(`   Imagen: ${nuevoProducto.imagen ? '✓ Sí' : '✗ No'}`);
    console.log(`   Variantes: ${JSON.stringify(variantes)}`);

    return [...productosActuales, nuevoProducto];
  }
}

export function ComprasManager() {
  const [compras, setCompras] = useState<Compra[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const comprasCarguadas = JSON.parse(stored);
      // 🔒 Normalizar compras antiguas: convertir "Pendiente" a "Recibida" (Confirmada)
      return comprasCarguadas.map((compra: any) => ({
        ...compra,
        estado: (compra.estado === 'Pendiente') ? 'Recibida' : (compra.estado || 'Recibida')
      }));
    }
    return [];
  });

  const [proveedores, setProveedores] = useState(() => {
    const stored = localStorage.getItem(PROVEEDORES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [productos, setProductos] = useState(() => {
    const stored = localStorage.getItem(PRODUCTOS_KEY);
    if (stored) {
      const productosCarguados = JSON.parse(stored);
      // ✅ Unificar duplicados al cargar
      return unificarProductosDuplicados(productosCarguados);
    }
    // ❌ SIN PRODUCTOS TEMPORALES - Compras debe poder crear productos nuevos
    // Los productos se crean DESDE el módulo de Compras, no existen por defecto
    return [];
  });

  const [tallas, setTallas] = useState(() => {
    const stored = localStorage.getItem('damabella_tallas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((t: any) => t.abbreviation || t.name || t).filter(Boolean);
      } catch {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      }
    }
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  });

  const [coloresDisponibles, setColoresDisponibles] = useState(() => {
    const stored = localStorage.getItem('damabella_colores');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((c: any) => c.name || c.nombre || '').filter(Boolean);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [categorias, setcategorias] = useState(() => {
    const stored = localStorage.getItem(CATEGORIAS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Si son strings (nombres), convertir a objetos
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
          return parsed.map((name: string) => ({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name: name,
            active: true
          }));
        }
        
        // Si son objetos, usar estructura existente
        return parsed.map((cat: any) => ({
          id: cat.id || cat.name?.toLowerCase().replace(/\s+/g, '_') || '',
          name: cat.name || cat.nombre || '',
          active: cat.active !== false
        }));
      } catch (e) {
        console.error('Error cargando categorías:', e);
        return [];
      }
    }
    return [];
  });

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const categoriaSelectRef = React.useRef<HTMLSelectElement>(null);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'warning'>('error');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  const [formData, setFormData] = useState({
    proveedorId: '',
    proveedorNombre: '',
    fechaCompra: new Date().toISOString().split('T')[0],
    iva: '19',
    observaciones: '',
    items: [] as ItemCompra[]
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [itemsError, setItemsError] = useState<string>('');

  // 🔒 Estado para el historial de compras por proveedor
  const [proveedorSeleccionadoHistorial, setProveedorSeleccionadoHistorial] = useState<string>('');

  const [nuevoItem, setNuevoItem] = useState({
    productoId: '',
    productoNombre: '',
    categoriaId: '',
    categoriaNombre: '',
    talla: '',
    color: '',
    cantidad: '',
    precioCompra: '',
    precioVenta: '',
    imagen: '',
    referencia: ''
  });

  // Contador para el número de compra
  const [compraCounter, setCompraCounter] = useState(() => {
    const counter = localStorage.getItem('damabella_compra_counter');
    return counter ? parseInt(counter) : 1;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compras));
  }, [compras]);

  useEffect(() => {
    // Limpiar compras ficticias al cargar
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const comprasData = JSON.parse(stored);
        // Filtrar solo compras que tengan proveedorNombre válido (no ficticios como "Proveedor A", "Proveedor C", etc)
        const comprasReales = comprasData.filter((c: any) => {
          const nombre = String(c.proveedorNombre || '').toLowerCase().trim();
          // Excluir proveedores ficticios
          return !(/^proveedor\s+[a-z]$/i.test(nombre)) && 
                 nombre !== '' &&
                 c.numeroCompra && 
                 c.items && 
                 Array.isArray(c.items);
        });
        
        // Si hay cambios, actualizar localStorage
        if (comprasReales.length !== comprasData.length) {
          console.log(`🧹 [ComprasManager] Limpiando ${comprasData.length - comprasReales.length} compras ficticias`);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(comprasReales));
          setCompras(comprasReales);
        }
      } catch (e) {
        console.error('❌ [ComprasManager] Error limpiando datos ficticios:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('damabella_compra_counter', compraCounter.toString());
  }, [compraCounter]);

  // Sincronizar proveedores desde localStorage
  useEffect(() => {
    const cargarProveedores = () => {
      const stored = localStorage.getItem(PROVEEDORES_KEY);
      if (stored) {
        try {
          const proveedoresActualizados = JSON.parse(stored);
          setProveedores(proveedoresActualizados);
          console.log('✅ [ComprasManager] Proveedores sincronizados:', proveedoresActualizados.map((p: any) => p.nombre));
        } catch (e) {
          console.error('❌ [ComprasManager] Error cargando proveedores:', e);
        }
      }
    };

    // Cargar inmediatamente
    cargarProveedores();

    // Escuchar cambios en otros tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PROVEEDORES_KEY && e.newValue) {
        console.log('📡 [ComprasManager] Proveedores actualizados desde otro tab');
        cargarProveedores();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periódicamente en el mismo tab
    const interval = setInterval(cargarProveedores, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Escuchar creación de proveedor desde el módulo Proveedores y seleccionarlo automáticamente
  useEffect(() => {
    const handleProveedorCreado = (e: any) => {
      try {
        const proveedor = e.detail?.proveedor;
        if (proveedor) {
          // Actualizar lista local por si aún no se sincronizó
          const stored = localStorage.getItem(PROVEEDORES_KEY);
          if (stored) {
            try { setProveedores(JSON.parse(stored)); } catch {}
          }

          // Seleccionar el proveedor recién creado en el formulario de compra
          setFormData(prev => ({ ...prev, proveedorId: String(proveedor.id), proveedorNombre: proveedor.nombre || '' }));
          setProveedorSearchTerm(proveedor.nombre || '');
          setShowProveedorDropdown(false);
          // Si estuvimos mostrando el ProveedoresManager embebido, cerrarlo
          try { setShowProveedorModal(false); } catch {}
        }
      } catch (err) {
        console.warn('Error manejando proveedor:creado', err);
      }
    };

    window.addEventListener('proveedor:creado', handleProveedorCreado as EventListener);
    return () => window.removeEventListener('proveedor:creado', handleProveedorCreado as EventListener);
  }, []);

  // Sincronizar productos desde localStorage
  useEffect(() => {
    const cargarProductos = () => {
      const stored = localStorage.getItem(PRODUCTOS_KEY);
      if (stored) {
        try {
          const productosActualizados = JSON.parse(stored);
          setProductos(productosActualizados);
          console.log('✅ [ComprasManager] Productos sincronizados:', productosActualizados.map((p: any) => p.nombre));
        } catch (e) {
          console.error('❌ [ComprasManager] Error cargando productos:', e);
        }
      }
    };

    // Cargar inmediatamente
    cargarProductos();

    // Escuchar cambios en otros tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PRODUCTOS_KEY && e.newValue) {
        console.log('📡 [ComprasManager] Productos actualizados desde otro tab');
        cargarProductos();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periódicamente en el mismo tab
    const interval = setInterval(cargarProductos, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Sincronizar tallas desde localStorage
  useEffect(() => {
    const cargarTallas = () => {
      const stored = localStorage.getItem('damabella_tallas');
      if (stored) {
        try {
          const tallasActualizadas = JSON.parse(stored);
          const tallasFormato = tallasActualizadas.map((t: any) => t.abbreviation || t.name || t).filter(Boolean);
          setTallas(tallasFormato);
          console.log('✅ [ComprasManager] Tallas sincronizadas:', tallasFormato);
        } catch (e) {
          console.error('❌ [ComprasManager] Error cargando tallas:', e);
        }
      }
    };

    // Cargar inmediatamente
    cargarTallas();

    // Escuchar cambios en otros tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'damabella_tallas' && e.newValue) {
        console.log('📡 [ComprasManager] Tallas actualizadas desde otro tab');
        cargarTallas();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periódicamente en el mismo tab
    const interval = setInterval(cargarTallas, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Sincronizar colores desde localStorage
  useEffect(() => {
    const cargarColores = () => {
      const stored = localStorage.getItem('damabella_colores');
      if (stored) {
        try {
          const coloresActualizados = JSON.parse(stored);
          const coloresFormato = coloresActualizados.map((c: any) => c.name || c.nombre || '').filter(Boolean);
          setColoresDisponibles(coloresFormato);
          console.log('✅ [ComprasManager] Colores sincronizados:', coloresFormato);
        } catch (e) {
          console.error('❌ [ComprasManager] Error cargando colores:', e);
        }
      }
    };

    // Cargar inmediatamente
    cargarColores();

    // Escuchar cambios en otros tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'damabella_colores' && e.newValue) {
        console.log('📡 [ComprasManager] Colores actualizados desde otro tab');
        cargarColores();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periódicamente en el mismo tab
    const interval = setInterval(cargarColores, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Sincronizar categorías desde localStorage
  useEffect(() => {
    const cargarCategorias = () => {
      const stored = localStorage.getItem(CATEGORIAS_KEY);
      if (stored) {
        try {
          const categoriasActualizadas = JSON.parse(stored);
          const categoriasFormato = categoriasActualizadas
            .filter((cat: any) => cat.active !== false)
            .map((cat: any) => {
              // Si es string, convertir a objeto
              if (typeof cat === 'string') {
                return {
                  id: cat.toLowerCase().replace(/\s+/g, '_'),
                  name: cat,
                  active: true
                };
              }
              // Si es objeto, usar estructura existente
              return {
                id: cat.id || cat.name?.toLowerCase().replace(/\s+/g, '_') || '',
                name: cat.name || cat.nombre || '',
                active: cat.active !== false
              };
            });
          setcategorias(categoriasFormato);
          console.log('✅ [ComprasManager] Categorías sincronizadas:', categoriasFormato.map((c: any) => c.name));
        } catch (e) {
          console.error('❌ [ComprasManager] Error cargando categorías:', e);
        }
      }
    };

    // Cargar inmediatamente
    cargarCategorias();

    // Escuchar cambios en otros tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CATEGORIAS_KEY && e.newValue) {
        console.log('📡 [ComprasManager] Categorías actualizadas desde otro tab');
        cargarCategorias();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periódicamente en el mismo tab
    const interval = setInterval(cargarCategorias, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const validateField = (field: string, value: any) => {
    const errors: any = {};
    
    if (field === 'proveedorId') {
      if (!value) {
        errors.proveedorId = 'Debes seleccionar un proveedor';
      }
    }
    
    if (field === 'fechaCompra') {
      if (!value) {
        errors.fechaCompra = 'La fecha es obligatoria';
      }
    }

    if (field === 'iva') {
      if (!value || parseFloat(value) < 0) {
        errors.iva = 'El IVA debe ser mayor o igual a 0';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: fieldErrors[field] });
  };

  const handleCreate = () => {
    setFormData({
      proveedorId: '',
      proveedorNombre: '',
      fechaCompra: new Date().toISOString().split('T')[0],
      iva: '19',
      observaciones: '',
      items: []
    });
    setNuevoItem({
      productoId: '',
      productoNombre: '',
      talla: '',
      color: '',
      cantidad: '',
      precioCompra: '',
      precioVenta: '',
      categoriaId: '',
      categoriaNombre: '',
      imagen: '',
      referencia: ''
    });
    setFormErrors({});
    setItemsError('');
    setProveedorSearchTerm('');
    setProductoSearchTerm('');
    setShowModal(true);
  };

  const handleView = (compra: Compra) => {
    setViewingCompra(compra);
    setShowDetailModal(true);
  };

  const handleSelectProveedor = (proveedorId: string, proveedorNombre: string) => {
    setFormData({ ...formData, proveedorId, proveedorNombre });
    setProveedorSearchTerm(proveedorNombre);
    setShowProveedorDropdown(false);
    setFormErrors({ ...formErrors, proveedorId: undefined });
  };

  const handleSelectProducto = (productoId: string, productoNombre: string) => {
    // Buscar el producto para obtener tallas, colores y CATEGORÍA
    const producto = productos.find((p: any) => String(p.id) === String(productoId));
    
    // 🔒 CRÍTICO: Asegurar que la categoría se copia del producto existente
    let categoriaIdFinal = producto?.categoryId || '';
    let categoriaNombreFinal = '';
    
    if (categoriaIdFinal) {
      const catFound = categorias.find(c => String(c.id) === String(categoriaIdFinal));
      categoriaNombreFinal = catFound?.name || '';
      console.log(`✅ Categoría del producto existente: ${categoriaIdFinal} (${categoriaNombreFinal})`);
    } else {
      console.warn(`⚠️ Producto existente SIN categoría: ${productoNombre}. Será requerida al agregar.`);
    }
    
    setNuevoItem({ 
      ...nuevoItem, 
      productoId,
      productoNombre,
      referencia: producto?.referencia || '',
        categoriaId: categoriaIdFinal,
        categoriaNombre: categoriaNombreFinal,
        // Copiar datos relevantes del producto seleccionado (excluir cantidad)
        precioCompra: producto?.precioCompra ? String(producto.precioCompra) : nuevoItem.precioCompra || '',
        precioVenta: producto?.precioVenta ? String(producto.precioVenta) : nuevoItem.precioVenta || '',
        imagen: producto?.imagen || nuevoItem.imagen || '',
        // Preseleccionar la primera talla/color disponible si existen, pero permitir edición
        talla: (producto?.tallas && producto.tallas.length > 0) ? producto.tallas[0] : nuevoItem.talla || '',
        color: (producto?.colores && producto.colores.length > 0) ? producto.colores[0] : nuevoItem.color || ''
    });
    setProductoSearchTerm(productoNombre);
    setShowProductoDropdown(false);
    
    // Log para debugging
    if (producto) {
      console.log(`✅ Producto seleccionado: ${producto.nombre}`);
      console.log(`📦 SKU/Referencia: ${producto.referencia}`);
      console.log(`📏 Tallas disponibles: ${producto.tallas?.join(', ') || 'No especificadas'}`);
      console.log(`🎨 Colores disponibles: ${producto.colores?.join(', ') || 'No especificados'}`);
      console.log(`📂 Categoría ID: ${categoriaIdFinal || 'SIN ASIGNAR'}`);
    }

    // Si el producto tiene un proveedor asociado (nombre), buscar su id y asignarlo
    try {
      const proveedorNameFromProduct = (producto as any)?.proveedor || '';
      if (producto && proveedorNameFromProduct) {
        const proveedorMatch = proveedores.find((p: any) => String(p.nombre).toLowerCase() === String(proveedorNameFromProduct).toLowerCase());
        if (proveedorMatch) {
          setFormData({ ...formData, proveedorId: proveedorMatch.id, proveedorNombre: proveedorMatch.nombre });
          setProveedorSearchTerm(proveedorMatch.nombre);
          console.log(`✅ [ComprasManager] Proveedor preseleccionado desde producto: ${proveedorMatch.nombre} (id=${proveedorMatch.id})`);
        }
      }
    } catch (e) {
      console.warn('⚠️ [ComprasManager] No se pudo preseleccionar proveedor desde producto:', e);
    }
  };

  const filteredProveedores = proveedores.filter((p: any) => 
    p.activo && (p.nombre?.toLowerCase() ?? '').includes(proveedorSearchTerm.toLowerCase())
  );

  const filteredProductos = productos.filter((p: any) => 
    p.activo && (p.nombre?.toLowerCase() ?? '').includes(productoSearchTerm.toLowerCase())
  );

  const agregarItem = () => {
    // 🔒 CRÍTICO: Obtener categoriaId desde múltiples fuentes
    let categoriaIdFinal = nuevoItem.categoriaId;
    let categoriaNombreFinal = nuevoItem.categoriaNombre;
    
    // FALLBACK 1: Si no hay categoría en estado, obtener del select
    if (!categoriaIdFinal) {
      const selectValue = categoriaSelectRef.current?.value;
      if (selectValue) {
        categoriaIdFinal = selectValue;
        console.log('✅ [agregarItem] Fallback 1: Categoría obtenida del select:', categoriaIdFinal);
      }
    }
    
    // FALLBACK 2: Si el producto existe en BD, obtener categoryId de ahí
    if (!categoriaIdFinal) {
      const productoBD = productos.find((p: any) => 
        normalizarNombreProducto(p.nombre) === normalizarNombreProducto(nuevoItem.productoNombre)
      );
      if (productoBD && productoBD.categoryId) {
        categoriaIdFinal = productoBD.categoryId;
        console.log('✅ [agregarItem] Fallback 2: Categoría obtenida del producto en BD:', categoriaIdFinal);
      }
    }
    
    // 🔒 CRÍTICO: SIEMPRE resolver el nombre desde categoryId si falta
    // Esto asegura que categoriaNombre NUNCA esté vacío si categoryId existe
    if (categoriaIdFinal && !categoriaNombreFinal) {
      const catFound = categorias.find(c => String(c.id) === String(categoriaIdFinal));
      categoriaNombreFinal = catFound?.name || '';
      console.log('✅ [agregarItem] Resolviendo nombre desde categoryId:', {
        categoryId: categoriaIdFinal,
        categoriaNombre: categoriaNombreFinal
      });
    }
    
    console.log('📋 [ComprasManager] agregarItem - Estado final:', {
      productoId: nuevoItem.productoId,
      productoNombre: nuevoItem.productoNombre,
      categoriaId: categoriaIdFinal,
      categoriaNombre: categoriaNombreFinal,
      color: nuevoItem.color,
      cantidad: nuevoItem.cantidad,
      precioCompra: nuevoItem.precioCompra,
      precioVenta: nuevoItem.precioVenta
    });

    // ✅ CAMBIO: Permitir crear productos que NO existen
    // Solo requerir: nombre del producto, color, cantidad, precios y categoría
    const productoNombre = nuevoItem.productoNombre || 
      (nuevoItem.productoId ? productos.find((p:any) => String(p.id) === String(nuevoItem.productoId))?.nombre : '');

    if (!productoNombre || !nuevoItem.color || !nuevoItem.cantidad || !nuevoItem.precioCompra || !nuevoItem.precioVenta) {
      setNotificationMessage('Por favor completa: nombre del producto, color, cantidad, precios');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    if (!categoriaIdFinal) {
      console.warn('❌ [ComprasManager] Error: Categoría no seleccionada. categoriaId=', categoriaIdFinal);
      setNotificationMessage('Por favor selecciona una categoría para el producto');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    console.log('✅ [ComprasManager] Validaciones OK - Producto:', productoNombre, 'Categoría:', categoriaNombreFinal);

    const cantidad = parseFloat(nuevoItem.cantidad);
    const precioCompra = parseFloat(nuevoItem.precioCompra);
    const precioVenta = parseFloat(nuevoItem.precioVenta);
    const subtotal = cantidad * precioCompra;

    console.log(`📝 Creando item:`, {
      productoNombre: nuevoItem.productoNombre,
      cantidad,
      precioCompra,
      precioVenta,
      subtotal,
      cantidadEsNumero: typeof cantidad === 'number',
      precioCompraEsNumero: typeof precioCompra === 'number'
    });

    const item: ItemCompra = {
      id: Date.now().toString(),
      productoId: nuevoItem.productoId,
      productoNombre,
      talla: nuevoItem.talla,
      color: nuevoItem.color,
      cantidad,
      precioCompra,
      precioVenta,
      subtotal,
      categoriaId: categoriaIdFinal,
      categoriaNombre: categoriaNombreFinal,
      imagen: nuevoItem.imagen,
      referencia: nuevoItem.referencia
    };

    console.log(`✅ Item agregado a tabla. Total items ahora: ${formData.items.length + 1}`);

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    // Reset SOLO los campos del item, pero mantén la categoría seleccionada
    setNuevoItem({
      productoId: '',
      productoNombre: '',
      talla: '',
      color: '',
      cantidad: '',
      precioCompra: '',
      precioVenta: '',
      categoriaId: categoriaIdFinal,  // MANTENER CATEGORÍA
      categoriaNombre: categoriaNombreFinal,  // MANTENER NOMBRE CATEGORÍA
      imagen: '',
      referencia: ''
    });
    setProductoSearchTerm('');
  };

  const eliminarItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const calcularSubtotal = () => {
    const total = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.subtotal || 0;
      console.log(`📦 Item: ${item.productoNombre}, Cant: ${item.cantidad}, P.Compra: ${item.precioCompra}, Subtotal: ${itemSubtotal}`);
      return sum + itemSubtotal;
    }, 0);
    console.log(`💰 SUBTOTAL TOTAL DE COMPRA: $${total}`);
    return total;
  };

  const calcularIVA = () => {
    const subtotal = calcularSubtotal();
    const ivaPercent = parseFloat(formData.iva) || 0;
    return (subtotal * ivaPercent) / 100;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  // 🔒 HELPERS para historial de compras por proveedor
  const filtrarComprasPorProveedor = (proveedorId: string): Compra[] => {
    if (!proveedorId) return [];
    return compras.filter((c) => c.proveedorId === proveedorId);
  };

  const contarCompras = (comprasProveedor: Compra[]): number => {
    return comprasProveedor.length;
  };

  const sumarCantidadProductos = (comprasProveedor: Compra[]): number => {
    return comprasProveedor.reduce((total, compra) => {
      const cantidadItems = (compra.items || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
      return total + cantidadItems;
    }, 0);
  };

  const sumarMontoTotal = (comprasProveedor: Compra[]): number => {
    return comprasProveedor.reduce((total, compra) => total + (compra.total || 0), 0);
  };

  const ordenarComprasPorFecha = (comprasProveedor: Compra[]): Compra[] => {
    return [...comprasProveedor].sort((a, b) => {
      const fechaA = new Date(a.fechaCompra || '').getTime();
      const fechaB = new Date(b.fechaCompra || '').getTime();
      return fechaB - fechaA; // Descendente (más reciente primero)
    });
  };

  const formatearCOP = (valor: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const handleSave = () => {
    // Validar todos los campos
    const allErrors: any = {};
    ['proveedorId', 'fechaCompra', 'iva'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    if (formData.items.length === 0) {
      setItemsError('Debes agregar al menos un producto a la compra');
      return;
    }

    // ✅ VALIDACIÓN CRÍTICA: TODOS los items DEBEN tener categoryId válido
    const itemsSinCategoria = formData.items.filter((item: ItemCompra) => 
      !item.categoriaId || String(item.categoriaId).trim() === ''
    );

    if (itemsSinCategoria.length > 0) {
      const nombresProductos = itemsSinCategoria.map((item: ItemCompra) => item.productoNombre).join(', ');
      const mensaje = `❌ CRÍTICO: Los siguientes productos NO tienen categoría asignada:\n${nombresProductos}\n\nTodos los productos DEBEN tener una categoría. No se puede continuar.`;
      setItemsError(mensaje);
      setNotificationMessage(mensaje);
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    setItemsError('');

    // Usar el nombre del proveedor guardado o buscar si no existe
    let proveedorNombre = formData.proveedorNombre;
    if (!proveedorNombre) {
      const proveedor = proveedores.find((p: any) => String(p.id) === String(formData.proveedorId));
      proveedorNombre = proveedor?.nombre || formData.proveedorId;
    }

    const subtotal = calcularSubtotal();
    const iva = calcularIVA();
    const total = calcularTotal();
    const numeroCompra = `COMP-${compraCounter.toString().padStart(3, '0')}`;

    const compraData: Compra = {
      id: Date.now(),
      numeroCompra,
      proveedorId: formData.proveedorId,
      proveedorNombre,
      fechaCompra: formData.fechaCompra,
      fechaRegistro: new Date().toISOString().split('T')[0],
      items: formData.items,
      subtotal,
      iva,
      total,
      estado: 'Recibida',
      observaciones: formData.observaciones,
      createdAt: new Date().toISOString()
    };

    // 📊 ACTUALIZAR STOCK EN PRODUCTOS Y CREAR NUEVOS PRODUCTOS
    const productosActualizados = productos.map((prod: any) => {
      // Buscar si este producto tiene items en la compra
      const itemsDelProducto = formData.items.filter((item: any) => 
        String(item.productoId) === String(prod.id)
      );
      
      if (itemsDelProducto.length > 0) {
        // Sumar la cantidad total comprada
        const cantidadComprada = itemsDelProducto.reduce((sum: number, item: any) => 
          sum + (Number(item.cantidad) || 0), 0
        );
        
        // Aumentar stock
        const nuevoStock = (prod.stock || 0) + cantidadComprada;
        
        console.log(`📦 [Producto] ${prod.nombre}: Stock ${prod.stock || 0} + ${cantidadComprada} = ${nuevoStock}`);
        
        return {
          ...prod,
          stock: nuevoStock
        };
      }
      return prod;
    });
    
    // 🆕 CREAR O ACTUALIZAR PRODUCTOS USANDO LA FUNCIÓN ESPECIALIZADA
    let productosFinales = [...productosActualizados];
    const productosAgregados: string[] = [];
    const productosActualizados_: string[] = [];
    
    formData.items.forEach((item: ItemCompra) => {
      // Contar si es nuevo o actualizado (por nombre normalizado)
      const existía = productosFinales.some(
        (p: any) => normalizarNombreProducto(p.nombre) === normalizarNombreProducto(item.productoNombre)
      );
      
      // Aplicar la función especializada
      productosFinales = agregarOActualizarProducto(item, productosFinales);
      
      // Registrar qué se agregó/actualizó
      if (!existía) {
        productosAgregados.push(item.productoNombre);
      } else {
        productosActualizados_.push(item.productoNombre);
      }
    });

    // 🔗 UNIFICAR PRODUCTOS DUPLICADOS (si hay)
    console.log('🔗 [ComprasManager] Verificando productos duplicados...');
    const productosUnificados = unificarProductosDuplicados(productosFinales);
    if (productosUnificados.length < productosFinales.length) {
      console.log(`✅ [ComprasManager] ${productosFinales.length - productosUnificados.length} productos duplicados fueron unificados`);
    }
    productosFinales = productosUnificados;
    
    // 🔧 ACTUALIZAR ESTADO DEL PRODUCTO SEGÚN STOCK TOTAL
    // Si el stock total > 0, asegurar que esté marcado como activo
    productosFinales = actualizarEstadoProductoSegunStock(productosFinales);
    
    // Guardar productos actualizados/creados en localStorage
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosFinales));
    
    // 📡 Log detallado de lo guardado
    console.log('📊 [ComprasManager] Estado actual de productos en localStorage:');
    console.log(`   Total de productos: ${productosFinales.length}`);
    productosFinales.forEach((p: any, idx: number) => {
      console.log(`   ${idx + 1}. ${p.nombre} (SKU: ${p.referencia}) - Variantes: ${p.variantes?.length || 0} - Activo: ${p.activo}`);
    });
    
    setProductos(productosFinales);
    
    // 📡 Disparar evento de storage para sincronizar en tiempo real con otros módulos (EcommerceContext)
    window.dispatchEvent(new StorageEvent('storage', {
      key: PRODUCTOS_KEY,
      newValue: JSON.stringify(productosFinales),
      oldValue: null,
      url: window.location.href
    }));
    
    // Resumen de cambios
    if (productosAgregados.length > 0) {
      console.log(`✅ [ComprasManager] Se crearon ${productosAgregados.length} nuevos productos: ${productosAgregados.join(', ')}`);
    }
    if (productosActualizados_.length > 0) {
      console.log(`📦 [ComprasManager] Se actualizaron ${productosActualizados_.length} productos: ${productosActualizados_.join(', ')}`);
    }
    console.log('✅ [ComprasManager] Productos sincronizados correctamente con el módulo Productos');

    setCompras([...compras, compraData]);
    setCompraCounter(compraCounter + 1);
    
    // Mostrar notificación de éxito con información sobre productos creados/actualizados
    let mensaje = '✅ Compra guardada correctamente';
    if (productosAgregados.length > 0) {
      mensaje += ` | 🆕 ${productosAgregados.length} nuevo(s)`;
    }
    if (productosActualizados_.length > 0) {
      mensaje += ` | 📦 ${productosActualizados_.length} actualizado(s)`;
    }
    mensaje += ' en Productos';
    setNotificationMessage(mensaje);
    setNotificationType('success');
    setShowNotificationModal(true);
    
    // Limpiar formulario
    setFormData({
      proveedorId: '',
      proveedorNombre: '',
      fechaCompra: new Date().toISOString().split('T')[0],
      items: [],
      iva: '0',
      observaciones: ''
    });
    setFormErrors({});
    setItemsError('');
    setShowModal(false);
  };

  // 🔄 FUNCIÓN: Revertir el stock exactamente lo que la compra agregó
  // 🔧 FUNCIÓN HELPER: Calcular stock total y actualizar estado del producto
  const actualizarEstadoProductoSegunStock = (productos: any[]): any[] => {
    return productos.map((producto: any) => {
      // Calcular stock total: suma de todas las variantes y colores
      let stockTotal = 0;
      if (producto.variantes && Array.isArray(producto.variantes)) {
        stockTotal = producto.variantes.reduce((totalVar: number, variante: any) => {
          const stockVariante = (variante.colores || []).reduce((totalCol: number, color: any) => {
            return totalCol + (color.cantidad || 0);
          }, 0);
          return totalVar + stockVariante;
        }, 0);
      }

      // Determinar si debe estar activo
      const debeEstarActivo = stockTotal > 0;
      const estaActivo = producto.activo !== false;
      const estadoProducto = stockTotal > 0 ? 'Activo' : 'Inactivo';

      // Si el estado cambió, actualizar
      if (debeEstarActivo !== estaActivo || producto.estado !== estadoProducto) {
        console.log(
          `🔄 [actualizarEstadoProductoSegunStock] ${producto.nombre}: ` +
          `Stock Total = ${stockTotal}, Activo: ${estaActivo} → ${debeEstarActivo}, ` +
          `Estado: "${producto.estado}" → "${estadoProducto}"`
        );
        return {
          ...producto,
          activo: debeEstarActivo,
          estado: estadoProducto
        };
      }

      return producto;
    });
  };

  const revertirStockCompra = (compraAAnular: Compra, productosActuales: any[]): any[] => {
    console.log(`\n🔄 [revertirStockCompra] INICIANDO reversión para compra: ${compraAAnular.numeroCompra}`);
    console.log(`   Compra tiene ${compraAAnular.items.length} item(s)`);

    let productosActualizados = [...productosActuales];

    // Iterar sobre cada item en la compra a anular
    compraAAnular.items.forEach((itemCompra: ItemCompra, idx: number) => {
      console.log(`\n   Item ${idx + 1}: ${itemCompra.productoNombre} (Talla: ${itemCompra.talla}, Color: ${itemCompra.color}, Qty: ${itemCompra.cantidad})`);

      // Buscar el producto por nombre normalizado (igual como se agregó)
      const nombreNormalizado = normalizarNombreProducto(itemCompra.productoNombre);
      const productoIndex = productosActualizados.findIndex(
        (p: any) => normalizarNombreProducto(p.nombre) === nombreNormalizado
      );

      if (productoIndex === -1) {
        console.warn(`   ⚠️  Producto NO encontrado: ${itemCompra.productoNombre}`);
        return;
      }

      const producto = productosActualizados[productoIndex];
      console.log(`   ✓ Producto encontrado: ID ${producto.id}`);

      // Guard: Verificar que el producto tenga variantes
      if (!producto.variantes || producto.variantes.length === 0) {
        console.warn(`   ⚠️  Producto sin variantes: ${producto.nombre}`);
        return;
      }

      // Buscar la talla
      const varianteIndex = producto.variantes.findIndex(
        (v: any) => v.talla === itemCompra.talla
      );

      if (varianteIndex === -1) {
        console.warn(`   ⚠️  Talla NO encontrada: ${itemCompra.talla}`);
        return;
      }

      const variante = producto.variantes[varianteIndex];
      console.log(`   ✓ Talla encontrada: ${variante.talla}`);

      // Buscar el color
      const colorIndex = variante.colores.findIndex(
        (c: any) => c.color === itemCompra.color
      );

      if (colorIndex === -1) {
        console.warn(`   ⚠️  Color NO encontrado: ${itemCompra.color}`);
        return;
      }

      const colorItem = variante.colores[colorIndex];
      const cantidadAnterior = colorItem.cantidad;
      const cantidadAResta = itemCompra.cantidad || 0;
      const cantidadNueva = Math.max(0, cantidadAnterior - cantidadAResta);

      console.log(`   📊 Stock: ${cantidadAnterior} - ${cantidadAResta} = ${cantidadNueva}`);

      // Guard: Verificar consistencia (stock no debe ser negativo después)
      if (cantidadNueva < 0) {
        console.warn(`   ⚠️  ADVERTENCIA: Stock sería negativo (${cantidadNueva}). Ajustando a 0`);
      }

      // Actualizar la cantidad en el color
      colorItem.cantidad = cantidadNueva;

      console.log(`   ✅ Stock actualizado: ${itemCompra.color} ahora tiene ${cantidadNueva} unidades`);
    });

    console.log(`\n✅ [revertirStockCompra] Reversión completada para ${compraAAnular.numeroCompra}\n`);
    
    // 🔧 ACTUALIZAR ESTADO DEL PRODUCTO SEGÚN STOCK TOTAL
    // Si el stock total queda en 0, marcar como inactivo
    const productosConEstadoActualizado = actualizarEstadoProductoSegunStock(productosActualizados);
    
    return productosConEstadoActualizado;
  };

  // 🚫 FUNCIÓN: Anular una compra con reversión de stock
  const anularCompra = (id: number) => {
    // Guard 1: Verificar que la compra existe
    const compraAAnular = compras.find(c => c.id === id);
    if (!compraAAnular) {
      setNotificationMessage('❌ Compra no encontrada');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // Guard 2: Verificar que no está ya anulada
    if (compraAAnular.estado === 'Anulada') {
      setNotificationMessage('❌ Esta compra ya fue anulada');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    // Guard 3: Verificar que tiene items
    if (!compraAAnular.items || compraAAnular.items.length === 0) {
      setNotificationMessage('❌ Compra sin items - no se puede anular');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    setConfirmMessage('¿Está seguro de anular esta compra?\n\n✅ Se revertirá el stock exactamente.\n❌ Esta acción no se puede deshacer.');
    setConfirmAction(() => () => {
      console.log(`\n🚫 [anularCompra] INICIANDO ANULACIÓN de compra: ${compraAAnular.numeroCompra}`);
      console.log(`   Items en compra: ${compraAAnular.items.length}`);

      // Step 1: Revertir el stock en productos
      console.log(`\n📦 Step 1: Revertiendo stock en productos...`);
      const productosActualizados = revertirStockCompra(compraAAnular, productos);

      // Guard 4: Verificar que la reversión tuvo efecto
      const cambiosStock = productosActualizados.some((p: any, idx: number) => {
        const productoOriginal = productos[idx];
        return JSON.stringify(p) !== JSON.stringify(productoOriginal);
      });

      if (!cambiosStock) {
        console.warn(`\n⚠️  Advertencia: No hubo cambios en el stock`);
      }

      // Step 2: Guardar productos actualizados
      console.log(`\n💾 Step 2: Guardando productos actualizados en localStorage...`);
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosActualizados));
      setProductos(productosActualizados);

      // Disparar evento de sincronización
      window.dispatchEvent(new StorageEvent('storage', {
        key: PRODUCTOS_KEY,
        newValue: JSON.stringify(productosActualizados),
        oldValue: null,
        url: window.location.href
      }));

      // Step 3: Marcar compra como ANULADA (no eliminar)
      console.log(`\n📝 Step 3: Marcando compra como ANULADA...`);
      const comprasActualizadas = compras.map(c => 
        c.id === id ? { ...c, estado: 'Anulada' as 'Anulada' } : c
      );

      // El useEffect automáticamente guardará en localStorage
      setCompras(comprasActualizadas);

      console.log(`\n✅ [anularCompra] ANULACIÓN COMPLETADA para ${compraAAnular.numeroCompra}\n`);

      setShowConfirmModal(false);
      setNotificationMessage(`✅ Compra ${compraAAnular.numeroCompra} anulada. Stock revertido correctamente.`);
      setNotificationType('success');
      setShowNotificationModal(true);
    });
    setShowConfirmModal(true);
  };

  const cambiarEstado = (id: number, nuevoEstado: 'Pendiente' | 'Recibida') => {
    setConfirmMessage(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`);
    setConfirmAction(() => () => {
      setCompras(compras.map(c => 
        c.id === id ? { ...c, estado: nuevoEstado } : c
      ));
      setShowConfirmModal(false);
      setNotificationMessage(`Estado cambiado a "${nuevoEstado}"`);
      setNotificationType('success');
      setShowNotificationModal(true);
    });
    setShowConfirmModal(true);
  };

  const filteredCompras = compras.filter(c =>
    (c.numeroCompra?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (c.proveedorNombre?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Compras</h2>
          <p className="text-gray-600">Administra las compras a proveedores</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nueva Compra
        </Button>
      </div>

      {/* 🔒 Historial de Compras por Proveedor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 font-semibold mb-4">Historial de Compras por Proveedor</h3>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">Seleccionar proveedor</label>
          <select
            value={proveedorSeleccionadoHistorial}
            onChange={(e) => setProveedorSeleccionadoHistorial(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Seleccionar un proveedor --</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        </div>

        {proveedorSeleccionadoHistorial && (() => {
          const comprasProveedor = filtrarComprasPorProveedor(proveedorSeleccionadoHistorial); 
          const comprasOrdenadas = ordenarComprasPorFecha(comprasProveedor);
          const proveedorNombre = proveedores.find((p) => p.id === proveedorSeleccionadoHistorial)?.nombre || '';
          const totalCompras = contarCompras(comprasProveedor);
          const cantidadProductos = sumarCantidadProductos(comprasProveedor);
          const montoTotal = sumarMontoTotal(comprasProveedor);

          return (
            <div className="space-y-4">
              {/* Título dinámico */}
              <h4 className="text-gray-800 font-semibold">
                Historial de Compras – {proveedorNombre}
              </h4>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-600">Total de compras</p>
                  <p className="text-xl font-semibold text-gray-900">{totalCompras}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cantidad total de productos</p>
                  <p className="text-xl font-semibold text-gray-900">{cantidadProductos}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto total acumulado</p>
                  <p className="text-xl font-semibold text-gray-900">{formatearCOP(montoTotal)}</p>
                </div>
              </div>

              {/* Tabla de compras */}
              {comprasOrdenadas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="mx-auto mb-2 text-gray-300" size={32} />
                  <p>Este proveedor aún no tiene compras registradas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Fecha
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          N° Compra
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          Cantidad de Productos
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Subtotal
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          IVA
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Total
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {comprasOrdenadas.map((compra) => {
                        const cantidadItems = (compra.items || []).reduce(
                          (sum, item) => sum + (item.cantidad || 0),
                          0
                        );

                        return (
                          <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {new Date(compra.fechaCompra).toLocaleDateString('es-CO')}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {compra.numeroCompra}
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-gray-700">
                              {cantidadItems}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-700">
                              {formatearCOP(compra.subtotal || 0)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-700">
                              {formatearCOP(compra.iva || 0)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                              {formatearCOP(compra.total || 0)}
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  compra.estado === 'Recibida'
                                    ? 'bg-green-100 text-green-800'
                                    : compra.estado === 'Pendiente'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {compra.estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar compras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Compras List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">N° Compra</th>
                <th className="text-left py-4 px-6 text-gray-600">Proveedor</th>
                <th className="text-left py-4 px-6 text-gray-600">Fecha Compra</th>
                <th className="text-center py-4 px-6 text-gray-600">Items</th>
                <th className="text-right py-4 px-6 text-gray-600">Total</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Truck className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron compras</p>
                  </td>
                </tr>
              ) : (
                filteredCompras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-medium">{compra.numeroCompra}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{compra.proveedorNombre}</td>
                    <td className="py-4 px-6 text-gray-600">{compra.fechaCompra}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleView(compra)}
                        className="text-gray-600 hover:text-gray-900 underline"
                      >
                        {compra.items.length} items
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900 font-semibold">${compra.total.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleView(compra)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        {
                          // Mostrar siempre el botón de anular, pero deshabilitado cuando ya está anulada
                        }
                        {(() => {
                          const isAnulada = compra.estado === 'Anulada';
                          return (
                            <button
                              onClick={() => { if (!isAnulada) anularCompra(compra.id); }}
                              className={`p-2 rounded-lg transition-colors ${isAnulada ? 'text-red-400 opacity-50 cursor-not-allowed' : 'hover:bg-red-50 text-red-600'}`}
                              title="Anular compra"
                              disabled={isAnulada}
                              aria-disabled={isAnulada}
                            >
                              <Ban size={18} />
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Compra"
        size="lg"
      >
        <div className="space-y-6">
          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Proveedor *</label>
              <select
                  value={formData.proveedorId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const sel = proveedores.find((p: any) => String(p.id) === String(val));
                    const nombre = sel ? sel.nombre : '';
                    if (nombre) {
                      setFormData({ ...formData, proveedorId: val, proveedorNombre: nombre });
                      setProveedorSearchTerm(nombre);
                    }
                    setFormErrors({ ...formErrors, proveedorId: undefined });
                  }}
                  disabled={!!nuevoItem.productoId}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${formErrors.proveedorId ? 'border-red-500' : 'border-gray-300'}`}
                >
                <option value="">Seleccionar proveedor...</option>
                          {/* Opción para añadir proveedor ahora via botón debajo */}
                {/** Si el proveedor fue prellenado pero no está en la lista, mostrarlo como opción fallback */}
                {formData.proveedorId && !proveedores.some((p: any) => String(p.id) === String(formData.proveedorId)) && (
                  <option value={String(formData.proveedorId)}>{formData.proveedorNombre || formData.proveedorId}</option>
                )}
                {proveedores
                  .filter((p: any) => p.activo && p.nombre)
                  .map((p: any) => (
                    <option key={p.id} value={String(p.id)}>{p.nombre}</option>
                  ))}
              </select>
              {/* Botón pequeño para abrir el modal de Proveedores y agregar uno nuevo */}
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowProveedorModal(true)}
                  className="text-sm text-gray-700"
                >
                  o agregar nuevo proveedor📦
                </button>
              </div>
              {formErrors.proveedorId && (
                <p className="text-red-600 text-xs mt-1">{formErrors.proveedorId}</p>
              )}
            </div>

            {/* Montar ProveedoresManager solo cuando el estado lo pida. Se usa onlyModal para mostrar únicamente el modal existente */}
            {showProveedorModal && (
              <ProveedoresManager onlyModal openOnMount />
            )}

            <div>
              <label className="block text-gray-700 mb-2">Fecha de Compra *</label>
              <Input
                type="date"
                value={formData.fechaCompra}
                onChange={(e) => handleFieldChange('fechaCompra', e.target.value)}
                className={formErrors.fechaCompra ? 'border-red-500' : ''}
                required
                readOnly
              />
              {formErrors.fechaCompra && (
                <p className="text-red-600 text-xs mt-1">{formErrors.fechaCompra}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">IVA (%) *</label>
            <Input
              type="number"
              value={formData.iva}
              onChange={(e) => handleFieldChange('iva', e.target.value)}
              placeholder="19"
              className={formErrors.iva ? 'border-red-500' : ''}
              required
            />
            {formErrors.iva && (
              <p className="text-red-600 text-xs mt-1">{formErrors.iva}</p>
            )}
          </div>

          {/* Agregar productos */}
          <div className="border-t pt-4">
            <h4 className="text-gray-900 mb-4">Agregar Productos a la Compra</h4>
            
            {itemsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {itemsError}
              </div>
            )}
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Nombre del Producto *</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Escribe el nombre del producto o selecciona uno existente"
                    value={nuevoItem.productoNombre}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, productoNombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  />
                  {productos.length > 0 && (
                    <div className="text-xs text-gray-600">
                      O selecciona uno existente:
                      <select
                        value={nuevoItem.productoId}
                          onChange={(e) => {
                          const val = e.target.value;
                          const sel = productos.find((p:any) => String(p.id) === String(val));
                          if (sel) {
                            // 🔒 CRÍTICO: Copiar la categoría del producto existente
                            let categoriaIdFinal = sel.categoryId || '';
                            let categoriaNombreFinal = '';
                            if (categoriaIdFinal) {
                              const catFound = categorias.find(c => String(c.id) === String(categoriaIdFinal));
                              categoriaNombreFinal = catFound?.name || '';
                            }

                            // Autocompletar precios e imagen si existen en historial o en el producto
                            let precioCompraStr = '';
                            let precioVentaStr = '';
                            let imagenUrl = sel.imagen || sel.image || sel.imagenUrl || '';

                            try {
                              // Buscar la última compra que contenga este producto (orden descendente por createdAt/fechaRegistro)
                              const comprasOrdenadas = compras.slice().sort((a:any,b:any) => {
                                const ta = new Date(a.createdAt || a.fechaRegistro || 0).getTime();
                                const tb = new Date(b.createdAt || b.fechaRegistro || 0).getTime();
                                return tb - ta;
                              });

                              let tallaFound = '';
                              let colorFound = '';
                              let proveedorIdFound = '';
                              let proveedorNombreFound = '';

                              for (const c of comprasOrdenadas) {
                                const found = (c.items || []).find((i:any) => String(i.productoId) === String(val) || normalizarNombreProducto(i.productoNombre) === normalizarNombreProducto(sel.nombre));
                                if (found) {
                                  // Capturar talla/color y proveedor de la compra más reciente que contenga el producto
                                  if (!tallaFound && found.talla) tallaFound = found.talla;
                                  if (!colorFound && found.color) colorFound = found.color;
                                  if (!proveedorIdFound) {
                                    proveedorIdFound = c.proveedorId || '';
                                    proveedorNombreFound = c.proveedorNombre || (proveedores.find((p:any) => String(p.id) === String(c.proveedorId))?.nombre) || '';
                                  }

                                  if (found.precioCompra && !precioCompraStr) {
                                    precioCompraStr = String(found.precioCompra);
                                    // preferir precio del primer match con precio
                                    break;
                                  }
                                }
                              }

                              // Si no se encontró precio en compras previas, calcular promedio
                              if (!precioCompraStr) {
                                const precios = compras.flatMap((c:any) => (c.items || [])
                                  .filter((i:any) => String(i.productoId) === String(val) || normalizarNombreProducto(i.productoNombre) === normalizarNombreProducto(sel.nombre))
                                  .map((i:any) => Number(i.precioCompra) || 0)
                                ).filter((p:number) => p > 0);

                                if (precios.length > 0) {
                                  const avg = precios.reduce((s:number,x:number) => s + x, 0) / precios.length;
                                  precioCompraStr = String(Math.round(avg * 100) / 100);
                                }
                              }

                              // Precio compra fallback desde el propio producto
                              if (!precioCompraStr && sel.precioCompra) precioCompraStr = String(sel.precioCompra);

                              // Precio venta: preferir precio del producto si existe
                              if (sel.precioVenta) precioVentaStr = String(sel.precioVenta);
                              else if (sel.precio) precioVentaStr = String(sel.precio);
                            } catch (err) {
                              console.warn('Error calculando precios previos para producto seleccionado', err);
                            }

                            console.log('✅ [select-onChange] Producto seleccionado:', {
                              nombre: sel.nombre,
                              categoryId: categoriaIdFinal,
                              categoriaNombre: categoriaNombreFinal,
                              precioCompra: precioCompraStr,
                              precioVenta: precioVentaStr,
                              imagen: imagenUrl
                            });

                            // Si encontramos proveedor/talla/color desde compras previas, sincronizarlos
                            // NOTA: solo prellenamos; los campos siguen editables según reglas (pero se bloquearán cuando corresponda)
                            let updatedNuevo = {
                              ...nuevoItem,
                              productoId: val,
                              productoNombre: sel.nombre,
                              categoriaId: categoriaIdFinal,
                              categoriaNombre: categoriaNombreFinal,
                              referencia: sel.referencia || '',
                              precioCompra: precioCompraStr,
                              precioVenta: precioVentaStr,
                              imagen: imagenUrl || ''
                            } as any;

                            // Si existieron talla/color/proveedor en compras previas, usarlos
                            if (typeof tallaFound !== 'undefined' && tallaFound) updatedNuevo.talla = tallaFound;
                            if (typeof colorFound !== 'undefined' && colorFound) updatedNuevo.color = colorFound;

                            setNuevoItem(updatedNuevo);

                            // Si encontramos proveedor en compras previas, prellenar formData.proveedorId/proveedorNombre
                            if (typeof proveedorIdFound !== 'undefined' && proveedorIdFound) {
                              setFormData({ ...formData, proveedorId: proveedorIdFound, proveedorNombre: proveedorNombreFound });
                              setProveedorSearchTerm(proveedorNombreFound || '');
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 mt-2"
                      >
                        <option value="">-- Seleccionar producto existente --</option>
                        {productos.filter((p:any)=>p.activo).map((p:any) => (
                          <option key={p.id} value={String(p.id)}>{p.nombre} {p.referencia ? `(${p.referencia})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Talla *</label>
                  <div className="flex gap-2">
                      <select
                        value={nuevoItem.talla}
                        onChange={(e) => setNuevoItem({ ...nuevoItem, talla: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="">Seleccionar talla...</option>
                      {tallas.map(talla => (
                        <option key={talla} value={talla}>{talla}</option>
                      ))}
                    </select>
                    <Input
                      type="text"
                      placeholder="O crear nueva"
                      className="flex-1 px-3 py-2 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          const newTalla = e.currentTarget.value.trim().toUpperCase();
                          if (!tallas.includes(newTalla)) {
                            const updated = [...tallas, newTalla];
                            setTallas(updated);
                            localStorage.setItem('damabella_tallas', JSON.stringify(updated));
                            setNuevoItem({ ...nuevoItem, talla: newTalla });
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tallas globales disponibles: {tallas.join(', ')}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Color *</label>
                  <div className="space-y-2">
                    {/* Color Picker Visual + Input */}
                    <div className="flex gap-2 items-end">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-600">Selector:</span>
                        <input
                          type="color"
                          value={
                            // Si es un HEX válido (#XXXXXX), usarlo directamente
                            nuevoItem.color && /^#[0-9A-F]{6}$/i.test(nuevoItem.color)
                              ? nuevoItem.color
                              // Si es un nombre de color, buscarlo en COLOR_MAP
                              : (COLOR_MAP as any)[nuevoItem.color] || '#FFFFFF'
                          }
                          onChange={(e) => {
                            const hex = e.target.value;
                            // Buscar el nombre del color en el mapa
                            const colorName = Object.entries(COLOR_MAP).find(([_, h]) => h.toUpperCase() === hex.toUpperCase())?.[0];
                            // Si encontramos el nombre, usarlo; si no, guardar el HEX
                            setNuevoItem({ ...nuevoItem, color: colorName || hex });
                          }}
                          className="w-12 h-10 p-1 cursor-pointer rounded-lg border border-gray-300"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          placeholder="Color (nombre o HEX)"
                          value={nuevoItem.color}
                          onChange={(e) => setNuevoItem({ ...nuevoItem, color: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              agregarItem();
                            }
                          }}
                          className="w-full px-3 py-2 text-sm pr-10"
                        />
                        {nuevoItem.color && (
                          <div
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border border-gray-300 shadow-sm"
                            style={{
                              backgroundColor:
                                // Si es HEX válido, usarlo
                                /^#[0-9A-F]{6}$/i.test(nuevoItem.color)
                                  ? nuevoItem.color
                                  // Si es nombre, buscarlo en COLOR_MAP
                                  : (COLOR_MAP as any)[nuevoItem.color] || '#FFFFFF'
                            }}
                            title={nuevoItem.color}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Paleta de Colores */}
                    <div>
                      <span className="text-xs text-gray-600 mb-3 block font-medium">O selecciona un color predefinido:</span>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(COLOR_MAP).map(([name, hex]) => {
                          const isSelected = nuevoItem.color && String(nuevoItem.color).toLowerCase() === String(name).toLowerCase();
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setNuevoItem({ ...nuevoItem, color: name });
                              }}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                                isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              title={name}
                            >
                              <div
                                className="w-10 h-10 rounded-lg border border-gray-300 shadow-sm"
                                style={{ backgroundColor: hex }}
                              />
                              <span className="text-xs font-semibold text-gray-700">{name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Los colores se definen en esta compra. Puedes escribir cualquier color personalizado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Cantidad</label>
                  <Input
                    type="number"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Precio Compra</label>
                  <Input
                    type="number"
                    value={nuevoItem.precioCompra}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, precioCompra: e.target.value })}
                    placeholder="0"
                    readOnly={!!nuevoItem.productoId}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Precio Venta</label>
                  <Input
                    type="number"
                    value={nuevoItem.precioVenta}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, precioVenta: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Categoría del Producto</label>
                  <select
                    ref={categoriaSelectRef}
                    value={nuevoItem.categoriaId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      const cat = categorias.find(c => c.id === id);
                      console.log('🔍 [ComprasManager] Categoría seleccionada en onChange:', { 
                        id, 
                        nombre: cat?.name
                      });
                      setNuevoItem(prev => ({ 
                        ...prev, 
                        categoriaId: id,
                        categoriaNombre: cat?.name || ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {!nuevoItem.categoriaId && (
                    <p className="text-xs text-gray-500 mt-1">La categoría es importante para organizar productos</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Imagen del Producto</label>
                  <ImageUploader
                      value={nuevoItem.imagen}
                      onChange={(b64) => setNuevoItem({ ...nuevoItem, imagen: b64 })}
                    />
                  <p className="text-xs text-gray-500 mt-1">URL o ruta de la imagen del producto</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 text-sm">Referencia (SKU)</label>
                <Input
                  type="text"
                  value={nuevoItem.referencia}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, referencia: e.target.value })}
                  placeholder="Ref-001 o código único"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Código o referencia único del producto (opcional)</p>
              </div>
            </div>

            <Button onClick={() => {
              // Obtener el categoriaId directamente del select (más confiable que el state)
              const selectValue = categoriaSelectRef.current?.value || '';
              const cat = categorias.find(c => c.id === selectValue);
              
              console.log('📋 [ComprasManager] ANTES de agregarItem:', {
                categoriaId_state: nuevoItem.categoriaId,
                categoriaId_select: selectValue,
                categoriaNombre_select: cat?.name,
                nuevoItem: JSON.stringify(nuevoItem, null, 2)
              });
              
              // Si el select tiene valor pero el state no, actualizar state
              if (selectValue && !nuevoItem.categoriaId) {
                console.log('🔧 [ComprasManager] Actualizando estado con categoría del select...');
                const updatedItem = {
                  ...nuevoItem,
                  categoriaId: selectValue,
                  categoriaNombre: cat?.name || ''
                };
                setNuevoItem(updatedItem);
                // Esperar a que se actualice y luego agregar
                setTimeout(() => agregarItem(), 50);
              } else if (selectValue && nuevoItem.categoriaId !== selectValue) {
                console.log('🔧 [ComprasManager] Sincronizando categoría del select...');
                const updatedItem = {
                  ...nuevoItem,
                  categoriaId: selectValue,
                  categoriaNombre: cat?.name || ''
                };
                setNuevoItem(updatedItem);
                setTimeout(() => agregarItem(), 50);
              } else {
                agregarItem();
              }
            }} variant="primary" className="w-full mb-4">
              <Plus size={16} />
              Agregar Producto
            </Button>

            {/* Lista de productos agregados */}
            {formData.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                      <th className="text-left py-2 px-3 text-gray-600">Categoría</th>
                      <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                      <th className="text-left py-2 px-3 text-gray-600">Color</th>
                      <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Compra</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                      <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.map((item) => {
                      const colorHex = (COLOR_MAP as any)[item.color] || item.color;
                      return (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-gray-900">{item.productoNombre}</td>
                        <td className="py-2 px-3 text-gray-700">
                          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {item.categoriaNombre || '⚠️ ERROR: Sin asignar'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-700">{item.talla || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">
                          <div className="flex items-center gap-2">
                            {item.color && (
                              <div
                                className="w-6 h-6 rounded-md border border-gray-300 shadow-sm"
                                style={{ backgroundColor: colorHex }}
                                title={item.color}
                              />
                            )}
                            <span>{item.color || '-'}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${(item.precioCompra || 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${(item.precioVenta || 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-900">${(item.subtotal || 0).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totales */}
            {formData.items.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>${calcularSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>IVA ({formData.iva}%):</span>
                  <span>${calcularIVA().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">${calcularTotal().toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
              placeholder="Notas adicionales sobre la compra..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              Crear Compra
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detalles de la Compra ${viewingCompra?.numeroCompra}`}
      >
        {viewingCompra && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 mb-1">Proveedor</div>
                <div className="text-gray-900 font-medium">{viewingCompra.proveedorNombre}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Estado</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                  viewingCompra.estado === 'Recibida' ? 'bg-green-100 text-green-700' :
                  viewingCompra.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {viewingCompra.estado}
                </span>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Fecha de Compra</div>
                <div className="text-gray-900">{viewingCompra.fechaCompra}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Fecha de Registro</div>
                <div className="text-gray-900">{viewingCompra.fechaRegistro}</div>
              </div>
            </div>

            {viewingCompra.observaciones && (
              <div>
                <div className="text-gray-600 mb-1">Observaciones</div>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCompra.observaciones}</div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-gray-900 font-semibold mb-3">Productos</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-gray-600">Producto</th>
                      <th className="text-left py-2 px-3 text-gray-600">Talla</th>
                      <th className="text-left py-2 px-3 text-gray-600">Color</th>
                      <th className="text-right py-2 px-3 text-gray-600">Cant.</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Compra</th>
                      <th className="text-right py-2 px-3 text-gray-600">P. Venta</th>
                      <th className="text-right py-2 px-3 text-gray-600">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingCompra.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-gray-900">{item.productoNombre}</td>
                        <td className="py-2 px-3 text-gray-700">{item.talla || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">{item.color || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-700">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${item.precioCompra.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-700">${item.precioVenta.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-gray-900">${item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${viewingCompra.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>IVA:</span>
                <span>${viewingCompra.iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-300">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">${viewingCompra.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Notificación */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notificationType === 'error' ? 'Error' : notificationType === 'success' ? 'Éxito' : 'Advertencia'}
      >
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            notificationType === 'error' ? 'bg-red-50 border-red-200' :
            notificationType === 'success' ? 'bg-green-50 border-green-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
              notificationType === 'error' ? 'bg-red-600' :
              notificationType === 'success' ? 'bg-green-600' :
              'bg-yellow-600'
            }`}>
              {notificationType === 'error' ? '!' : notificationType === 'success' ? '✓' : '⚠'}
            </div>
            <p className={notificationType === 'error' ? 'text-red-800' : 
                        notificationType === 'success' ? 'text-green-800' : 'text-yellow-800'}>
              {notificationMessage}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowNotificationModal(false)} variant="primary">
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar acción"
      >
        <div className="space-y-4">
          <p className="text-gray-700">{confirmMessage}</p>
          <div className="flex gap-3 justify-end">
            <Button 
              onClick={() => setShowConfirmModal(false)} 
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => confirmAction && confirmAction()} 
              variant="primary"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
