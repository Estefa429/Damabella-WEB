import React from 'react';
import { Instagram, Facebook, Twitter } from 'lucide-react';

interface PremiumFooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export function PremiumFooter({ onNavigate }: PremiumFooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-16 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
              DAMABELLA
            </h3>
            <p className="text-gray-400">
              Elegancia y sofisticación en cada prenda.
            </p>
          </div>
          <div>
            <h4 className="text-lg mb-4">Comprar</h4>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => onNavigate('search', 'Vestidos Largos')} className="hover:text-white transition-colors">Vestidos Largos</button></li>
              <li><button onClick={() => onNavigate('search', 'Vestidos Cortos')} className="hover:text-white transition-colors">Vestidos Cortos</button></li>
              <li><button onClick={() => onNavigate('search', 'Sets')} className="hover:text-white transition-colors">Sets</button></li>
              <li><button onClick={() => onNavigate('search', 'Enterizos')} className="hover:text-white transition-colors">Enterizos</button></li>
              <li><button onClick={() => onNavigate('search')} className="hover:text-white transition-colors">Todos los Productos</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg mb-4">Ayuda</h4>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contacto</button></li>
              <li><button onClick={() => onNavigate('orders')} className="hover:text-white transition-colors">Mis Pedidos</button></li>
              <li><a href="#" className="hover:text-white transition-colors">Envíos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Devoluciones</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg mb-4">Síguenos</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2024 DAMABELLA. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
