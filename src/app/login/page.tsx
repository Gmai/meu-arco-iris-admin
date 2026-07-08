"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("E-mail ou senha inválidos.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Ocorreu um erro ao tentar fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <section className="glass-panel" style={styles.card}>
        <header style={styles.header}>
          <h1 style={styles.title}>Meu Arco-Iris Admin</h1>
          <p style={styles.subtitle}>Acesse o painel para validar seus pedidos</p>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}}
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--background)',
    padding: 'var(--spacing-md)',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    borderRadius: '16px',
    padding: 'var(--spacing-2xl)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 'var(--spacing-2xl)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--foreground)',
    marginBottom: 'var(--spacing-sm)',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--spacing-lg)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--spacing-sm)',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  input: {
    padding: 'var(--spacing-md)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
  },
  button: {
    marginTop: 'var(--spacing-sm)',
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: 'var(--spacing-md)',
    borderRadius: '8px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    padding: 'var(--spacing-md)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: 'var(--spacing-md)',
    textAlign: 'center' as const,
    border: '1px solid rgba(239, 68, 68, 0.2)',
  }
};
