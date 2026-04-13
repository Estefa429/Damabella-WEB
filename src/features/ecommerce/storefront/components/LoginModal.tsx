import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

/**
 * LoginModal - DEPRECADO
 * 
 * Este componente ahora redirige a la página /login.
 * Se mantiene por compatibilidad con código antiguo.
 * 
 * @deprecated Usar navigate("/login") en su lugar
 */
export function LoginModal({ onClose }: LoginModalProps) {
  const navigate = useNavigate();

  // Redirigir a la página de login
  React.useEffect(() => {
    navigate('/login');
  }, [navigate]);

  // Fallback - mostrar un modal de cierre mientras redirige
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-md p-8 text-center">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}
