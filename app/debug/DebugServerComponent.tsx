// app/debug/DebugServerComponent.tsx (Server Component)
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { cookies } from "next/headers"; // Importa cookies do Next.js para usá-los no lado do servidor

export default async function DebugServerComponent() {
  const supabase = createClientSupabaseClient();
  
  // Chama a função de sessão no servidor
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Erro ao obter sessão:", error);
    return <div>Erro ao obter sessão.</div>;
  }

  return (
    <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
