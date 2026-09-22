import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";

import { auth } from "../firebase/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Centinela</h1>
        <p style={styles.subtitle}>Panel familiar de rastreo y respuesta ante robo.</p>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="firma">Creado por Diego Aleman</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 320,
    maxWidth: "90vw",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 28,
  },
  title: {
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 12px",
    color: "var(--text-muted)",
    fontSize: 13,
    textAlign: "center",
  },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg-muted)",
    color: "var(--text)",
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "var(--alert)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    color: "var(--alert)",
    fontSize: 13,
    margin: 0,
  },
};
