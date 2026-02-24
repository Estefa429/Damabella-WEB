import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * When true, modal will not force an internal scroll. Use sparingly for
   * specific modals that must display all content without inner scroll.
   */
  noScroll?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', noScroll = false }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // If this modal opts out of internal scrolling, allow page scrolling
      // so the user can view all content. For regular modals, keep body
      // overflow hidden to prevent background scroll.
      document.body.style.overflow = noScroll ? 'auto' : 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-gray-50 rounded-lg shadow-xl w-full ${sizes[size]} ${noScroll ? '' : 'max-h-[90vh]'} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 ${noScroll ? 'overflow-visible' : 'overflow-y-auto'} p-4 bg-white`}>
          {children}
        </div>
      </div>
    </div>
  );
}
