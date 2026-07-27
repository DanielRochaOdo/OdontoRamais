import { supabase } from "./lib/supabase";
import type { Aviso, Ramal } from "./types";

const now = new Date();

const fallbackRamais: Ramal[] = [
  { id: "sample-1", nome: "Dr. Tadeu Oliveira", numero: "2001", cargo: "Presidente", setor: "Presidência", ativo: true },
  { id: "sample-2", nome: "Amanda Miranda", numero: "2008", cargo: "Assistente de RH", setor: "RH", ativo: true },
  { id: "sample-3", nome: "Luana Santos", numero: "2015", cargo: "Supervisora", setor: "Central de Relacionamento", ativo: true },
  { id: "sample-4", nome: "Marcação", numero: "5090", cargo: "Fila de atendimento", setor: "Central de Relacionamento", ativo: true }
];

const fallbackAvisos: Aviso[] = [
  {
    id: "notice-1",
    titulo: "Janela de manutenção",
    mensagem: "Atualização de telefonia programada para 18:30. Valide redirecionamentos críticos.",
    inicio_exibicao: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    fim_exibicao: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    destaque: true,
    ativo: true
  }
];

type RamalPayload = Omit<Ramal, "id" | "created_at">;
type AvisoPayload = Omit<Aviso, "id" | "created_at">;

type LoadOptions = {
  fallbackOnMissing?: boolean;
};

function isMissingResourceError(error: { code?: string; status?: number; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.status === 404 ||
    error.message?.toLowerCase().includes("relation") === true ||
    error.message?.toLowerCase().includes("not found") === true
  );
}

function missingSchemaError(entity: string) {
  return new Error(
    `Tabela '${entity}' não encontrada no Supabase. Execute o arquivo supabase/schema.sql no projeto ${import.meta.env.VITE_SUPABASE_URL}.`
  );
}

export async function carregarRamais(options: LoadOptions = {}): Promise<Ramal[]> {
  if (!supabase) return fallbackRamais;

  const { data, error } = await supabase
    .from("ramais")
    .select("*")
    .order("setor", { ascending: true })
    .order("numero", { ascending: true });

  if (error) {
    if (options.fallbackOnMissing !== false && isMissingResourceError(error)) {
      console.warn("Tabela 'ramais' ausente no Supabase. Usando dados de demonstração.");
      return fallbackRamais;
    }
    if (isMissingResourceError(error)) throw missingSchemaError("ramais");
    throw error;
  }
  return data ?? [];
}

export async function carregarAvisos(options: LoadOptions = {}): Promise<Aviso[]> {
  if (!supabase) return fallbackAvisos;

  const { data, error } = await supabase
    .from("avisos")
    .select("*")
    .order("inicio_exibicao", { ascending: false });

  if (error) {
    if (options.fallbackOnMissing !== false && isMissingResourceError(error)) {
      console.warn("Tabela 'avisos' ausente no Supabase. Usando dados de demonstração.");
      return fallbackAvisos;
    }
    if (isMissingResourceError(error)) throw missingSchemaError("avisos");
    throw error;
  }
  return data ?? [];
}

export async function salvarRamal(payload: RamalPayload, id?: string | null) {
  if (!supabase) throw new Error("Supabase não configurado.");

  if (id) {
    const { error } = await supabase.from("ramais").update(payload).eq("id", id);
    if (error) {
      if (isMissingResourceError(error)) throw missingSchemaError("ramais");
      throw error;
    }
    return;
  }

  const { error } = await supabase.from("ramais").insert(payload);
  if (error) {
    if (isMissingResourceError(error)) throw missingSchemaError("ramais");
    throw error;
  }
}

export async function excluirRamal(id: string) {
  if (!supabase) throw new Error("Supabase não configurado.");

  const { error } = await supabase.from("ramais").delete().eq("id", id);
  if (error) {
    if (isMissingResourceError(error)) throw missingSchemaError("ramais");
    throw error;
  }
}

export async function salvarAviso(payload: AvisoPayload, id?: string | null) {
  if (!supabase) throw new Error("Supabase não configurado.");

  if (id) {
    const { error } = await supabase.from("avisos").update(payload).eq("id", id);
    if (error) {
      if (isMissingResourceError(error)) throw missingSchemaError("avisos");
      throw error;
    }
    return;
  }

  const { error } = await supabase.from("avisos").insert(payload);
  if (error) {
    if (isMissingResourceError(error)) throw missingSchemaError("avisos");
    throw error;
  }
}

export async function excluirAviso(id: string) {
  if (!supabase) throw new Error("Supabase não configurado.");

  const { error } = await supabase.from("avisos").delete().eq("id", id);
  if (error) {
    if (isMissingResourceError(error)) throw missingSchemaError("avisos");
    throw error;
  }
}
