import { createClient } from '@supabase/supabase-js';

// Definición de tipos para una mejor seguridad
type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          email: string;
          max_score: number;
        };
        Insert: {
          email: string;
          max_score?: number;
        };
      };
    };
  };
};

// Validación de variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Error: La variable de entorno NEXT_PUBLIC_SUPABASE_URL no está definida.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Error: La variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida.'
  );
}

// Creación del cliente de Supabase con tipos
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Función de utilidad para verificar la conexión
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('usuarios').select('count').single();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al conectar con Supabase'
    };
  }
}