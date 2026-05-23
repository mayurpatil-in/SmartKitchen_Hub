import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../redux/slices/notificationSlice';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastNotifications = () => {
  const toasts = useSelector((state) => state.notifications.toasts);
  const dispatch = useDispatch();

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={() => dispatch(removeToast(toast.id))} 
        />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  useEffect(() => {
    // Automatically close toast after 4.5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />,
    },
  }[toast.type] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-800',
    icon: <Info className="w-5 h-5 text-slate-600" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-xl shadow-xl pointer-events-auto animate-slide-in ${config.bg}`}>
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="flex-grow text-xs font-semibold leading-relaxed">{toast.message}</div>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ToastNotifications;
