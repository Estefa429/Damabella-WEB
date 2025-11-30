// Datos de ejemplo para inicializar DAMABELLA

export const sampleProviders = [
  {
    id: 1,
    nombre: 'Textiles del Valle',
    contacto: 'María Fernández',
    telefono: '3001234567',
    email: 'contacto@textilesdelvalle.com',
    direccion: 'Calle 45 #23-10, Medellín',
    activo: true,
    fechaRegistro: new Date().toISOString().split('T')[0]
  },
  {
    id: 2,
    nombre: 'Modas y Diseños S.A.S',
    contacto: 'Carlos Rodríguez',
    telefono: '3109876543',
    email: 'ventas@modasydisenios.com',
    direccion: 'Carrera 70 #52-31, Bogotá',
    activo: true,
    fechaRegistro: new Date().toISOString().split('T')[0]
  },
  {
    id: 3,
    nombre: 'Telas Importadas Premium',
    contacto: 'Ana García',
    telefono: '3156789012',
    email: 'info@telaspremium.com',
    direccion: 'Avenida 5 #12-20, Cali',
    activo: true,
    fechaRegistro: new Date().toISOString().split('T')[0]
  }
];

export const sampleProducts = [
  // Vestidos Largos
  {
    id: 1,
    codigo: 'VL001',
    nombre: 'Vestido Largo Elegante Rosa',
    descripcion: 'Hermoso vestido largo en tono rosa pastel, perfecto para eventos especiales. Confeccionado en tela de alta calidad con caída suave y elegante.',
    categoria: 'Vestidos Largos',
    proveedor: 'Textiles del Valle',
    precioVenta: 189000,
    imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    material: 'Poliéster Premium',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Rosa', cantidad: 10 }, { color: 'Blanco', cantidad: 8 }] },
      { talla: 'S', colores: [{ color: 'Rosa', cantidad: 15 }, { color: 'Blanco', cantidad: 12 }] },
      { talla: 'M', colores: [{ color: 'Rosa', cantidad: 20 }, { color: 'Blanco', cantidad: 15 }] },
      { talla: 'L', colores: [{ color: 'Rosa', cantidad: 12 }, { color: 'Blanco', cantidad: 10 }] },
      { talla: 'XL', colores: [{ color: 'Rosa', cantidad: 8 }, { color: 'Blanco', cantidad: 6 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 2,
    codigo: 'VL002',
    nombre: 'Vestido Largo Floral Elegante',
    descripcion: 'Vestido largo con estampado floral delicado. Ideal para eventos de día y ocasiones especiales.',
    categoria: 'Vestidos Largos',
    proveedor: 'Modas y Diseños S.A.S',
    precioVenta: 215000,
    imagen: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
    material: 'Seda Sintética',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Azul', cantidad: 8 }, { color: 'Verde', cantidad: 6 }] },
      { talla: 'S', colores: [{ color: 'Azul', cantidad: 12 }, { color: 'Verde', cantidad: 10 }] },
      { talla: 'M', colores: [{ color: 'Azul', cantidad: 18 }, { color: 'Verde', cantidad: 15 }] },
      { talla: 'L', colores: [{ color: 'Azul', cantidad: 10 }, { color: 'Verde', cantidad: 8 }] },
      { talla: 'XL', colores: [{ color: 'Azul', cantidad: 6 }, { color: 'Verde', cantidad: 5 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 3,
    codigo: 'VL003',
    nombre: 'Vestido Largo Negro Sofisticado',
    descripcion: 'Vestido largo negro de corte elegante. Perfecto para eventos nocturnos y ocasiones formales.',
    categoria: 'Vestidos Largos',
    proveedor: 'Telas Importadas Premium',
    precioVenta: 245000,
    imagen: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800',
    material: 'Algodón Premium',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Negro', cantidad: 12 }] },
      { talla: 'S', colores: [{ color: 'Negro', cantidad: 18 }] },
      { talla: 'M', colores: [{ color: 'Negro', cantidad: 25 }] },
      { talla: 'L', colores: [{ color: 'Negro', cantidad: 15 }] },
      { talla: 'XL', colores: [{ color: 'Negro', cantidad: 10 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },

  // Vestidos Cortos
  {
    id: 4,
    codigo: 'VC001',
    nombre: 'Vestido Corto Rosa Casual',
    descripcion: 'Vestido corto en tono rosa vibrante, ideal para salidas casuales y eventos diurnos.',
    categoria: 'Vestidos Cortos',
    proveedor: 'Textiles del Valle',
    precioVenta: 135000,
    imagen: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800',
    material: 'Algodón',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Rosa', cantidad: 15 }, { color: 'Beige', cantidad: 10 }] },
      { talla: 'S', colores: [{ color: 'Rosa', cantidad: 20 }, { color: 'Beige', cantidad: 15 }] },
      { talla: 'M', colores: [{ color: 'Rosa', cantidad: 25 }, { color: 'Beige', cantidad: 20 }] },
      { talla: 'L', colores: [{ color: 'Rosa', cantidad: 15 }, { color: 'Beige', cantidad: 12 }] },
      { talla: 'XL', colores: [{ color: 'Rosa', cantidad: 10 }, { color: 'Beige', cantidad: 8 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 5,
    codigo: 'VC002',
    nombre: 'Vestido Corto Estampado Verano',
    descripcion: 'Vestido corto con estampado tropical, perfecto para el verano y ocasiones informales.',
    categoria: 'Vestidos Cortos',
    proveedor: 'Modas y Diseños S.A.S',
    precioVenta: 125000,
    imagen: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
    material: 'Lino',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Amarillo', cantidad: 10 }, { color: 'Blanco', cantidad: 12 }] },
      { talla: 'S', colores: [{ color: 'Amarillo', cantidad: 18 }, { color: 'Blanco', cantidad: 20 }] },
      { talla: 'M', colores: [{ color: 'Amarillo', cantidad: 22 }, { color: 'Blanco', cantidad: 25 }] },
      { talla: 'L', colores: [{ color: 'Amarillo', cantidad: 12 }, { color: 'Blanco', cantidad: 15 }] },
      { talla: 'XL', colores: [{ color: 'Amarillo', cantidad: 8 }, { color: 'Blanco', cantidad: 10 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 6,
    codigo: 'VC003',
    nombre: 'Vestido Corto Azul Marino',
    descripcion: 'Vestido corto en tono azul marino con detalles elegantes. Versátil para diferentes ocasiones.',
    categoria: 'Vestidos Cortos',
    proveedor: 'Telas Importadas Premium',
    precioVenta: 149000,
    imagen: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
    material: 'Poliéster',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Azul', cantidad: 12 }] },
      { talla: 'S', colores: [{ color: 'Azul', cantidad: 18 }] },
      { talla: 'M', colores: [{ color: 'Azul', cantidad: 22 }] },
      { talla: 'L', colores: [{ color: 'Azul', cantidad: 14 }] },
      { talla: 'XL', colores: [{ color: 'Azul', cantidad: 10 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },

  // Sets
  {
    id: 7,
    codigo: 'SET001',
    nombre: 'Set Blusa y Pantalón Elegante',
    descripcion: 'Conjunto de dos piezas: blusa con mangas acampanadas y pantalón de tiro alto. Perfecto para la oficina.',
    categoria: 'Sets',
    proveedor: 'Textiles del Valle',
    precioVenta: 175000,
    imagen: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
    material: 'Algodón-Poliéster',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Blanco', cantidad: 10 }, { color: 'Negro', cantidad: 12 }] },
      { talla: 'S', colores: [{ color: 'Blanco', cantidad: 15 }, { color: 'Negro', cantidad: 18 }] },
      { talla: 'M', colores: [{ color: 'Blanco', cantidad: 20 }, { color: 'Negro', cantidad: 22 }] },
      { talla: 'L', colores: [{ color: 'Blanco', cantidad: 12 }, { color: 'Negro', cantidad: 15 }] },
      { talla: 'XL', colores: [{ color: 'Blanco', cantidad: 8 }, { color: 'Negro', cantidad: 10 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 8,
    codigo: 'SET002',
    nombre: 'Set Deportivo Rosa',
    descripcion: 'Conjunto deportivo de dos piezas en tono rosa. Ideal para hacer ejercicio con estilo.',
    categoria: 'Sets',
    proveedor: 'Modas y Diseños S.A.S',
    precioVenta: 145000,
    imagen: 'https://images.unsplash.com/photo-1556906918-5ccce0dd6966?w=800',
    material: 'Lycra Deportiva',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Rosa', cantidad: 15 }, { color: 'Gris', cantidad: 12 }] },
      { talla: 'S', colores: [{ color: 'Rosa', cantidad: 22 }, { color: 'Gris', cantidad: 18 }] },
      { talla: 'M', colores: [{ color: 'Rosa', cantidad: 28 }, { color: 'Gris', cantidad: 25 }] },
      { talla: 'L', colores: [{ color: 'Rosa', cantidad: 18 }, { color: 'Gris', cantidad: 15 }] },
      { talla: 'XL', colores: [{ color: 'Rosa', cantidad: 12 }, { color: 'Gris', cantidad: 10 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 9,
    codigo: 'SET003',
    nombre: 'Set Casual Verano',
    descripcion: 'Conjunto casual de top y falda midi. Perfecto para días soleados.',
    categoria: 'Sets',
    proveedor: 'Telas Importadas Premium',
    precioVenta: 165000,
    imagen: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc94e?w=800',
    material: 'Lino',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Beige', cantidad: 10 }, { color: 'Blanco', cantidad: 8 }] },
      { talla: 'S', colores: [{ color: 'Beige', cantidad: 15 }, { color: 'Blanco', cantidad: 12 }] },
      { talla: 'M', colores: [{ color: 'Beige', cantidad: 20 }, { color: 'Blanco', cantidad: 18 }] },
      { talla: 'L', colores: [{ color: 'Beige', cantidad: 12 }, { color: 'Blanco', cantidad: 10 }] },
      { talla: 'XL', colores: [{ color: 'Beige', cantidad: 8 }, { color: 'Blanco', cantidad: 6 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },

  // Enterizos
  {
    id: 10,
    codigo: 'ENT001',
    nombre: 'Enterizo Elegante Negro',
    descripcion: 'Enterizo sofisticado en color negro con piernas anchas. Ideal para eventos formales.',
    categoria: 'Enterizos',
    proveedor: 'Textiles del Valle',
    precioVenta: 195000,
    imagen: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800',
    material: 'Crepe',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Negro', cantidad: 12 }, { color: 'Rojo', cantidad: 8 }] },
      { talla: 'S', colores: [{ color: 'Negro', cantidad: 18 }, { color: 'Rojo', cantidad: 12 }] },
      { talla: 'M', colores: [{ color: 'Negro', cantidad: 25 }, { color: 'Rojo', cantidad: 15 }] },
      { talla: 'L', colores: [{ color: 'Negro', cantidad: 15 }, { color: 'Rojo', cantidad: 10 }] },
      { talla: 'XL', colores: [{ color: 'Negro', cantidad: 10 }, { color: 'Rojo', cantidad: 6 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 11,
    codigo: 'ENT002',
    nombre: 'Enterizo Casual Denim',
    descripcion: 'Enterizo en tela denim con cinturón. Perfecto para un look casual pero elegante.',
    categoria: 'Enterizos',
    proveedor: 'Modas y Diseños S.A.S',
    precioVenta: 168000,
    imagen: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
    material: 'Denim',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Azul', cantidad: 10 }] },
      { talla: 'S', colores: [{ color: 'Azul', cantidad: 18 }] },
      { talla: 'M', colores: [{ color: 'Azul', cantidad: 22 }] },
      { talla: 'L', colores: [{ color: 'Azul', cantidad: 15 }] },
      { talla: 'XL', colores: [{ color: 'Azul', cantidad: 10 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  },
  {
    id: 12,
    codigo: 'ENT003',
    nombre: 'Enterizo Floral Verano',
    descripcion: 'Enterizo con estampado floral delicado. Perfecto para la temporada de verano.',
    categoria: 'Enterizos',
    proveedor: 'Telas Importadas Premium',
    precioVenta: 185000,
    imagen: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
    material: 'Viscosa',
    variantes: [
      { talla: 'XS', colores: [{ color: 'Rosa', cantidad: 8 }, { color: 'Verde', cantidad: 6 }] },
      { talla: 'S', colores: [{ color: 'Rosa', cantidad: 15 }, { color: 'Verde', cantidad: 12 }] },
      { talla: 'M', colores: [{ color: 'Rosa', cantidad: 20 }, { color: 'Verde', cantidad: 15 }] },
      { talla: 'L', colores: [{ color: 'Rosa', cantidad: 12 }, { color: 'Verde', cantidad: 10 }] },
      { talla: 'XL', colores: [{ color: 'Rosa', cantidad: 8 }, { color: 'Verde', cantidad: 6 }] }
    ],
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
  }
];

export const sampleCategories = [
  { id: 1, name: 'Vestidos Largos', description: 'Vestidos elegantes de largo completo', active: true, color: 'from-pink-500 to-rose-600' },
  { id: 2, name: 'Vestidos Cortos', description: 'Vestidos casuales y formales de corte corto', active: true, color: 'from-purple-500 to-pink-600' },
  { id: 3, name: 'Sets', description: 'Conjuntos coordinados de dos piezas', active: true, color: 'from-indigo-500 to-purple-600' },
  { id: 4, name: 'Enterizos', description: 'Prendas de una sola pieza elegantes y versátiles', active: true, color: 'from-violet-500 to-purple-600' }
];

export const sampleColors = [
  { nombre: 'Rosa', hex: '#FFB6C1' },
  { nombre: 'Azul', hex: '#4A90E2' },
  { nombre: 'Negro', hex: '#000000' },
  { nombre: 'Blanco', hex: '#FFFFFF' },
  { nombre: 'Rojo', hex: '#DC2626' },
  { nombre: 'Verde', hex: '#10B981' },
  { nombre: 'Amarillo', hex: '#FBBF24' },
  { nombre: 'Gris', hex: '#6B7280' },
  { nombre: 'Beige', hex: '#D4A574' },
  { nombre: 'Café', hex: '#92400E' },
  { nombre: 'Dorado', hex: '#F59E0B' },
  { nombre: 'Plata', hex: '#9CA3AF' }
];

export const sampleSizes = [
  { nombre: 'XS' },
  { nombre: 'S' },
  { nombre: 'M' },
  { nombre: 'L' },
  { nombre: 'XL' }
];

// Función para inicializar datos de ejemplo si no existen
export function initializeSampleData() {
  // Solo inicializar si no hay productos existentes
  const existingProducts = localStorage.getItem('damabella_productos');
  
  if (!existingProducts || JSON.parse(existingProducts).length === 0) {
    localStorage.setItem('damabella_productos', JSON.stringify(sampleProducts));
    localStorage.setItem('damabella_proveedores', JSON.stringify(sampleProviders));
    localStorage.setItem('damabella_categorias', JSON.stringify(sampleCategories));
    localStorage.setItem('damabella_colors', JSON.stringify(sampleColors));
    localStorage.setItem('damabella_sizes', JSON.stringify(sampleSizes));
    
    console.log('✅ Datos de ejemplo inicializados correctamente');
    return true;
  }
  
  return false;
}
