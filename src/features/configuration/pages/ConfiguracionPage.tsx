import React, { useState } from 'react';
import { Bell, Lock, Palette, Globe, Shield, Save } from 'lucide-react';
import { Button } from '../../../shared/components/native';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    notificaciones: {
      email: true,
      push: true,
      ventas: true,
      inventario: true,
      pedidos: true
    },
    apariencia: {
      tema: 'claro',
      idioma: 'es'
    },
    seguridad: {
      autenticacionDosFactores: false,
      sesionExpira: '30'
    }
  });

  const handleSave = () => {
    localStorage.setItem('damabella_config', JSON.stringify(config));
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Personaliza tu experiencia en el sistema</p>
      </div>

      {/* Notificaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Bell className="text-gray-700" size={20} />
          </div>
          <div>
            <h3 className="text-gray-900">Notificaciones</h3>
            <p className="text-gray-600">Configura cómo deseas recibir notificaciones</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-gray-900">Notificaciones por Email</div>
              <div className="text-gray-600">Recibir alertas en tu correo electrónico</div>
            </div>
            <input
              type="checkbox"
              checked={config.notificaciones.email}
              onChange={(e) => setConfig({
                ...config,
                notificaciones: { ...config.notificaciones, email: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-gray-900">Notificaciones Push</div>
              <div className="text-gray-600">Recibir alertas en tiempo real</div>
            </div>
            <input
              type="checkbox"
              checked={config.notificaciones.push}
              onChange={(e) => setConfig({
                ...config,
                notificaciones: { ...config.notificaciones, push: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-gray-900">Alertas de Ventas</div>
              <div className="text-gray-600">Notificar cuando se realice una venta</div>
            </div>
            <input
              type="checkbox"
              checked={config.notificaciones.ventas}
              onChange={(e) => setConfig({
                ...config,
                notificaciones: { ...config.notificaciones, ventas: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-gray-900">Alertas de Inventario</div>
              <div className="text-gray-600">Notificar cuando el stock esté bajo</div>
            </div>
            <input
              type="checkbox"
              checked={config.notificaciones.inventario}
              onChange={(e) => setConfig({
                ...config,
                notificaciones: { ...config.notificaciones, inventario: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-gray-900">Nuevos Pedidos</div>
              <div className="text-gray-600">Notificar cuando llegue un pedido nuevo</div>
            </div>
            <input
              type="checkbox"
              checked={config.notificaciones.pedidos}
              onChange={(e) => setConfig({
                ...config,
                notificaciones: { ...config.notificaciones, pedidos: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-500"
            />
          </label>
        </div>
      </div>

      {/* Apariencia */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Palette className="text-gray-700" size={20} />
          </div>
          <div>
            <h3 className="text-gray-900">Apariencia</h3>
            <p className="text-gray-600">Personaliza la interfaz del sistema</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Tema</label>
            <select
              value={config.apariencia.tema}
              onChange={(e) => setConfig({
                ...config,
                apariencia: { ...config.apariencia, tema: e.target.value }
              })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
              <option value="auto">Automático</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <Globe size={16} />
              Idioma
            </label>
            <select
              value={config.apariencia.idioma}
              onChange={(e) => setConfig({
                ...config,
                apariencia: { ...config.apariencia, idioma: e.target.value }
              })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Shield className="text-gray-700" size={20} />
          </div>
          <div>
            <h3 className="text-gray-900">Seguridad</h3>
            <p className="text-gray-600">Protege tu cuenta y datos</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-gray-900">Autenticación de dos factores</div>
              <div className="text-gray-600">Añade una capa extra de seguridad</div>
            </div>
            <input
              type="checkbox"
              checked={config.seguridad.autenticacionDosFactores}
              onChange={(e) => setConfig({
                ...config,
                seguridad: { ...config.seguridad, autenticacionDosFactores: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-500"
            />
          </label>

          <div>
            <label className="block text-gray-700 mb-2 flex items-center gap-2">
              <Lock size={16} />
              Tiempo de expiración de sesión (minutos)
            </label>
            <select
              value={config.seguridad.sesionExpira}
              onChange={(e) => setConfig({
                ...config,
                seguridad: { ...config.seguridad, sesionExpira: e.target.value }
              })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Save size={18} />
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
