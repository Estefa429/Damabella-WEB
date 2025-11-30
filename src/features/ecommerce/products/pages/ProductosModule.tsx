import { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  Input,
  Textarea,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '../../../../components/ui';
import { DataTable } from '../../../../shared/components/native/DataTable';

interface User {
  id: string;
  nombre: string;
  rol: 'Administrador' | 'Usuario';
}

interface ProductosProps {
  user: User;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock: number;
  imagen?: string;
  colores: string[];
  tallas: string[];
}

const mockProductos: Producto[] = [
  {
    id: '1',
    nombre: 'Vestido Largo Negro Elegante',
    descripcion: 'Vestido de gala largo en color negro con detalles bordados',
    categoria: 'Vestidos Largos',
    precio: 350000,
    stock: 15,
    colores: ['Negro'],
    tallas: ['S', 'M', 'L'],
  },
  {
    id: '2',
    nombre: 'Vestido Corto Rojo Casual',
    descripcion: 'Vestido corto de coctel en tono rojo vibrante',
    categoria: 'Vestidos Cortos',
    precio: 220000,
    stock: 8,
    colores: ['Rojo'],
    tallas: ['S', 'M'],
  },
  {
    id: '3',
    nombre: 'Set Blanco Coordinado',
    descripcion: 'Conjunto de dos piezas en blanco, perfecto para verano',
    categoria: 'Sets',
    precio: 280000,
    stock: 12,
    colores: ['Blanco', 'Beige'],
    tallas: ['S', 'M', 'L', 'XL'],
  },
  {
    id: '4',
    nombre: 'Enterizo Azul Marino',
    descripcion: 'Jumpsuit elegante en azul marino con cinturón',
    categoria: 'Enterizos',
    precio: 310000,
    stock: 5,
    colores: ['Azul Marino'],
    tallas: ['M', 'L'],
  },
];

export function Productos({ user }: ProductosProps) {
  const [productos, setProductos] = useState<Producto[]>(() => {
    const stored = localStorage.getItem('damabella_productos');
    return stored ? JSON.parse(stored) : mockProductos;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: '',
    stock: '',
    imagen: '',
  });

  const canDelete = user.rol === 'Administrador';

  useEffect(() => {
    localStorage.setItem('damabella_productos', JSON.stringify(productos));
  }, [productos]);

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === 'todas' || producto.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const handleAdd = () => {
    setEditMode(false);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: '',
      precio: '',
      stock: '',
      imagen: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (producto: Producto) => {
    setEditMode(true);
    setSelectedProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      precio: String(producto.precio),
      stock: String(producto.stock),
      imagen: producto.imagen || '',
    });
    setDialogOpen(true);
  };

  const handleView = (producto: Producto) => {
    setSelectedProducto(producto);
    setViewDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode && selectedProducto) {
      setProductos(
        productos.map((p) =>
          p.id === selectedProducto.id
            ? {
                ...p,
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                categoria: formData.categoria,
                precio: Number(formData.precio),
                stock: Number(formData.stock),
                imagen: formData.imagen,
              }
            : p
        )
      );
      toast.success('Producto actualizado exitosamente');
    } else {
      const newProducto: Producto = {
        id: crypto.randomUUID(), // evita duplicados
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        precio: Number(formData.precio),
        stock: Number(formData.stock),
        imagen: formData.imagen,
        colores: ['Negro'],
        tallas: ['M'],
      };
      setProductos([...productos, newProducto]);
      toast.success('Producto creado exitosamente');
    }
    setDialogOpen(false);
  };

  const columns = [
    
    { key: 'nombre', label: 'Nombre' },
    { key: 'categoria', label: 'Categoría' },
    {
      key: 'precio',
      label: 'Precio',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value: number) => (
        <Badge variant={value < 10 ? 'destructive' : 'secondary'}>
          {value} unidades
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ...resto del JSX exacto que ya tienes... */}
    </div>
  );
}
