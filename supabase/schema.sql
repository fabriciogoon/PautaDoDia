-- ============================================================================
-- Pauta do Dia — banco de dados (Supabase / Postgres)
-- Cole TODO este conteúdo no Supabase → SQL Editor → New query → Run.
-- Ele cria as tabelas de contas, favoritos, anotações, plano, posts e comentários,
-- já com as regras de segurança (cada um só mexe no que é seu; só o ADM posta).
-- ============================================================================

-- ───────────────────────── perfis (nome de exibição) ───────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  nome       text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "perfil visível" on public.profiles;
create policy "perfil visível" on public.profiles for select using (true);
drop policy if exists "cria próprio perfil" on public.profiles;
create policy "cria próprio perfil" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "edita próprio perfil" on public.profiles;
create policy "edita próprio perfil" on public.profiles for update using (auth.uid() = id);

-- cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── quem é ADM (por e-mail) ─────────────────────────
create table if not exists public.admins ( email text primary key );
-- >>> DEPOIS de criar sua conta no site, rode UMA vez (troque pelo seu e-mail):
--     insert into public.admins (email) values ('seu-email@exemplo.com');

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email'));
$$;

-- ───────────────────────────── favoritos ───────────────────────────────────
create table if not exists public.favoritos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  pauta_id   text not null,
  titulo     text, url text, fonte text,
  created_at timestamptz default now(),
  unique (user_id, pauta_id)
);
alter table public.favoritos enable row level security;
drop policy if exists "vê próprios favoritos" on public.favoritos;
create policy "vê próprios favoritos" on public.favoritos for select using (auth.uid() = user_id);
drop policy if exists "cria próprio favorito" on public.favoritos;
create policy "cria próprio favorito" on public.favoritos for insert with check (auth.uid() = user_id);
drop policy if exists "apaga próprio favorito" on public.favoritos;
create policy "apaga próprio favorito" on public.favoritos for delete using (auth.uid() = user_id);

-- ───────────────────────────── anotações ───────────────────────────────────
create table if not exists public.anotacoes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  texto      text not null,
  created_at timestamptz default now()
);
alter table public.anotacoes enable row level security;
drop policy if exists "vê próprias notas" on public.anotacoes;
create policy "vê próprias notas" on public.anotacoes for select using (auth.uid() = user_id);
drop policy if exists "cria própria nota" on public.anotacoes;
create policy "cria própria nota" on public.anotacoes for insert with check (auth.uid() = user_id);
drop policy if exists "apaga própria nota" on public.anotacoes;
create policy "apaga própria nota" on public.anotacoes for delete using (auth.uid() = user_id);

-- ─────────────────────────── plano de ação ─────────────────────────────────
create table if not exists public.plano_itens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  texto      text not null,
  feito      boolean default false,
  created_at timestamptz default now()
);
alter table public.plano_itens enable row level security;
drop policy if exists "vê próprio plano" on public.plano_itens;
create policy "vê próprio plano" on public.plano_itens for select using (auth.uid() = user_id);
drop policy if exists "cria item plano" on public.plano_itens;
create policy "cria item plano" on public.plano_itens for insert with check (auth.uid() = user_id);
drop policy if exists "edita item plano" on public.plano_itens;
create policy "edita item plano" on public.plano_itens for update using (auth.uid() = user_id);
drop policy if exists "apaga item plano" on public.plano_itens;
create policy "apaga item plano" on public.plano_itens for delete using (auth.uid() = user_id);

-- ─────────────────────── posts do ADM (materiais) ──────────────────────────
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  conteudo   text not null,
  autor      text,
  created_at timestamptz default now()
);
alter table public.posts enable row level security;
drop policy if exists "posts públicos" on public.posts;
create policy "posts públicos" on public.posts for select using (true);
drop policy if exists "só adm cria post" on public.posts;
create policy "só adm cria post" on public.posts for insert with check (public.is_admin());
drop policy if exists "só adm edita post" on public.posts;
create policy "só adm edita post" on public.posts for update using (public.is_admin());
drop policy if exists "só adm apaga post" on public.posts;
create policy "só adm apaga post" on public.posts for delete using (public.is_admin());

-- ───────────────────────────── comentários ─────────────────────────────────
-- servem tanto pros posts do ADM quanto pras notícias (pautas).
create table if not exists public.comentarios (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  alvo_tipo  text not null check (alvo_tipo in ('post','pauta')),
  alvo_id    text not null,
  autor_nome text,
  texto      text not null,
  created_at timestamptz default now()
);
alter table public.comentarios enable row level security;
drop policy if exists "comentários públicos" on public.comentarios;
create policy "comentários públicos" on public.comentarios for select using (true);
drop policy if exists "logado comenta" on public.comentarios;
create policy "logado comenta" on public.comentarios for insert with check (auth.uid() = user_id);
drop policy if exists "apaga próprio comentário" on public.comentarios;
create policy "apaga próprio comentário" on public.comentarios for delete using (auth.uid() = user_id or public.is_admin());

create index if not exists comentarios_alvo_idx on public.comentarios (alvo_tipo, alvo_id, created_at);
create index if not exists posts_data_idx on public.posts (created_at desc);
