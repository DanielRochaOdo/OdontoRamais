import "./style.css";
import {
  carregarAvisos,
  carregarRamais,
  excluirAviso,
  excluirRamal,
  salvarAviso,
  salvarRamal
} from "./data";
import { supabase, supabaseEnabled } from "./lib/supabase";
import type { Aviso, Ramal } from "./types";
import { escapeHtml, formatDateTime, fromInputDateTime, isAvisoAtivo, toInputDateTime } from "./utils";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Container principal não encontrado.");
}

const root = app;

let ramais: Ramal[] = [];
let avisos: Aviso[] = [];
let ramalEditando: string | null = null;
let avisoEditando: string | null = null;

async function render() {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;

  if (!supabaseEnabled || !supabase) {
    root.innerHTML = `
      <div class="page-shell">
        <section class="auth-card">
          <span class="legacy-label">Admin</span>
          <h1>Configuração necessária</h1>
          <p>Configure o Supabase para habilitar a área administrativa.</p>
        </section>
      </div>
    `;
    return;
  }

  if (!session) {
    renderLogin();
    return;
  }

  try {
    [ramais, avisos] = await Promise.all([
      carregarRamais({ fallbackOnMissing: false }),
      carregarAvisos({ fallbackOnMissing: false })
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar dados administrativos.";
    root.innerHTML = `
      <div class="page-shell">
        <section class="auth-card">
          <span class="legacy-label">Admin</span>
          <h1>Banco não preparado</h1>
          <p>${escapeHtml(message)}</p>
          <p class="fine-print">Execute <code>supabase/schema.sql</code> no projeto Supabase e recarregue esta página.</p>
        </section>
      </div>
    `;
    return;
  }

  const ramalAtual = ramais.find((item) => item.id === ramalEditando) ?? null;
  const avisoAtual = avisos.find((item) => item.id === avisoEditando) ?? null;

  root.innerHTML = `
    <div class="page-shell">
      <section class="legacy-shell admin-legacy-shell">
        <header class="legacy-header admin-header">
          <div class="brand-mark" aria-label="Odontoart">
            <img src="/logo.png" alt="Odontoart" class="brand-image" />
          </div>
          <div class="legacy-title-wrap">
            <h1>ADMIN RAMAIS</h1>
          </div>
          <div class="admin-userbar">
            <span class="admin-session">${escapeHtml(session.user.email ?? "Administrador")}</span>
            <button class="legacy-button danger-lite" id="logout-button" type="button">Sair</button>
          </div>
        </header>

        <section class="admin-grid">
          <article class="admin-panel-block">
            <div class="panel-head">
              <div>
                <span class="legacy-label">Cadastro</span>
                <h2>${ramalAtual ? "Editar ramal" : "Novo ramal"}</h2>
              </div>
            </div>
            <form id="ramal-form" class="form-grid">
              <input class="legacy-input" name="nome" placeholder="Nome" value="${escapeHtml(ramalAtual?.nome ?? "")}" required />
              <input class="legacy-input" name="numero" placeholder="Número" value="${escapeHtml(ramalAtual?.numero ?? "")}" required />
              <input class="legacy-input" name="cargo" placeholder="Cargo" value="${escapeHtml(ramalAtual?.cargo ?? "")}" required />
              <input class="legacy-input" name="setor" placeholder="Setor" value="${escapeHtml(ramalAtual?.setor ?? "")}" required />
              <input class="legacy-input" name="email" placeholder="E-mail opcional" value="${escapeHtml(ramalAtual?.email ?? "")}" />
              <textarea class="legacy-input admin-textarea" name="observacoes" placeholder="Observações">${escapeHtml(ramalAtual?.observacoes ?? "")}</textarea>
              <label class="toggle-row">
                <input type="checkbox" name="ativo" ${ramalAtual?.ativo ?? true ? "checked" : ""} />
                <span>Ramal ativo</span>
              </label>
              <div class="action-row">
                <button class="legacy-button" type="submit">${ramalAtual ? "Salvar ramal" : "Cadastrar ramal"}</button>
                <button class="legacy-button secondary-button" id="reset-ramal" type="button">Limpar</button>
              </div>
            </form>
          </article>

          <article class="admin-panel-block">
            <div class="panel-head">
              <div>
                <span class="legacy-label">Avisos</span>
                <h2>${avisoAtual ? "Editar aviso" : "Novo aviso"}</h2>
              </div>
            </div>
            <form id="aviso-form" class="form-grid">
              <input class="legacy-input" name="titulo" placeholder="Título" value="${escapeHtml(avisoAtual?.titulo ?? "")}" required />
              <textarea class="legacy-input admin-textarea" name="mensagem" placeholder="Mensagem" required>${escapeHtml(avisoAtual?.mensagem ?? "")}</textarea>
              <input class="legacy-input" name="inicio_exibicao" type="datetime-local" value="${avisoAtual ? toInputDateTime(avisoAtual.inicio_exibicao) : ""}" required />
              <input class="legacy-input" name="fim_exibicao" type="datetime-local" value="${avisoAtual ? toInputDateTime(avisoAtual.fim_exibicao) : ""}" required />
              <label class="toggle-row">
                <input type="checkbox" name="destaque" ${avisoAtual?.destaque ? "checked" : ""} />
                <span>Destacar aviso</span>
              </label>
              <label class="toggle-row">
                <input type="checkbox" name="ativo" ${avisoAtual?.ativo ?? true ? "checked" : ""} />
                <span>Aviso ativo</span>
              </label>
              <div class="action-row">
                <button class="legacy-button" type="submit">${avisoAtual ? "Salvar aviso" : "Programar aviso"}</button>
                <button class="legacy-button secondary-button" id="reset-aviso" type="button">Limpar</button>
              </div>
            </form>
          </article>

          <article class="admin-panel-block span-two">
            <div class="panel-head">
              <div>
                <span class="legacy-label">Operação</span>
                <h2>Ramais cadastrados</h2>
              </div>
            </div>
            <div class="legacy-table-wrap">
              <table class="legacy-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Número</th>
                    <th>Cargo</th>
                    <th>Setor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${ramais
                    .map(
                      (ramal) => `
                        <tr>
                          <td>${escapeHtml(ramal.nome)}</td>
                          <td>${escapeHtml(ramal.numero)}</td>
                          <td>${escapeHtml(ramal.cargo)}</td>
                          <td>${escapeHtml(ramal.setor)}</td>
                          <td>${ramal.ativo ? "Ativo" : "Inativo"}</td>
                          <td class="table-actions">
                            <button class="legacy-button secondary-button" data-edit-ramal="${ramal.id}" type="button">Editar</button>
                            <button class="legacy-button danger-lite" data-delete-ramal="${ramal.id}" type="button">Excluir</button>
                          </td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </article>

          <article class="admin-panel-block span-two">
            <div class="panel-head">
              <div>
                <span class="legacy-label">Agenda</span>
                <h2>Avisos programados</h2>
              </div>
            </div>
            <div class="legacy-table-wrap">
              <table class="legacy-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Período</th>
                    <th>Destaque</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${avisos
                    .map(
                      (aviso) => `
                        <tr>
                          <td>${escapeHtml(aviso.titulo)}</td>
                          <td>${formatDateTime(aviso.inicio_exibicao)} até ${formatDateTime(aviso.fim_exibicao)}</td>
                          <td>${aviso.destaque ? "Sim" : "Não"}</td>
                          <td>${isAvisoAtivo(aviso) ? "Em exibição" : aviso.ativo ? "Agendado" : "Pausado"}</td>
                          <td class="table-actions">
                            <button class="legacy-button secondary-button" data-edit-aviso="${aviso.id}" type="button">Editar</button>
                            <button class="legacy-button danger-lite" data-delete-aviso="${aviso.id}" type="button">Excluir</button>
                          </td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </section>
    </div>
  `;

  bindAdminEvents();
}

function renderLogin() {
  root.innerHTML = `
    <div class="page-shell">
      <section class="auth-card">
        <span class="legacy-label">Admin protegido</span>
        <h1>Acesso administrativo</h1>
        <p>Entre com o usuário autorizado no Supabase Auth para gerenciar ramais e avisos.</p>
        <form id="login-form" class="form-grid auth-form">
          <input class="legacy-input" name="email" type="email" placeholder="E-mail" required />
          <input class="legacy-input" name="password" type="password" placeholder="Senha" required />
          <button class="legacy-button" type="submit">Entrar</button>
        </form>
      </section>
    </div>
  `;

  document.querySelector<HTMLFormElement>("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);

    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? "")
      });
      if (error) throw error;
      await render();
    } catch (error) {
      console.error(error);
      window.alert("Falha no login administrativo.");
    }
  });
}

function bindAdminEvents() {
  document.querySelector<HTMLButtonElement>("#logout-button")?.addEventListener("click", async () => {
    await supabase!.auth.signOut();
    ramalEditando = null;
    avisoEditando = null;
    renderLogin();
  });

  document.querySelector<HTMLButtonElement>("#reset-ramal")?.addEventListener("click", () => {
    ramalEditando = null;
    void render();
  });

  document.querySelector<HTMLButtonElement>("#reset-aviso")?.addEventListener("click", () => {
    avisoEditando = null;
    void render();
  });

  document.querySelector<HTMLFormElement>("#ramal-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);

    try {
      await salvarRamal(
        {
          nome: String(form.get("nome") ?? ""),
          numero: String(form.get("numero") ?? ""),
          cargo: String(form.get("cargo") ?? ""),
          setor: String(form.get("setor") ?? ""),
          email: String(form.get("email") ?? "") || null,
          observacoes: String(form.get("observacoes") ?? "") || null,
          ativo: form.get("ativo") === "on"
        },
        ramalEditando
      );
      ramalEditando = null;
      await render();
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível salvar o ramal.");
    }
  });

  document.querySelector<HTMLFormElement>("#aviso-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);

    try {
      await salvarAviso(
        {
          titulo: String(form.get("titulo") ?? ""),
          mensagem: String(form.get("mensagem") ?? ""),
          inicio_exibicao: fromInputDateTime(String(form.get("inicio_exibicao") ?? "")),
          fim_exibicao: fromInputDateTime(String(form.get("fim_exibicao") ?? "")),
          destaque: form.get("destaque") === "on",
          ativo: form.get("ativo") === "on"
        },
        avisoEditando
      );
      avisoEditando = null;
      await render();
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível salvar o aviso.");
    }
  });

  document.querySelectorAll<HTMLElement>("[data-edit-ramal]").forEach((button) => {
    button.addEventListener("click", () => {
      ramalEditando = button.dataset.editRamal ?? null;
      void render();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-delete-ramal]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteRamal;
      if (!id || !window.confirm("Excluir este ramal?")) return;

      try {
        await excluirRamal(id);
        await render();
      } catch (error) {
        console.error(error);
        window.alert("Não foi possível excluir o ramal.");
      }
    });
  });

  document.querySelectorAll<HTMLElement>("[data-edit-aviso]").forEach((button) => {
    button.addEventListener("click", () => {
      avisoEditando = button.dataset.editAviso ?? null;
      void render();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-delete-aviso]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteAviso;
      if (!id || !window.confirm("Excluir este aviso?")) return;

      try {
        await excluirAviso(id);
        await render();
      } catch (error) {
        console.error(error);
        window.alert("Não foi possível excluir o aviso.");
      }
    });
  });
}

if (supabase) {
  supabase.auth.onAuthStateChange(() => {
    void render();
  });
}

void render();
