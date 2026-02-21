import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  noScroll?: boolean;
  fullscreen?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  noScroll = false,
  fullscreen = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = noScroll ? 'auto' : 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, noScroll]);

  if (!isOpen) return null;

  const sizes: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    xxl: 'max-w-[95vw]',
  };

  const panelClass = fullscreen
    ? 'h-[86vh] w-full max-w-6xl rounded-xl'
    : `w-full ${sizes[size]} rounded-lg max-h-[95vh]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={modalRef}
        className={`relative bg-gray-50 shadow-xl flex flex-col overflow-hidden ${panelClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="Cerrar"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`flex-1 min-h-0 bg-white ${
            noScroll ? 'overflow-visible' : 'overflow-y-auto'
          } text-sm`}
        >
          <div className="p-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

