// Cadastro manual (Nova Cliente) só tem um campo "Nome" — o sobrenome fica
// vazio no banco. Sem esse fallback, o avatar mostrava só 1 letra pra essas
// clientes, mesmo com nome completo digitado (ex: "Alice Ribeiro Souza").
export function getInitials(nome?: string | null, sobrenome?: string | null): string {
  const nomeTrim = (nome || '').trim();
  const sobrenomeTrim = (sobrenome || '').trim();

  if (sobrenomeTrim) {
    return `${nomeTrim[0] || ''}${sobrenomeTrim[0] || ''}`.toUpperCase();
  }

  const partes = nomeTrim.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }
  return (partes[0]?.[0] || '').toUpperCase();
}
