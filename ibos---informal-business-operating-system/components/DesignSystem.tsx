import React from 'react';

// --- TYPOGRAPHY TOKENS ---
export const textStyles = {
  h1: "text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900",
  h2: "text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900",
  h3: "text-base sm:text-lg font-semibold tracking-tight text-neutral-900",
  body: "text-sm text-neutral-600 leading-relaxed",
  caption: "text-[11px] font-medium text-neutral-400 uppercase tracking-wider",
  money: "text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 tabular-nums",
};

// --- BUTTONS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', icon, fullWidth = false, className = '', ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium tracking-tight transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none rounded-xl whitespace-nowrap shrink-0";
  
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-subtle border border-neutral-900",
    accent: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-subtle border border-emerald-600",
    secondary: "bg-white text-neutral-800 border border-neutral-200/90 shadow-subtle hover:bg-neutral-50 hover:border-neutral-300",
    outline: "bg-transparent border border-neutral-200 text-neutral-800 hover:bg-neutral-100/70 hover:border-neutral-300",
    ghost: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs h-8 gap-1.5",
    md: "px-4 py-2 text-sm h-10 gap-2",
    lg: "px-5 py-2.5 text-sm h-12 gap-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// --- CARDS ---
// Single elevation, crisp hairline border, zero noisy shadows
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; padding?: string }> = ({ 
  children, className = '', onClick, padding = 'p-5' 
}) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl border border-neutral-200/80 shadow-card relative ${padding} ${onClick ? 'cursor-pointer transition-colors hover:border-neutral-300 active:bg-neutral-50/50' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- INPUTS ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  variant?: 'text' | 'numeric' | 'voice';
}

export const Input: React.FC<InputProps> = ({ label, icon, variant = 'text', className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 ml-0.5 uppercase tracking-wider">
        {label}
      </label>
    )}
    <div className="relative">
      <input 
        className={`w-full bg-white border border-neutral-200 rounded-xl px-3.5 h-11 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-subtle focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors ${icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
          {icon}
        </div>
      )}
      {variant === 'voice' && (
         <button type="button" aria-label="Voice input" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
         </button>
      )}
    </div>
  </div>
);

// --- MODAL ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md p-6 border border-neutral-200">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-neutral-100">
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- TOAST ---
export const Toast: React.FC<{ message: string; type?: 'success' | 'error' | 'info'; show: boolean }> = ({ message, type = 'info', show }) => {
  if (!show) return null;
  const dotColor = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-neutral-900'
  };
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] sm:w-auto">
      <div className="bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-elevated flex items-center space-x-2.5 border border-neutral-800 text-xs font-medium">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor[type]} shrink-0`} />
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
};

// --- BADGE (Zero-Pill: Clean unboxed typographic label with subtle dot indicator) ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'info' | 'neutral' }> = ({ children, variant = 'neutral' }) => {
  const dotColor = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600',
    neutral: 'bg-neutral-400'
  };
  const textColor = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
    neutral: 'text-neutral-600'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[variant]}`} />
      <span>{children}</span>
    </span>
  );
};

// --- AI CHAT BUBBLE ---
export const AIChatBubble: React.FC<{ message: string; isUser: boolean; timestamp: Date; grounding?: any }> = ({ message, isUser, timestamp, grounding }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
        isUser 
          ? 'bg-neutral-900 text-white rounded-br-sm' 
          : 'bg-white border border-neutral-200/80 text-neutral-800 shadow-card rounded-bl-sm'
      }`}>
        <div className="whitespace-pre-wrap">{message}</div>
        
        {grounding?.search && (
          <div className="mt-3 pt-3 border-t border-neutral-200/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {grounding.search.map((s: any, idx: number) => (
                <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="text-[11px] underline opacity-90 hover:opacity-100 block truncate max-w-[160px]">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
        <div className={`text-[10px] mt-2 font-mono tabular-nums ${isUser ? 'text-neutral-400' : 'text-neutral-400'}`}>
           {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

// --- PROGRESS BAR ---
export const ProgressBar: React.FC<{ progress: number; label?: string; subLabel?: string }> = ({ progress, label, subLabel }) => (
  <div className="w-full">
    {(label || subLabel) && (
      <div className="flex justify-between items-center mb-1.5">
        {label && <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{label}</span>}
        {subLabel && <span className="text-xs font-semibold text-neutral-900 font-mono tabular-nums">{subLabel}</span>}
      </div>
    )}
    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
      <div 
        className="bg-neutral-900 h-full rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);
