import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  categoria: string;
  estado: 'Activo' | 'Inactivo';
}

const INITIAL_PROVEEDORES: Proveedor[] = [
  { id: '1', nombre: 'Textiles del Norte', contacto: 'Juan Pérez', email: 'ventas@textilesnorte.com', telefono: '3001234567', direccion: 'Zona Industrial', ciudad: 'Bogotá', categoria: 'Telas', estado: 'Activo' },
  { id: '2', nombre: 'Moda y Estilo SAS', contacto: 'María Gómez', email: 'info@modayestilo.com', telefono: '3109876543', direccion: 'Calle 50 #23-45', ciudad: 'Medellín', categoria: 'Confección', estado: 'Activo' },
  { id: '3', nombre: 'Accesorios Fashion', contacto: 'Carlos Díaz', email: 'accesorios@fashion.com', telefono: '3201231234', direccion: 'Centro Comercial', ciudad: 'Cali', categoria: 'Accesorios', estado: 'Activo' }
];

export default function Proveedores() {
  const { user } = useAuth();
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    const stored = localStorage.getItem('damabella_proveedores');
    return stored ? JSON.parse(stored) : INITIAL_PROVEEDORES;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    categoria: '',
    estado: 'Activo' as 'Activo' | 'Inactivo'
  });
  const [formErrors, setFormErrors] = useState<any>({});
  // import validation lazily to avoid circulars
  // we'll use a simple shared helper if available
  // (validation helper path)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const validateField = require('../../../shared/utils/validation').default;

  const canDelete = user?.rol === 'Administrador';

  // Guardar en localStorage cuando cambien los proveedores
  useEffect(() => {
    localStorage.setItem('damabella_proveedores', JSON.stringify(proveedores));
  }, [proveedores]);

  const filteredProveedores = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contacto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedProveedor(null);
    setFormData({ nombre: '', contacto: '', email: '', telefono: '', direccion: '', ciudad: '', categoria: '', estado: 'Activo' });
    setDialogOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData(proveedor);
    setDialogOpen(true);
  };

  const handleView = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar proveedores');
      return;
    }
    
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      setProveedores(proveedores.filter(p => p.id !== id));
      toast.success('Proveedor eliminado correctamente');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    ['nombre', 'contacto', 'email', 'telefono', 'direccion', 'ciudad', 'categoria'].forEach((f) => {
      const err = validateField(f, (formData as any)[f]);
      if (err) errors[f] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (selectedProveedor) {
      setProveedores(proveedores.map(p => 
        p.id === selectedProveedor.id 
          ? { ...p, ...formData }
          : p
      ));
      toast.success('Proveedor actualizado correctamente');
    } else {
      const newProveedor: Proveedor = {
        id: Date.now().toString(),
        ...formData
      };
      setProveedores([...proveedores, newProveedor]);
      toast.success('Proveedor creado correctamente');
    }
    
    setDialogOpen(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    const err = validateField(field, value);
    if (err) setFormErrors({ ...formErrors, [field]: err });
    else {
      const { [field]: _removed, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600">Administra tus proveedores y contactos</p>
        </div>
        <Button onClick={handleAdd} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Proveedor
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar proveedor..."
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
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProveedores.map((proveedor) => (
                <TableRow key={proveedor.id}>
                  <TableCell>{proveedor.nombre}</TableCell>
                  <TableCell>{proveedor.contacto}</TableCell>
                  <TableCell>{proveedor.telefono}</TableCell>
                  <TableCell>{proveedor.ciudad}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{proveedor.categoria}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={proveedor.estado === 'Activo' ? 'default' : 'secondary'}>
                      {proveedor.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(proveedor)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(proveedor)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(proveedor.id)}
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
              {selectedProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {selectedProveedor
              ? 'Actualiza la información del proveedor'
              : 'Completa los datos del nuevo proveedor'}
          </DialogDescription>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la empresa</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  required
                />
                {formErrors.nombre && <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto">Persona de contacto</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) => handleFieldChange('contacto', e.target.value)}
                  required
                />
                {formErrors.contacto && <p className="text-red-600 text-sm mt-1">{formErrors.contacto}</p>}
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
                {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleFieldChange('telefono', e.target.value)}
                  required
                />
                {formErrors.telefono && <p className="text-red-600 text-sm mt-1">{formErrors.telefono}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleFieldChange('direccion', e.target.value)}
                  required
                />
                {formErrors.direccion && <p className="text-red-600 text-sm mt-1">{formErrors.direccion}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleFieldChange('ciudad', e.target.value)}
                  required
                />
                {formErrors.ciudad && <p className="text-red-600 text-sm mt-1">{formErrors.ciudad}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => handleFieldChange('categoria', e.target.value)}
                  placeholder="Ej: Telas, Confección, Accesorios"
                  required
                />
                {formErrors.categoria && <p className="text-red-600 text-sm mt-1">{formErrors.categoria}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800">
                {selectedProveedor ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Información completa del proveedor seleccionado
          </DialogDescription>
          {selectedProveedor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Empresa</Label>
                  <p className="text-gray-900">{selectedProveedor.nombre}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Contacto</Label>
                  <p className="text-gray-900">{selectedProveedor.contacto}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="text-gray-900">{selectedProveedor.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Teléfono</Label>
                  <p className="text-gray-900">{selectedProveedor.telefono}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Dirección</Label>
                  <p className="text-gray-900">{selectedProveedor.direccion}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Ciudad</Label>
                  <p className="text-gray-900">{selectedProveedor.ciudad}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Categoría</Label>
                  <p className="text-gray-900">{selectedProveedor.categoria}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <Badge variant={selectedProveedor.estado === 'Activo' ? 'default' : 'secondary'}>
                    {selectedProveedor.estado}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
