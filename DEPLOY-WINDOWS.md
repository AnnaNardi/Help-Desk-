# Implantação em Windows Server com PostgreSQL

O aplicativo web é servido pela API Node na porta configurada em `PORT` (o exemplo do projeto usa `3001`). A mesma API acessa o PostgreSQL; o navegador nunca recebe credenciais do banco. Em produção, publique o domínio com HTTPS por meio do proxy reverso já usado pelo cliente e mantenha PostgreSQL e Node acessíveis somente pelo servidor.

## Preparar o banco

1. Instale e inicie o PostgreSQL no servidor.
2. Crie um usuário e um banco exclusivos para o Help Desk. Não use o usuário `postgres` na aplicação.
3. Restrinja a porta `5432` à própria máquina ou à rede interna necessária.

Exemplo no console `psql` (substitua a senha por uma senha exclusiva):

```sql
CREATE ROLE helpdesk_app LOGIN PASSWORD 'SENHA-FORTE-DO-BANCO';
CREATE DATABASE helpdesk OWNER helpdesk_app;
```

## Preparar a aplicação

1. Instale uma versão suportada do Node.js no servidor.
2. Copie os arquivos do projeto, sem `.env`, `node_modules`, `dist`, `work/` nem a pasta antiga `pocketbase/`.
3. Copie as variáveis de `.env.postgres.example` para um arquivo `.env` protegido ou configure-as no serviço Windows.
4. Defina `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` e `PGPASSWORD` para o banco criado.
5. Defina `JWT_SECRET` com um segredo aleatório de pelo menos 32 caracteres.
6. Defina `INITIAL_ADMIN_PASSWORD` com uma senha forte de pelo menos 12 caracteres. O e-mail administrador de exemplo é `admin@example.com`; altere `INITIAL_ADMIN_EMAIL` para o endereço definido pelo cliente.
7. Instale dependências e gere os arquivos do frontend:

```powershell
npm.cmd ci
npm.cmd run backend:install
npm.cmd run build
```

8. Inicie a API para ela criar o esquema do banco e o usuário administrador na primeira execução:

```powershell
npm.cmd start
```

O processo deve permanecer ativo como serviço do Windows. Com o arquivo de exemplo, o Node escuta em `127.0.0.1:3001`; encaminhe o domínio HTTPS para essa porta pelo proxy reverso do cliente. Não exponha essa porta diretamente à Internet.

O primeiro acesso encontra apenas o administrador, sem empresas nem chamados de demonstração. Entre com o administrador, cadastre a empresa do cliente e depois os usuários que terão acesso.

## Limpar uma base já usada

A base nova criada pelo aplicativo recebe somente o usuário administrador. Se uma base PostgreSQL de demonstração já tiver sido usada, faça antes um backup e confira o e-mail que será preservado. Em uma sessão `psql`, rode:

```sql
SELECT set_config('app.admin_email', 'admin@example.com', false);
\i 'C:/caminho/do/projeto/backend/clean-client-data.sql'
```

O script aborta sem apagar registros se esse administrador não existir. Ele exclui chamados, mensagens, histórico, notificações, preventivas, logs, usuários adicionais e empresas. O cadastro administrador preservado fica ativo, com perfil Admin e sem empresa vinculada. A senha existente permanece a mesma.

## Desenvolvimento local no Windows

Configure o `.env` para apontar para um PostgreSQL local e rode:

```powershell
npm.cmd run backend:install
npm.cmd run dev:local
```

O frontend abre na URL `Local:` impressa pelo Vite (normalmente `http://localhost:8080`); o backend local usa `http://127.0.0.1:3001`. Se a porta `8080` estiver ocupada, o Vite seleciona outra porta. A pasta `pocketbase/` continua no computador como cópia local antiga e não participa do sistema migrado nem deve ser copiada para o cliente.

## Backup

Faça backup periódico usando `pg_dump` e teste a restauração em outra base. Proteja `.env` e os backups com permissões restritas; eles contêm credenciais e dados de chamados.
