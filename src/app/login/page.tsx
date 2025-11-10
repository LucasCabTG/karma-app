// Archivo: src/app/login/page.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      // Usamos la función de Firebase para iniciar sesión
      await signInWithEmailAndPassword(auth, email, password);
      // Si el login es exitoso, redirigimos al escáner
      router.push('/admin/dashboard');
    } catch (err) { // Quitamos el ': any'
    // Verificamos si el error tiene una propiedad 'code'
    if (err && typeof err === 'object' && 'code' in err) {
      console.error("Error de autenticación:", err.code);
      if (err.code === 'auth/invalid-credential') {
        setError("Email o contraseña incorrectos.");
      } else {
        setError("Ocurrió un error. Intentá de nuevo.");
      }
    } else {
      // Si es un error genérico
      setError("Ocurrió un error inesperado.");
    }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg">
        <h1 className="text-3xl font-bold text-center">Acceso Staff</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit"
            className="w-full px-4 py-2 font-bold text-black bg-white rounded-md hover:bg-gray-300 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}