import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Phone, Mail } from 'lucide-react';
import { Button, Input, Modal } from '../../../../shared/components/native';

const STORAGE_KEY = 'damabella_clientes';

interface Cliente {
  id: number;
  nombre: string;
  tipoDoc: string;
  numeroDoc: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
  createdAt: string;
}

export default function ClientesManager() {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<any>({});
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipoDoc: 'CC',
    numeroDoc: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: ''
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  }, [clientes]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setFormData({
      nombre: '',
      tipoDoc: 'CC',
      numeroDoc: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: ''
    });
    setShowModal(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre || '',
      tipoDoc: cliente.tipoDoc || 'CC',
      numeroDoc: cliente.numeroDoc || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const errors: any = {};
    
    // Validación nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre)) {
      errors.nombre = 'Solo se permiten letras y espacios';
    }
    
    // Validación documento
    if (!formData.numeroDoc.trim()) {
      errors.numeroDoc = 'El número de documento es obligatorio';
    } else if (!/^\d{6,12}$/.test(formData.numeroDoc)) {
      errors.numeroDoc = 'Debe tener entre 6 y 12 dígitos';
    }
    
    // Validación teléfono
    if (formData.telefono.trim() && !/^\d{10}$/.test(formData.telefono)) {
      errors.telefono = 'Debe tener exactamente 10 dígitos';
    }
    
    // Validación email único
    if (formData.email.trim()) {
      if (!/^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
        errors.email = 'Email inválido (debe iniciar con letra)';
      } else {
        // Verificar que el correo no exista (excepto si estamos editando el mismo cliente)
        const emailExists = clientes.some(c => 
          c.email.toLowerCase() === formData.email.toLowerCase() && 
          c.id !== editingCliente?.id
        );
        if (emailExists) {
          errors.email = 'Este correo electrónico ya está registrado';
        }
      }
    }
    
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const clienteData = {
      ...formData,
      activo: true,
      createdAt: new Date().toISOString()
    };

    if (editingCliente) {
      setClientes(clientes.map(c => 
        c.id === editingCliente.id ? { ...c, ...clienteData } : c
      ));
    } else {
      setClientes([...clientes, { id: Date.now(), ...clienteData }]);
    }
    
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const toggleActive = (id: number) => {
    setClientes(clientes.map(c => 
      c.id === id ? { ...c, activo: !c.activo } : c
    ));
  };

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numeroDoc.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={20} />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clientes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600">Documento</th>
                <th className="text-left py-4 px-6 text-gray-600">Contacto</th>
                <th className="text-left py-4 px-6 text-gray-600">Ciudad</th>
                <th className="text-center py-4 px-6 text-gray-600">Estado</th>
                <th className="text-right py-4 px-6 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Users className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                          {cliente.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{cliente.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700">{cliente.tipoDoc}</div>
                      <div className="text-gray-500">{cliente.numeroDoc}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {cliente.telefono && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone size={14} className="text-gray-400" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail size={14} className="text-gray-400" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{cliente.ciudad || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleActive(cliente.id)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            cliente.activo ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            cliente.activo ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre Completo *</label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              placeholder="Juan Pérez"
              required
            />
            {formErrors.nombre && <p className="text-red-500 text-sm">{formErrors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Número de Documento *</label>
              <Input
                value={formData.numeroDoc}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleFieldChange('numeroDoc', value);
                }}
                placeholder="1234567890"
                maxLength={12}
                required
              />
              {formErrors.numeroDoc && <p className="text-red-500 text-sm">{formErrors.numeroDoc}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleFieldChange('telefono', value);
                }}
                placeholder="3001234567"
                maxLength={10}
              />
              {formErrors.telefono && <p className="text-red-500 text-sm">{formErrors.telefono}</p>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Ciudad</label>
              <Input
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Bogotá"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Correo Electrónico</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="cliente@ejemplo.com"
            />
            {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Dirección</label>
            <Input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
