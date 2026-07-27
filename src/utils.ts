import type { Aviso, Ramal } from "./types";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function toInputDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromInputDateTime(value: string) {
  return new Date(value).toISOString();
}

export function isAvisoAtivo(aviso: Aviso) {
  const current = Date.now();
  return (
    aviso.ativo &&
    new Date(aviso.inicio_exibicao).getTime() <= current &&
    new Date(aviso.fim_exibicao).getTime() >= current
  );
}

export function agruparPorSetor(lista: Ramal[]) {
  return [...lista]
    .filter((ramal) => ramal.ativo)
    .sort((a, b) => {
      const setor = a.setor.localeCompare(b.setor, "pt-BR");
      if (setor !== 0) return setor;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    })
    .reduce<Record<string, Ramal[]>>((acc, ramal) => {
      acc[ramal.setor] ??= [];
      acc[ramal.setor].push(ramal);
      return acc;
    }, {});
}
