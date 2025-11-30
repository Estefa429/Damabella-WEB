import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter } from 'lucide-react';
import { PremiumNavbar } from '../components/PremiumNavbar';
import { PremiumFooter } from '../components/PremiumFooter';

interface ContactPageProps {
  onNavigate: (view: string) => void;
  isAuthenticated?: boolean;
  currentUser?: any;
}

export function ContactPage({ onNavigate, isAuthenticated = false, currentUser = null }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar onNavigate={onNavigate} isAuthenticated={isAuthenticated} currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl text-gray-900 mb-4">Contáctanos</h1>
          <p className="text-xl text-gray-600">
            Estamos aquí para ayudarte. Envíanos tu mensaje y te responderemos pronto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl text-gray-900 mb-6">Envíanos un Mensaje</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Teléfono (Opcional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Mensaje</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Enviar Mensaje
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Info Cards */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Información de Contacto</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600">contacto@damabella.com</p>
                    <p className="text-gray-600">ventas@damabella.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Teléfono</h3>
                    <p className="text-gray-600">+57 300 123 4567</p>
                    <p className="text-gray-600">+57 310 987 6543</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Dirección</h3>
                    <p className="text-gray-600">Calle 123 #45-67</p>
                    <p className="text-gray-600">Bogotá, Colombia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Horarios de Atención</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Lunes - Viernes</span>
                  <span className="font-medium">9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábado</span>
                  <span className="font-medium">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Domingo</span>
                  <span className="font-medium">Cerrado</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl text-gray-900 mb-6">Síguenos</h2>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-110"
                >
                  <Instagram className="text-white" size={24} />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-110"
                >
                  <Facebook className="text-white" size={24} />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center hover:from-pink-500 hover:to-purple-500 transition-all transform hover:scale-110"
                >
                  <Twitter className="text-white" size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PremiumFooter onNavigate={onNavigate} />
    </div>
  );
}
