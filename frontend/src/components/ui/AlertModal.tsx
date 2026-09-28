import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  type?: 'error' | 'success' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertModal = ({ isOpen, type = 'error', title, message, onClose }: AlertModalProps) => {
  const [render, setRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!render) return null;

  const icons = {
    error: <AlertCircle className="w-8 h-8 text-red-500" />,
    success: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
    info: <Info className="w-8 h-8 text-blue-500" />
  };

  const bgColors = {
    error: 'bg-red-50',
    success: 'bg-emerald-50',
    info: 'bg-blue-50'
  };

  const buttonColors = {
    error: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30',
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onTransitionEnd={handleAnimationEnd}
    >
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
             <div className={`p-4 rounded-full ${bgColors[type]} inline-flex`}>
               {icons[type]}
             </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5 ${buttonColors[type]}`}
          >
            Okay
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
