// Mantém o banco do Supabase (plano grátis) ativo.
//
// O Supabase pausa projetos grátis que ficam 7 dias sem consultas. Esta função
// agendada faz uma leitura real no catálogo a cada 2 dias (UTC), o que zera o
// contador de inatividade. Só roda em deploys de produção.
//
// Use apenas a chave pública (publishable): a mesma que o site já usa no
// navegador. Nenhum segredo entra aqui.

export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("keep-alive: variáveis do Supabase não configuradas");
    return new Response("missing env", { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/catalog_products?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    console.error(`keep-alive: Supabase respondeu ${res.status}`);
    return new Response("supabase error", { status: 502 });
  }

  console.log("keep-alive: ok");
  return new Response("ok");
};

export const config = {
  schedule: "0 12 */2 * *",
};
