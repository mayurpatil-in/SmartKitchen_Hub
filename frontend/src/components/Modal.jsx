import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', closeOnBackdrop = true }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-[95vw] h-[95vh]'
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 pointer-events-auto" 
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      
      {/* Modal Card content wrapper */}
      <div className={`relative w-full ${sizeClasses} bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] z-10 animate-slide-in pointer-events-auto`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 leading-none">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Modal Content Scrollable Area */}
        <div className="flex-grow p-6 overflow-y-auto text-xs text-slate-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
