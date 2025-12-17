import { useState, useEffect } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components/ui/tabs';
import { Plus, Search, Edit, Trash2, Eye, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  direccion: string;
  ciudad: string;
  totalCompras: number;
  pedidos: number;
  estado: 'Activo' | 'Inactivo';
}

const INITIAL_CLIENTES: Cliente[] = [
  { id: '1', nombre: 'Laura Martínez', email: 'cliente@damabella.com', telefono: '3001234567', documento: '5555555555', direccion: 'Calle 123 #45-67', ciudad: 'Bogotá', totalCompras: 2500000, pedidos: 8, estado: 'Activo' },
  { id: '2', nombre: 'Sofía Ramírez', email: 'sofia.r@example.com', telefono: '3109876543', documento: '1111222233', direccion: 'Carrera 45 #12-34', ciudad: 'Medellín', totalCompras: 1800000, pedidos: 5, estado: 'Activo' },
  { id: '3', nombre: 'Carolina Ruiz', email: 'carolina.r@example.com', telefono: '3201231234', documento: '4444555566', direccion: 'Avenida 68 #89-01', ciudad: 'Cali', totalCompras: 950000, pedidos: 3, estado: 'Activo' },
  { id: '4', nombre: 'Valentina Torres', email: 'valentina.t@example.com', telefono: '3156547890', documento: '7777888899', direccion: 'Calle 100 #23-45', ciudad: 'Barranquilla', totalCompras: 3200000, pedidos: 12, estado: 'Activo' }
];

const MOCK_COMPRAS = [
  { id: '1', fecha: '2024-06-01', productos: 'Vestido Largo Negro, Set Casual', total: 450000, estado: 'Entregado' },
  { id: '2', fecha: '2024-05-15', productos: 'Enterizo Elegante', total: 280000, estado: 'Entregado' },
  { id: '3', fecha: '2024-04-20', productos: 'Vestido Corto Rojo', total: 195000, estado: 'Entregado' }
];

const MOCK_DEVOLUCIONES = [
  { id: '1', fecha: '2024-05-20', producto: 'Set Casual Beige', motivo: 'Talla incorrecta', estado: 'Aprobada' }
];

export default function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const stored = localStorage.getItem('damabella_clientes');
    return stored ? JSON.parse(stored) : INITIAL_CLIENTES;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documento: '',
    direccion: '',
    ciudad: '',
    estado: 'Activo' as 'Activo' | 'Inactivo'
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const canDelete = user?.role === 'Administrador';

  // Guardar en localStorage cuando cambien los clientes
  useEffect(() => {
    localStorage.setItem('damabella_clientes', JSON.stringify(clientes));
  }, [clientes]);

  const validateField = (field: string, value: string) => {
    const errors: any = {};
    
    if (field === 'nombre') {
      if (!value.trim()) {
        errors.nombre = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.nombre = 'Solo se permiten letras y espacios';
      }
    }

    if (field === 'email') {
      if (!value.trim()) {
        errors.email = 'Este campo es obligatorio';
      } else if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        errors.email = 'Email inválido (debe iniciar con letra)';
      }
    }

    if (field === 'telefono') {
      if (!value.trim()) {
        errors.telefono = 'Este campo es obligatorio';
      } else if (!/^\d{10}$/.test(value)) {
        errors.telefono = 'Debe tener exactamente 10 dígitos';
      }
    }

    if (field === 'documento') {
      if (!value.trim()) {
        errors.documento = 'Este campo es obligatorio';
      } else if (!/^\d{6,15}$/.test(value)) {
        errors.documento = 'Debe tener entre 6 y 15 dígitos';
      }
    }

    if (field === 'direccion') {
      if (!value.trim()) {
        errors.direccion = 'Este campo es obligatorio';
      }
    }

    if (field === 'ciudad') {
      if (!value.trim()) {
        errors.ciudad = 'Este campo es obligatorio';
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        errors.ciudad = 'Solo se permiten letras y espacios';
      }
    }
    
    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    // Solo permitir números en documento y teléfono
    if (field === 'documento' || field === 'telefono') {
      value = value.replace(/\D/g, '');
    }
    
    setFormData({ ...formData, [field]: value });
    const fieldErrors = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: fieldErrors[field] });
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documento.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedCliente(null);
    setFormData({ nombre: '', email: '', telefono: '', documento: '', direccion: '', ciudad: '', estado: 'Activo' });
    setDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      documento: cliente.documento,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      estado: cliente.estado
    });
    setDialogOpen(true);
  };

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar clientes');
      return;
    }
    
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id));
      toast.success('Cliente eliminado correctamente');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const allErrors: any = {};
    ['nombre', 'email', 'telefono', 'documento', 'direccion', 'ciudad'].forEach(field => {
      const fieldErrors = validateField(field, (formData as any)[field]);
      if (fieldErrors[field]) {
        allErrors[field] = fieldErrors[field];
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    // Validar email único
    const emailExists = clientes.some(c => 
      c.email.toLowerCase() === formData.email.toLowerCase() && 
      c.id !== selectedCliente?.id
    );
    
    if (emailExists) {
      setFormErrors({ ...formErrors, email: 'Este correo ya está registrado' });
      toast.error('El correo electrónico ya está registrado');
      return;
    }
    
    if (selectedCliente) {
      setClientes(clientes.map(c => 
        c.id === selectedCliente.id 
          ? { ...c, ...formData }
          : c
      ));
      toast.success('Cliente actualizado correctamente');
    } else {
      const newCliente: Cliente = {
        id: Date.now().toString(),
        ...formData,
        totalCompras: 0,
        pedidos: 0
      };
      setClientes([...clientes, newCliente]);
      toast.success('Cliente creado correctamente');
    }
    
    setFormErrors({});
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <Button onClick={handleAdd} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cliente
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, documento o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Total Compras</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.nombre}</TableCell>
                  <TableCell>{cliente.documento}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>{cliente.ciudad}</TableCell>
                  <TableCell>${cliente.totalCompras.toLocaleString()}</TableCell>
                  <TableCell>{cliente.pedidos}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.estado === 'Activo' ? 'default' : 'secondary'}>
                      {cliente.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(cliente)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(cliente.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {selectedCliente
              ? 'Actualiza los datos del cliente'
              : 'Completa la información del nuevo cliente'}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  required
                />
                {formErrors.nombre && <p className="text-red-500 text-sm">{formErrors.nombre}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => handleFieldChange('documento', e.target.value)}
                  required
                />
                {formErrors.documento && <p className="text-red-500 text-sm">{formErrors.documento}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  required
                />
                {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleFieldChange('telefono', e.target.value)}
                  required
                />
                {formErrors.telefono && <p className="text-red-500 text-sm">{formErrors.telefono}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleFieldChange('direccion', e.target.value)}
                  required
                />
                {formErrors.direccion && <p className="text-red-500 text-sm">{formErrors.direccion}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleFieldChange('ciudad', e.target.value)}
                  required
                />
                {formErrors.ciudad && <p className="text-red-500 text-sm">{formErrors.ciudad}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800">
                {selectedCliente ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Perfil del Cliente</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Información completa y historial del cliente seleccionado
          </DialogDescription>
          {selectedCliente && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="compras">Historial de Compras</TabsTrigger>
                <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Nombre</Label>
                    <p className="text-gray-900">{selectedCliente.nombre}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Documento</Label>
                    <p className="text-gray-900">{selectedCliente.documento}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="text-gray-900">{selectedCliente.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Teléfono</Label>
                    <p className="text-gray-900">{selectedCliente.telefono}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Dirección</Label>
                    <p className="text-gray-900">{selectedCliente.direccion}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Ciudad</Label>
                    <p className="text-gray-900">{selectedCliente.ciudad}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Total Compras</Label>
                    <p className="text-gray-900">${selectedCliente.totalCompras.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Número de Pedidos</Label>
                    <p className="text-gray-900">{selectedCliente.pedidos}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="compras">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_COMPRAS.map((compra) => (
                      <TableRow key={compra.id}>
                        <TableCell>{compra.fecha}</TableCell>
                        <TableCell>{compra.productos}</TableCell>
                        <TableCell>${compra.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="default">{compra.estado}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="devoluciones">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_DEVOLUCIONES.map((dev) => (
                      <TableRow key={dev.id}>
                        <TableCell>{dev.fecha}</TableCell>
                        <TableCell>{dev.producto}</TableCell>
                        <TableCell>{dev.motivo}</TableCell>
                        <TableCell>
                          <Badge variant="default">{dev.estado}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
