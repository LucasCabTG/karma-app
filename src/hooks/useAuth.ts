// Archivo: src/hooks/useAuth.ts (Actualizado)
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // 1. Añadimos un estado de carga
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // 2. Cuando Firebase responde (con o sin usuario), dejamos de cargar
      setIsLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  // 3. Devolvemos el estado de carga junto con el usuario
  return { user, isLoading };
}