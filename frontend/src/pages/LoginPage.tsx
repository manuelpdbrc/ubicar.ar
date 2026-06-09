import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, ApiRequestError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { AuthResponse } from '../types';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
      login(data.token, data.user);
      showToast(`¡Bienvenido, ${data.user.name}!`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'Error de conexión. Intentá de nuevo.';
      showToast(message, 'error');
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
          <h1 className={styles.title}>ubicar.ar</h1>
          <p className={styles.subtitle}>Gestión de ubicaciones geográficas</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            minLength={6}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            size="lg"
          >
            Iniciar sesión
          </Button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className={styles.link}>
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
