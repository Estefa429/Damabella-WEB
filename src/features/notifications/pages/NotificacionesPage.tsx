import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Package, DollarSign, AlertTriangle, User } from 'lucide-react';
import { Button } from '../../../shared/components/native';

interface Notificacion {
  id: number;
  tipo: 'venta' | 'inventario' | 'pedido' | 'usuario';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
    {
      id: 1,
      tipo: 'venta',
      titulo: 'Nueva venta realizada',
      mensaje: 'Se ha registrado una venta por $250.000',
      fecha: '2025-11-19 10:30',
      leida: false
    },
    {
      id: 2,
      tipo: 'inventario',
      titulo: 'Stock bajo',
      mensaje: 'El producto "Vestido Largo Rojo" tiene solo 3 unidades disponibles',
      fecha: '2025-11-19 09:15',
      leida: false
    },
    {
      id: 3,
      tipo: 'pedido',
      titulo: 'Nuevo pedido',
      mensaje: 'Pedido #1234 recibido de María García',
      fecha: '2025-11-19 08:45',
      leida: true
    },
    {
      id: 4,
      tipo: 'usuario',
      titulo: 'Nuevo usuario registrado',
      mensaje: 'Ana López se ha registrado en el sistema',
      fecha: '2025-11-18 16:20',
      leida: true
    },
    {
      id: 5,
      tipo: 'inventario',
      titulo: 'Reposición necesaria',
      mensaje: 'El producto "Set Elegante" está agotado',
      fecha: '2025-11-18 14:30',
      leida: true
    }
  ]);

  const marcarComoLeida = (id: number) => {
    console.log('🔔 [marcarComoLeida] MARCANDO NOTIFICACIÓN COMO LEÍDA');
    console.log('  📌 Notificación ID:', id);
    setNotificaciones(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, leida: true } : n);
      console.log('  ✅ Estado actualizado. Notificaciones ahora:', JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const marcarTodasLeidas = () => {
    console.log('🔔 [marcarTodasLeidas] MARCANDO TODAS LAS NOTIFICACIONES COMO LEÍDAS');
    setNotificaciones(prev => {
      const updated = prev.map(n => ({ ...n, leida: true }));
      console.log('  ✅ Todas marcadas. Total de notificaciones:', updated.length);
      return updated;
    });
  };

  const eliminarNotificacion = (id: number) => {
    console.log('🗑️ [eliminarNotificacion] ELIMINANDO NOTIFICACIÓN');
    console.log('  📌 Notificación ID a eliminar:', id);
    setNotificaciones(prev => {
      const updated = prev.filter(n => n.id !== id);
      console.log('  ✅ Notificación eliminada. Quedan:', updated.length, 'notificaciones');
      return updated;
    });
  };

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'venta':
        return <DollarSign className="text-green-600" size={20} />;
      case 'inventario':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'pedido':
        return <Package className="text-blue-600" size={20} />;
      case 'usuario':
        return <User className="text-purple-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Bell className="text-gray-700" size={24} />
              </div>
              <div>
                <h2 className="text-gray-900">Notificaciones</h2>
                <p className="text-gray-600">
                  {noLeidas > 0 ? `${noLeidas} notificaciones sin leer` : 'No hay notificaciones nuevas'}
                </p>
              </div>
            </div>
            {noLeidas > 0 && (
              <Button
                onClick={marcarTodasLeidas}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <CheckCheck size={18} />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notificaciones.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No tienes notificaciones</p>
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notif.leida ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notif.leida ? 'bg-white' : 'bg-gray-100'
                  }`}>
                    {getIcono(notif.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`${!notif.leida ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notif.titulo}
                          </h4>
                          {!notif.leida && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notif.mensaje}</p>
                        <p className="text-gray-400">{notif.fecha}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notif.leida && (
                          <button
                            onClick={() => marcarComoLeida(notif.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                            title="Marcar como leída"
                          >
                            <CheckCheck size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarNotificacion(notif.id)}
                          className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
