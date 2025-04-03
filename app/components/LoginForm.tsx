'use client';

import { useEffect, useState } from 'react';
import { checkSupabaseConnection, supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginForm(): JSX.Element {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyConnection = async () => {
      const { success, error } = await checkSupabaseConnection();
      if (!success) {
        setError('Error de conexión con la base de datos: ' + error);
      }
    };
    verifyConnection();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmail(email)) {
      setError('Por favor, introduce un correo electrónico válido');
      setLoading(false);
      return;
    }

    try {
      const { data: existingUser, error: searchError } = await supabase
        .from('usuarios')
        .select()
        .eq('email', email)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw new Error('Error al verificar el correo electrónico');
      }

      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert([{ email, max_score: 0 }]);

        if (insertError) {
          throw new Error(insertError.code === '23505' 
            ? 'Este correo electrónico ya está registrado'
            : 'Error al crear el usuario');
        }
      }

      router.push('/game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Juego de la Serpiente</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Introduzca Correo Electrónico:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Jugar'}
          </button>
        </form>
      </div>
    </div>
  );
}