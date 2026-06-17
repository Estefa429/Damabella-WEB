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
  brandText?: string;
  closePosition?: 'left' | 'right';
  panelClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  noScroll = false,
  fullscreen = false,
  brandText,
  closePosition = 'right',
  panelClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = noScroll ? 'auto' : 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, noScroll]);

  if (!isOpen) return null;

  const sizes: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    xxl: 'max-w-5xl',
  };

  const panelClass = fullscreen
    ? 'h-[86vh] w-full max-w-6xl rounded-xl'
    : `w-full ${sizes[size]} rounded-lg ${panelClassName || 'max-h-[calc(100vh-4.5rem)]'}`;

  const sizeWidths: Record<NonNullable<ModalProps['size']>, string> = {
    sm: '28rem',
    md: '32rem',
    lg: '42rem',
    xl: '56rem',
    xxl: '72rem',
  };

  const panelStyle = fullscreen
    ? { maxWidth: 'min(95vw, 96rem)', maxHeight: '86vh' }
    : { maxWidth: `min(95vw, ${sizeWidths[size]})`, maxHeight: 'calc(100vh - 4.5rem)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - No cierra al hacer clic */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        ref={modalRef}
        className={`relative bg-white shadow-2xl flex flex-col overflow-hidden ${panelClass}`}
        style={panelStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0 sticky top-0 z-10">
          {closePosition === 'left' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-purple-700"
                aria-label="Cerrar"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-[17px] font-bold text-gray-800">{title}</h2>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          )}

          {closePosition === 'right' && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
              aria-label="Cerrar"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {brandText && (
            <span className="text-[#8B5CF6] font-bold text-base tracking-wide">
              {brandText}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className={`flex-1 min-h-0 bg-white p-6 md:p-8 ${
            noScroll ? 'overflow-visible' : 'overflow-y-auto'
          } text-sm`}
        >
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
