import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, ApiRequestError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { AuthResponse } from '../types';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      newErrors['name'] = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email.includes('@') || !email.includes('.')) {
      newErrors['email'] = 'Ingresá un email válido';
    }

    if (password.length < 6) {
      newErrors['password'] = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (password !== confirmPassword) {
      newErrors['confirmPassword'] = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data = await api.post<AuthResponse>('/api/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      login(data.token, data.user);
      showToast('¡Cuenta creada exitosamente!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.details) {
          const fieldErrors: Record<string, string> = {};
          for (const detail of err.details) {
            fieldErrors[detail.field] = detail.message;
          }
          setErrors(fieldErrors);
        }
        showToast(err.message, 'error');
      } else {
        showToast('Error de conexión. Intentá de nuevo.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Branding */}
        <div className={styles.branding}>
          <div className={styles.logo}>
            <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
              <path d="M32 4C20.954 4 12 12.954 12 24c0 14 20 36 20 36s20-22 20-36C52 12.954 43.046 4 32 4z" fill="#6366F1"/>
              <circle cx="32" cy="24" r="9" fill="#fff"/>
            </svg>
          </div>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Empezá a gestionar tus ubicaciones</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Nombre"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            error={errors['name']}
            required
            minLength={2}
            autoComplete="name"
            autoFocus
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            error={errors['email']}
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            error={errors['password']}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetí tu contraseña"
            error={errors['confirmPassword']}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            size="lg"
          >
            Crear cuenta
          </Button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className={styles.link}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
