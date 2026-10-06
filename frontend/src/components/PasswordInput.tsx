import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ id, 'aria-describedby': ariaDescribedBy, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-input">
      <input {...props} id={inputId} type={visible ? 'text' : 'password'} aria-describedby={ariaDescribedBy} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}
