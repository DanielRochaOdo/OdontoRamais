export type Ramal = {
  id: string;
  nome: string;
  numero: string;
  cargo: string;
  setor: string;
  email?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string;
};

export type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  inicio_exibicao: string;
  fim_exibicao: string;
  destaque: boolean;
  ativo: boolean;
  created_at?: string;
};
