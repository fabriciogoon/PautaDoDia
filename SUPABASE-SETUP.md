# Ativar as contas (Supabase) — passo a passo

O site continua no GitHub Pages. O Supabase é só o "cérebro" que guarda contas,
favoritos, anotações, plano, materiais e comentários. É grátis pra começar.

## 1. Criar o projeto (5 min)
1. Entre em **https://supabase.com** → **Start your project** → crie a conta (grátis).
2. **New project** → dê um nome, crie uma senha de banco (guarde), escolha a região
   mais perto (South America) → **Create new project**. Espere ~1 min ficar pronto.

## 2. Criar as tabelas (copiar e colar)
1. No menu do projeto, abra **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/schema.sql`** (está no projeto), copie **tudo** e cole ali.
3. Clique em **Run**. Deve aparecer "Success". Pronto — o banco está montado.

## 3. Pegar as 2 chaves e colar no site
1. No Supabase: **Project Settings** (engrenagem) → **API**.
2. Copie o **Project URL** e a chave **anon public**.
3. No projeto, abra **`assets/config.js`** e cole nos lugares indicados:
   ```js
   window.PDD = {
     url:  'https://xxxxx.supabase.co',   // seu Project URL
     anon: 'eyJhbGciOi...'                // sua chave anon public
   };
   ```
   > A chave `anon` pode ficar pública sem problema — as regras de segurança do
   > banco (RLS) já protegem os dados de cada pessoa.

## 4. (Opcional) Facilitar o cadastro
Por padrão o Supabase pede confirmação de e-mail. Pra testar rápido, você pode
desligar: **Authentication → Providers → Email** → desmarque **Confirm email** → Save.
(Depois, se quiser, religue.)

## 5. Virar administrador (pra poder postar materiais)
1. Primeiro, **crie sua conta pelo próprio site** (botão "Entrar / Criar conta").
2. Volte ao Supabase → **SQL Editor** → rode isto com o **seu e-mail**:
   ```sql
   insert into public.admins (email) values ('seu-email@exemplo.com');
   ```
3. Saia e entre de novo no site. Agora, na página **Materiais**, aparece o campo
   pra publicar (só você vê).

## 6. Subir no GitHub
Suba os arquivos novos (ou a pasta toda) no seu repositório — inclusive o
`assets/config.js` já preenchido. O GitHub Pages publica e as contas passam a funcionar.

Pronto! Qualquer pessoa cria conta, salva favoritos, faz anotações e plano, comenta
nas notícias e nos seus materiais. E só você (ADM) publica materiais.
