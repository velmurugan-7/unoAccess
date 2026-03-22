import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2, ShieldCheck } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; helper?: string; startIcon?: ReactNode; endIcon?: ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, startIcon, endIcon, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="label">{label}</label>}
      <div className="relative">
        {startIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] pointer-events-none">{startIcon}</span>}
        <input id={id} ref={ref} className={clsx('input', startIcon && 'pl-9', endIcon && 'pr-9', error && 'input-error', className)} {...props} />
        {endIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] pointer-events-none">{endIcon}</span>}
      </div>
      {error && <p className="error-msg">{error}</p>}
      {!error && helper && <p className="helper">{helper}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; helper?: string; }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, className, id, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select id={id} ref={ref} className={clsx('select', className)} {...props}>{children}</select>
      {error && <p className="error-msg">{error}</p>}
      {!error && helper && <p className="helper">{helper}</p>}
    </div>
  )
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="label">{label}</label>}
      <textarea id={id} ref={ref} className={clsx('input resize-none', error && 'input-error', className)} {...props} />
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean; leftIcon?: ReactNode; rightIcon?: ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading, className, disabled, leftIcon, rightIcon, ...props }) => (
  <button className={clsx('btn', variant === 'primary' && 'btn-primary', variant === 'secondary' && 'btn-secondary', variant === 'danger' && 'btn-danger', variant === 'ghost' && 'btn-ghost', size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', size === 'icon' && 'btn-icon', className)} disabled={disabled || isLoading} {...props}>
    {isLoading ? <Loader2 className="w-4 h-4 spinner" /> : leftIcon}
    {children}
    {!isLoading && rightIcon}
  </button>
);

interface AlertProps { type: 'error' | 'success' | 'warning' | 'info'; message: string; className?: string; }
export const Alert: React.FC<AlertProps> = ({ type, message, className }) => (
  <div className={clsx('alert', type === 'error' && 'alert-error', type === 'success' && 'alert-success', type === 'warning' && 'alert-warning', type === 'info' && 'alert-info', className)}>
    <span>{message}</span>
  </div>
);

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg'; theme?: 'light' | 'dark' }> = ({ size = 'md', theme = 'light' }) => (
  <div className={clsx('logo', size === 'sm' && 'gap-1.5')}>
    <div className={clsx('logo-mark', size === 'sm' && 'w-6 h-6 rounded-[6px]', size === 'lg' && 'w-9 h-9 rounded-[10px]')}>
      <ShieldCheck className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
    </div>
    <span className={clsx('logo-text', size === 'sm' && 'text-sm', size === 'lg' && 'text-xl', theme === 'dark' && '!text-white')}> UnoAccess</span>
  </div>
);

type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
export const Badge: React.FC<{ variant?: BadgeVariant; dot?: boolean; children: ReactNode; className?: string }> = ({ variant = 'gray', dot = false, children, className }) => (
  <span className={clsx('badge', `badge-${variant}`, dot && 'badge-dot', className)}>{children}</span>
);

interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; maxWidth?: string; }
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, maxWidth = '480px' }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="text-base font-semibold text-[var(--c-text)]">{title}</h3></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#dc2626', '#d97706', '#2563eb', '#16a34a'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= score ? colors[score] : 'var(--c-border2)' }} />)}</div>
      <p className="text-xs mt-1" style={{ color: colors[score] || 'var(--c-text3)' }}>{labels[score]}</p>
    </div>
  );
};

export const Card: React.FC<{ children: ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <div className={clsx('card', className)} onClick={onClick}>{children}</div>
);
export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: ReactNode; className?: string }> = ({ title, subtitle, action, className }) => (
  <div className={clsx('card-header', className)}>
    <div><p className="card-title">{title}</p>{subtitle && <p className="card-desc">{subtitle}</p>}</div>
    {action}
  </div>
);
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => (
  <Loader2 className={clsx('spinner text-[var(--c-blue)]', size === 'sm' && 'w-4 h-4', size === 'md' && 'w-5 h-5', size === 'lg' && 'w-7 h-7', className)} />
);
export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
);
