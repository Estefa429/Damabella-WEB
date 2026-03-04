import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Eye, X, Trash2, Ban, AlertTriangle } from 'lucide-react';
import { Button, Input, Modal } from '../../../shared/components/native';
import ImageUploader from '../../../shared/components/native/image-uploader';
import { ProveedoresManager } from '../../suppliers/components/ProveedoresManager';


const compactInput = "h-9 px-3 py-1.5 text-xs";
const compactSelect = "h-9 px-3 py-1.5 text-xs";
const compactLabel = "text-xs mb-1";
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

  const agregarTallaGlobal = (tallaRaw: string) => {
    const tallaNormalizada = String(tallaRaw || '').trim().toUpperCase();
    if (!tallaNormalizada) return;
    if (tallas.includes(tallaNormalizada)) return;
    const updated = [...tallas, tallaNormalizada];
    setTallas(updated);
    localStorage.setItem('damabella_tallas', JSON.stringify(updated));
  };

  const eliminarTallaGlobal = (talla: string) => {
    const target = String(talla || '').trim().toUpperCase();
    if (!target) return;
    const updated = tallas.filter((t) => String(t).trim().toUpperCase() !== target);
    setTallas(updated);
    localStorage.setItem('damabella_tallas', JSON.stringify(updated));
    if (String(nuevoItem.talla || '').trim().toUpperCase() === target) {
      setNuevoItem((prev) => ({ ...prev, talla: '' }));
    }
  };

  const agregarColorGlobal = (colorRaw: string) => {
    const colorNormalizado = String(colorRaw || '').trim();
    if (!colorNormalizado) return;
    const existe = coloresDisponibles.some((c) => c.toLowerCase() === colorNormalizado.toLowerCase());
    if (existe) return;
    const updated = [...coloresDisponibles, colorNormalizado];
    setColoresDisponibles(updated);
    localStorage.setItem('damabella_colores', JSON.stringify(updated.map((name) => ({ name }))));
  };

  const eliminarColorGlobal = (color: string) => {
    const target = String(color || '').trim().toLowerCase();
    if (!target) return;
    const updated = coloresDisponibles.filter((c) => String(c).trim().toLowerCase() !== target);
    setColoresDisponibles(updated);
    localStorage.setItem('damabella_colores', JSON.stringify(updated.map((name) => ({ name }))));
    if (String(nuevoItem.color || '').trim().toLowerCase() === target) {
      setNuevoItem((prev) => ({ ...prev, color: '' }));
    }
  };

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
  const [proveedorModalKey, setProveedorModalKey] = useState(0);
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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

  // Resetear página cuando cambia el búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    setShowProveedorModal(false);
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

  const eliminarCompra = (id: number) => {
    const compraAEliminar = compras.find(c => c.id === id);
    if (!compraAEliminar) {
      setNotificationMessage('❌ Compra no encontrada');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    setConfirmMessage(`¿Está seguro de eliminar la compra ${compraAEliminar.numeroCompra}?\n\nEsta acción no se puede deshacer.`);
    setConfirmAction(() => () => {
      setCompras(compras.filter(c => c.id !== id));
      setShowConfirmModal(false);
      setNotificationMessage(`✅ Compra ${compraAEliminar.numeroCompra} eliminada correctamente.`);
      setNotificationType('success');
      setShowNotificationModal(true);
    });
    setShowConfirmModal(true);
  };

  const filteredCompras = compras.filter(c =>
    (c.numeroCompra?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (c.proveedorNombre?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompras = filteredCompras.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Compras</h2>
          <p className="text-gray-600">Administra las compras a proveedores</p>
        </div>
        <Button onClick={handleCreate} variant="primary" size="lg">
          <Plus size={20} />
          Agregar Compra
        </Button>
      </div>

      {/* 🔒 Historial de Compras por Proveedor */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${!proveedorSeleccionadoHistorial ? 'hidden' : ''}`}>
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
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
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
                    <Truck className="mx-auto mb-2 text-gray-300" size={48} />
                    <p>No se encontraron compras</p>
                  </td>
                </tr>
              ) : (
                paginatedCompras.map((compra) => (
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
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
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
                            <>
                              <button
                                onClick={() => { if (!isAnulada) anularCompra(compra.id); }}
                                className={`p-2 rounded-lg transition-colors ${isAnulada ? 'text-red-400 opacity-50 cursor-not-allowed' : 'hover:bg-red-50 text-red-600'}`}
                                title="Anular compra"
                                disabled={isAnulada}
                                aria-disabled={isAnulada}
                              >
                                <Ban size={18} />
                              </button>
                              <button
                                onClick={() => eliminarCompra(compra.id)}
                                className="p-2 rounded-lg transition-colors hover:bg-red-50 text-red-600"
                                title="Eliminar compra"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
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

        {/* Pagination Controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-lg">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, filteredCompras.length)}</span> de <span className="font-medium">{filteredCompras.length}</span> compras
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const page = startPage + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nueva Compra */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Compra"
        size="xxl"
        noScroll
      >
        <div className="w-[95vw] max-w-[1400px] max-h-[90vh] mx-auto flex flex-col text-[10px] leading-tight">
          {/* SECCIÓN 1: HEADER (FIJO) */}
          <div className="border border-gray-200 rounded-md bg-white p-2 shrink-0">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
            <div>
              <label className="block text-gray-700 mb-0.5 text-[10px]">Proveedor *</label>
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
                  className={`w-full h-7 px-2 border rounded-md focus:outline-none text-[10px] ${formErrors.proveedorId ? 'border-red-500' : 'border-gray-300'}`}
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
              {/* Botón para abrir el modal de Proveedores y agregar uno nuevo */}

              <button
                type="button"
                onClick={() => {
                  setShowProveedorModal(true);
                  setProveedorModalKey(prev => prev + 1);
                }}
                className="mt-1.5 w-full h-6 px-2 border border-gray-300 text-gray-700 rounded-md text-[10px] font-medium hover:bg-gray-50 transition-colors"
              >
                + Agregar nuevo proveedor
              </button>
              {formErrors.proveedorId && (
                <p className="text-red-600 text-xs mt-1">{formErrors.proveedorId}</p>
              )}
            </div>

            {/* Montar ProveedoresManager solo cuando el estado lo pida. Se usa onlyModal para mostrar únicamente el modal existente */}
            {showProveedorModal && (
              <ProveedoresManager key={proveedorModalKey} onlyModal openOnMount />
            )}

            <div>
              <label className="block text-gray-700 mb-0.5 text-[10px]">Fecha de Compra *</label>
              <div className="w-full">
                <Input
                  type="date"
                  value={formData.fechaCompra}
                  onChange={(e) => handleFieldChange('fechaCompra', e.target.value)}
                  className={`${formErrors.fechaCompra ? 'border-red-500' : ''} h-7 text-[10px] px-2`}
                  required
                  readOnly
                />
              </div>

              {formErrors.fechaCompra && (
                <p className="text-red-600 text-xs mt-1">{formErrors.fechaCompra}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-0.5 text-[10px]">IVA (%) *</label>

              <div className="w-full">
                <Input
                  type="number"
                  value={formData.iva}
                  onChange={(e) => handleFieldChange('iva', e.target.value)}
                  placeholder="19"
                  className={`${formErrors.iva ? 'border-red-500' : ''} h-7 text-[10px] px-2`}
                  required
                />
              </div>

              {formErrors.iva && (
                <p className="text-red-600 text-xs mt-1">{formErrors.iva}</p>
              )}
            </div>
            </div>
            </div>
          </div>
          {/* Cierre Header */}

          {/* SECCIÓN 2: BODY (SCROLLEABLE) */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-2 min-h-0">
            <div className="border border-gray-200 rounded-md bg-white p-2">
              <div className="max-w-5xl mx-auto">
          {/* Agregar productos */}
            <h4 className="text-gray-900 text-[10px] font-semibold mb-2">Agregar productos</h4>
            
            {itemsError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-[10px] flex items-center gap-2">
                <AlertTriangle size={14} />
                {itemsError}
              </div>
            )}
            
            {/* FILA 1: Producto, Talla, Color, Cantidad, Botón */}
            <div className="bg-gray-50 rounded-md p-2 mb-2 border border-gray-200">
              <div className="flex gap-2 items-center">
                {/* Producto - FLEX 1 */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Producto"
                    value={nuevoItem.productoNombre}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProductoSearchTerm(value);
                      setShowProductoDropdown(true);
                      
                      const sel = productos.find(
                        (p: any) => p.activo && normalizarNombreProducto(p.nombre) === normalizarNombreProducto(value)
                      );

                      if (!sel) {
                        setNuevoItem({
                          ...nuevoItem,
                          productoId: '',
                          productoNombre: value,
                          referencia: ''
                        });
                        return;
                      }

                      const val = String(sel.id);
                      let categoriaIdFinal = sel.categoryId || '';
                      let categoriaNombreFinal = '';
                      if (categoriaIdFinal) {
                        const catFound = categorias.find(c => String(c.id) === String(categoriaIdFinal));
                        categoriaNombreFinal = catFound?.name || '';
                      }

                      let precioCompraStr = '';
                      let precioVentaStr = '';
                      let imagenUrl = sel.imagen || sel.image || sel.imagenUrl || '';
                      let tallaFound = '';
                      let colorFound = '';
                      let proveedorIdFound = '';
                      let proveedorNombreFound = '';

                      try {
                        const comprasOrdenadas = compras.slice().sort((a: any, b: any) => {
                          const ta = new Date(a.createdAt || a.fechaRegistro || 0).getTime();
                          const tb = new Date(b.createdAt || b.fechaRegistro || 0).getTime();
                          return tb - ta;
                        });

                        for (const c of comprasOrdenadas) {
                          const found = (c.items || []).find(
                            (i: any) =>
                              String(i.productoId) === String(val) ||
                              normalizarNombreProducto(i.productoNombre) === normalizarNombreProducto(sel.nombre)
                          );
                          if (found) {
                            if (!tallaFound && found.talla) tallaFound = found.talla;
                            if (!colorFound && found.color) colorFound = found.color;
                            if (!proveedorIdFound) {
                              proveedorIdFound = c.proveedorId || '';
                              proveedorNombreFound =
                                c.proveedorNombre ||
                                (proveedores.find((p: any) => String(p.id) === String(c.proveedorId))?.nombre) ||
                                '';
                            }

                            if (found.precioCompra && !precioCompraStr) {
                              precioCompraStr = String(found.precioCompra);
                              break;
                            }
                          }
                        }

                        if (!precioCompraStr) {
                          const precios = compras
                            .flatMap((c: any) =>
                              (c.items || [])
                                .filter(
                                  (i: any) =>
                                    String(i.productoId) === String(val) ||
                                    normalizarNombreProducto(i.productoNombre) === normalizarNombreProducto(sel.nombre)
                                )
                                .map((i: any) => Number(i.precioCompra) || 0)
                            )
                            .filter((p: number) => p > 0);

                          if (precios.length > 0) {
                            const avg = precios.reduce((s: number, x: number) => s + x, 0) / precios.length;
                            precioCompraStr = String(Math.round(avg * 100) / 100);
                          }
                        }

                        if (!precioCompraStr && sel.precioCompra) precioCompraStr = String(sel.precioCompra);
                        if (sel.precioVenta) precioVentaStr = String(sel.precioVenta);
                        else if (sel.precio) precioVentaStr = String(sel.precio);
                      } catch (err) {
                        console.warn('Error calculando precios previos para producto seleccionado', err);
                      }

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

                      if (typeof tallaFound !== 'undefined' && tallaFound) updatedNuevo.talla = tallaFound;
                      if (typeof colorFound !== 'undefined' && colorFound) updatedNuevo.color = colorFound;

                      setNuevoItem(updatedNuevo);

                      if (typeof proveedorIdFound !== 'undefined' && proveedorIdFound) {
                        setFormData({ ...formData, proveedorId: proveedorIdFound, proveedorNombre: proveedorNombreFound });
                        setProveedorSearchTerm(proveedorNombreFound || '');
                      }
                    }}
                    onFocus={() => setShowProductoDropdown(true)}
                    className="w-full h-7 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px]"
                  />
                  {showProductoDropdown && (
                    <div className="absolute z-[9999] mt-1 w-full max-h-40 bg-white border border-gray-200 rounded-md shadow-md overflow-y-auto">
                      {productos.filter((p: any) => p.activo && normalizarNombreProducto(p.nombre).includes(normalizarNombreProducto(nuevoItem.productoNombre))).length === 0 ? (
                        <div className="px-2 py-1.5 text-[10px] text-gray-500">No hay resultados</div>
                      ) : (
                        productos
                          .filter((p: any) => p.activo && normalizarNombreProducto(p.nombre).includes(normalizarNombreProducto(nuevoItem.productoNombre)))
                          .map((producto: any) => (
                            <button
                              type="button"
                              key={producto.id}
                              className="w-full text-left px-2 py-1 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                const valor_sel = String(producto.id);
                                let categoriaIdFinal = producto.categoryId || '';
                                let categoriaNombreFinal = '';
                                if (categoriaIdFinal) {
                                  const catFound = categorias.find(c => String(c.id) === String(categoriaIdFinal));
                                  categoriaNombreFinal = catFound?.name || '';
                                }

                                let precioCompraStr = '';
                                let precioVentaStr = '';
                                let imagenUrl = producto.imagen || producto.image || producto.imagenUrl || '';
                                let tallaFound = '';
                                let colorFound = '';
                                let proveedorIdFound = '';
                                let proveedorNombreFound = '';

                                try {
                                  const comprasOrdenadas = compras.slice().sort((a: any, b: any) => {
                                    const ta = new Date(a.createdAt || a.fechaRegistro || 0).getTime();
                                    const tb = new Date(b.createdAt || b.fechaRegistro || 0).getTime();
                                    return tb - ta;
                                  });

                                  for (const c of comprasOrdenadas) {
                                    const found = (c.items || []).find(
                                      (i: any) =>
                                        String(i.productoId) === String(valor_sel) ||
                                        normalizarNombreProducto(i.productoNombre) === normalizarNombreProducto(producto.nombre)
                                    );
                                    if (found) {
                                      if (!tallaFound && found.talla) tallaFound = found.talla;
                                      if (!colorFound && found.color) colorFound = found.color;
                                      if (!proveedorIdFound) {
                                        proveedorIdFound = c.proveedorId || '';
                                        proveedorNombreFound =
                                          c.proveedorNombre ||
                                          (proveedores.find((p: any) => String(p.id) === String(c.proveedorId))?.nombre) ||
                                          '';
                                      }

                                      if (found.precioCompra && !precioCompraStr) {
                                        precioCompraStr = String(found.precioCompra);
                                        break;
                                      }
                                    }
                                  }

                                  if (!precioCompraStr) {
                                    const precios = compras
                                      .flatMap((c: any) =>
                                        (c.items || [])
                                          .filter(
                                            (i: any) =>
                                              String(i.productoId) === String(valor_sel) ||
                                              normalizarNombreProducto(i.productoNombre) === normalizarNombreProducto(producto.nombre)
                                          )
                                          .map((i: any) => Number(i.precioCompra) || 0)
                                      )
                                      .filter((p: number) => p > 0);

                                    if (precios.length > 0) {
                                      const avg = precios.reduce((s: number, x: number) => s + x, 0) / precios.length;
                                      precioCompraStr = String(Math.round(avg * 100) / 100);
                                    }
                                  }

                                  if (!precioCompraStr && producto.precioCompra) precioCompraStr = String(producto.precioCompra);
                                  if (producto.precioVenta) precioVentaStr = String(producto.precioVenta);
                                  else if (producto.precio) precioVentaStr = String(producto.precio);
                                } catch (err) {
                                  console.warn('Error con dropdown producto', err);
                                }

                                setNuevoItem({
                                  ...nuevoItem,
                                  productoId: valor_sel,
                                  productoNombre: producto.nombre,
                                  categoriaId: categoriaIdFinal,
                                  categoriaNombre: categoriaNombreFinal,
                                  referencia: producto.referencia || '',
                                  precioCompra: precioCompraStr,
                                  precioVenta: precioVentaStr,
                                  imagen: imagenUrl || '',
                                  talla: tallaFound || '',
                                  color: colorFound || ''
                                });

                                if (proveedorIdFound) {
                                  setFormData({ ...formData, proveedorId: proveedorIdFound, proveedorNombre: proveedorNombreFound });
                                  setProveedorSearchTerm(proveedorNombreFound || '');
                                }

                                setShowProductoDropdown(false);
                              }}
                            >
                              <div className="text-[10px] text-gray-900 font-medium">{producto.nombre}</div>
                              <div className="text-[10px] text-gray-500">
                                {producto.referencia ? `REF: ${producto.referencia}` : 'Sin referencia'}
                                {producto.precioCompra ? ` • $${Number(producto.precioCompra).toLocaleString()}` : ''}
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>

                {/* Talla - W-24 */}
                <div className="w-24">
                  {(() => {
                    const tallaNormalizada = (nuevoItem.talla || '').trim().toUpperCase();
                    const tallaExiste = !!tallaNormalizada && tallas.includes(tallaNormalizada);
                    const agregarNuevaTalla = () => {
                      if (!tallaNormalizada || tallaExiste) return;
                      agregarTallaGlobal(tallaNormalizada);
                      setNuevoItem({ ...nuevoItem, talla: tallaNormalizada });
                    };
                    return (
                      <input
                        type="text"
                        list="tallas-existentes"
                        placeholder="Talla"
                        value={nuevoItem.talla}
                        onChange={(e) => setNuevoItem({ ...nuevoItem, talla: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarNuevaTalla(); } }}
                        className="w-full h-7 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px]"
                      />
                    );
                  })()}
                  <datalist id="tallas-existentes">
                    {tallas.map((talla) => (<option key={talla} value={talla} />))}
                  </datalist>
                </div>

                {/* Color - W-24 */}
                <div className="w-24">
                  <input
                    type="text"
                    list="colores-existentes"
                    placeholder="Color"
                    value={nuevoItem.color}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, color: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const colorNormalizado = (nuevoItem.color || '').trim();
                        const colorExiste = !!colorNormalizado && coloresDisponibles.some((c) => c.toLowerCase() === colorNormalizado.toLowerCase());
                        if (!colorNormalizado || colorExiste) return;
                        agregarColorGlobal(colorNormalizado);
                      }
                    }}
                    className={`w-full h-7 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px] ${formErrors?.color ? 'border-red-500' : ''}`}
                  />
                  <datalist id="colores-existentes">
                    {Array.from(new Set([...Object.keys(COLOR_MAP), ...coloresDisponibles])).map((color) => (<option key={color} value={color} />))}
                  </datalist>
                </div>

                {/* Cantidad - W-20 */}
                <div className="w-20">
                  <Input
                    type="number"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: e.target.value })}
                    placeholder="Cant."
                    className="w-full h-7 px-2 text-[10px]"
                  />
                </div>

                {/* Botón Agregar */}
                <Button onClick={() => {
                  const selectValue = categoriaSelectRef.current?.value || '';
                  const cat = categorias.find(c => c.id === selectValue);
                  if (selectValue && !nuevoItem.categoriaId) {
                    const updatedItem = { ...nuevoItem, categoriaId: selectValue, categoriaNombre: cat?.name || '' };
                    setNuevoItem(updatedItem);
                  }
                  agregarItem();
                }} variant="secondary" className="h-7 px-3 text-[10px] whitespace-nowrap">
                  <Plus size={14} />
                  Agregar
                </Button>
              </div>
            </div>

            {/* FILA 2: Precios, Categoría, Imagen */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-2">
              <div>
                <label className="block text-gray-700 mb-1 text-[10px]">Precio compra</label>
                <Input
                  type="number"
                  value={nuevoItem.precioCompra}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, precioCompra: e.target.value })}
                  placeholder="0"
                  readOnly={!!nuevoItem.productoId}
                  className="h-6 text-[10px] px-2"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 text-[10px]">Precio venta</label>
                <Input
                  type="number"
                  value={nuevoItem.precioVenta}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, precioVenta: e.target.value })}
                  placeholder="0"
                  className="h-6 text-[10px] px-2"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 text-[10px]">Categoría</label>
                <select
                  ref={categoriaSelectRef}
                  value={nuevoItem.categoriaId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const cat = categorias.find(c => c.id === id);
                    setNuevoItem(prev => ({
                      ...prev,
                      categoriaId: id,
                      categoriaNombre: cat?.name || ''
                    }));
                  }}
                  className="w-full h-6 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-[10px]"
                >
                  <option value="">Categoría...</option>
                  {categorias.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 text-[10px]">Imagen</label>
                <div className="w-full">
                  <ImageUploader
                    value={nuevoItem.imagen}
                    onChange={(b64) => setNuevoItem({ ...nuevoItem, imagen: b64 })}
                  />
                </div>
              </div>
            </div>

            {/* Lista de productos agregados */}
            {formData.items.length > 0 && (
              <div className="border border-gray-200 rounded-md overflow-hidden overflow-x-auto mt-2">
                <table className="w-full text-[10px] leading-tight">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-1.5 px-2 text-gray-600">Producto</th>
                      <th className="text-left py-1.5 px-2 text-gray-600">Categoría</th>
                      <th className="text-left py-1.5 px-2 text-gray-600">Talla</th>
                      <th className="text-left py-1.5 px-2 text-gray-600">Color</th>
                      <th className="text-right py-1.5 px-2 text-gray-600">Cant.</th>
                      <th className="text-right py-1.5 px-2 text-gray-600">P. Compra</th>
                      <th className="text-right py-1.5 px-2 text-gray-600">P. Venta</th>
                      <th className="text-right py-1.5 px-2 text-gray-600">Subtotal</th>
                      <th className="py-1.5 px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.map((item) => {
                      const colorHex = (COLOR_MAP as any)[item.color] || item.color;
                      return (
                      <tr key={item.id}>
                        <td className="py-1.5 px-2 text-gray-900">{item.productoNombre}</td>
                        <td className="py-1.5 px-2 text-gray-700">
                          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {item.categoriaNombre || '⚠️ ERROR: Sin asignar'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-gray-700">{item.talla || '-'}</td>
                        <td className="py-1.5 px-2 text-gray-700">
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
                        <td className="py-1.5 px-2 text-right text-gray-700 tabular-nums">{item.cantidad}</td>
                        <td className="py-1.5 px-2 text-right text-gray-700 tabular-nums">${(item.precioCompra || 0).toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-right text-gray-700 tabular-nums">${(item.precioVenta || 0).toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-right text-gray-900 tabular-nums">${(item.subtotal || 0).toLocaleString()}</td>
                        <td className="py-1.5 px-2">
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

              </div>
            </div>
          </div>

          {/* SECCIÓN 3: TOTALES Y BOTONES (STICKY) */}
          <div className="sticky bottom-0 bg-white/95 border-t border-gray-200 pt-2 mt-0 shrink-0">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-end">
                <div className="rounded-md bg-gray-50 border border-gray-200 p-2">
                  <div className="flex justify-between text-gray-600 text-[10px]">
                    <span>Subtotal:</span>
                    <span className="tabular-nums font-medium">${calcularSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-[10px] mt-1">
                    <span>IVA ({formData.iva}%):</span>
                    <span className="tabular-nums font-medium">${calcularIVA().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 text-[11px] font-semibold mt-2 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="tabular-nums">${calcularTotal().toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setShowModal(false)} variant="secondary" className="h-6 px-3 text-[10px]">Cancelar</Button>
                  <Button onClick={handleSave} variant="primary" className="h-6 px-3 text-[10px]">Crear Compra</Button>
                </div>
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
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
