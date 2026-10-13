# Sistema Help Desk

Aplicação web para registrar e acompanhar chamados de suporte, organizar atendimentos técnicos, gerenciar usuários e empresas e programar manutenções preventivas.

O repositório contém o código-fonte e exemplos de configuração. Não inclui credenciais, banco de dados de produção nem dados de clientes. Uma instalação nova cria as tabelas e o administrador definido pelas variáveis de ambiente.

## Funcionalidades

- Abertura, acompanhamento, atribuição, agendamento e encerramento de chamados.
- Histórico de atendimento e mensagens vinculadas aos chamados.
- Cadastro e gerenciamento de usuários e empresas.
- Perfis de acesso para administradores, técnicos e usuários solicitantes.
- Manutenções preventivas, notificações, relatórios e registros de atividade.
- Interface responsiva, suporte a tema escuro e recursos de PWA.

## Tecnologias

- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS e componentes Radix.
- **API:** Node.js.
- **Banco de dados:** PostgreSQL.
- **Desktop opcional:** Electron.

O navegador se comunica com a API. As credenciais do PostgreSQL ficam somente no ambiente do servidor, nunca no código do frontend.

## Requisitos

- Windows 10/11 para desenvolvimento ou Windows Server para implantação.
- Node.js LTS e npm.
- PostgreSQL em execução e acessível pela API.
- PowerShell para usar os scripts locais do Windows.

## Desenvolvimento local no Windows

Abra o PowerShell na pasta do projeto. Instale as dependências:

```powershell
npm.cmd install
npm.cmd run backend:install
```

Crie o arquivo `.env` a partir do modelo, caso ele ainda não exista:

```powershell
Copy-Item .env.postgres.example .env
```

> Edite `.env` com as credenciais do seu ambiente. Se já houver um `.env`, não o substitua.

Inicie a API e a interface:

```powershell
npm.cmd run dev:local
```

Abra no navegador o endereço `Local:` mostrado pelo Vite no terminal, normalmente `http://localhost:8080`. Mantenha o PowerShell aberto enquanto estiver usando a aplicação; pressione `Ctrl+C` para encerrar.

## Configuração do PostgreSQL

Crie um papel próprio para a aplicação e um banco de dados de propriedade desse papel. Exemplo executado no Query Tool do pgAdmin, conectado ao banco `postgres`:

```sql
CREATE ROLE helpdesk_app WITH LOGIN PASSWORD 'SUBSTITUA_POR_UMA_SENHA_FORTE';
```

```sql
CREATE DATABASE helpdesk OWNER helpdesk_app;
```

Não use o superusuário `postgres` na aplicação. Configure `.env` com os dados correspondentes:

```dotenv
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=helpdesk
PGUSER=helpdesk_app
PGPASSWORD=SUBSTITUA_PELA_SENHA_DO_PAPEL
PGSSL=false
JWT_SECRET=SUBSTITUA_POR_UM_SEGREDO_ALEATORIO_DE_32_CARACTERES_OU_MAIS
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_NAME=Administrador do Sistema
INITIAL_ADMIN_PASSWORD=SUBSTITUA_POR_UMA_SENHA_DE_12_CARACTERES_OU_MAIS
HOST=127.0.0.1
PORT=3001
```

Os valores acima são exemplos. Use senhas e segredos exclusivos por instalação. Para gerar um segredo aleatório no Windows com Node.js:

```powershell
node.exe -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Na primeira inicialização, a API cria as tabelas e o administrador definido em `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME` e `INITIAL_ADMIN_PASSWORD`. A senha inicial é usada apenas quando o administrador ainda não existe; alterar a variável depois não redefine a senha no banco.

## Comandos

Execute os comandos na pasta raiz do projeto:

| Comando | Descrição |
| --- | --- |
| `npm.cmd run dev:local` | Inicia a API PostgreSQL e o Vite para desenvolvimento. |
| `npm.cmd run build` | Compila a interface para produção em `dist/`. |
| `npm.cmd start` | Inicia a API Node, que serve a build de `dist/`. |
| `npm.cmd run lint` | Analisa os arquivos de `src/` com Oxlint. |
| `npm.cmd run format` | Formata os arquivos com Oxfmt. |
| `npm.cmd run desktop:dev` | Inicia o aplicativo Electron para desenvolvimento. |
| `npm.cmd run desktop:dist` | Compila e empacota o aplicativo Electron para Windows. |

O comando `npm.cmd test` ainda é apenas um marcador; não há testes automatizados configurados.

## Estrutura do projeto

```text
backend/
  server.js                 API, autenticação e acesso ao PostgreSQL
  schema.sql                Esquema e índices do banco
  clean-client-data.sql     Script manual de limpeza
  start-dev.ps1             Inicialização local no Windows
src/
  components/               Componentes de interface
  context/                  Autenticação e estado global
  pages/                    Telas da aplicação
  services/                 Acesso aos serviços da API
  types/                    Tipos TypeScript
public/                     Ícones, manifest e arquivos estáticos
electron/                   Aplicativo desktop opcional
```

## Implantação

Para preparar uma implantação em servidor:

1. Instale Node.js e PostgreSQL no servidor ou configure o acesso a uma instância PostgreSQL administrada.
2. Crie uma base e um papel exclusivos para a aplicação.
3. Configure `.env` com credenciais fortes e segredos próprios do ambiente.
4. Instale dependências, compile e inicie a API:

   ```powershell
   npm.cmd ci
   npm.cmd run backend:install
   npm.cmd run build
   npm.cmd start
   ```

5. Configure a API para executar como serviço do Windows e use um proxy HTTPS reverso. Não exponha diretamente a porta interna do Node nem a porta do PostgreSQL à Internet.
6. Planeje backups, monitoramento, certificados TLS e testes de restauração.

Veja [DEPLOY-WINDOWS.md](DEPLOY-WINDOWS.md) para notas adicionais. O serviço Windows e o proxy não são instalados automaticamente pelo projeto.

## Dados, limpeza e backups

Os dados antigos do PocketBase não são migrados automaticamente para PostgreSQL. A aplicação não cria dados de demonstração em uma instalação nova.

`backend/clean-client-data.sql` remove registros do banco e preserva somente a conta cujo e-mail for informado. A operação é destrutiva: faça e valide um backup, confira o banco conectado e confirme a conta antes de executar o script manualmente.

Exemplo no `psql`:

```sql
SELECT set_config('app.admin_email', 'admin@example.com', false);
\i 'C:/caminho/do/projeto/backend/clean-client-data.sql'
```

Para backup, use `pg_dump` e mantenha os arquivos em local protegido. A pasta `backups/` é ignorada pelo Git.

## Segurança

- `.env` não deve ser enviado ao GitHub. O modelo `.env.postgres.example` contém somente valores de exemplo.
- Não versione bancos locais, backups, logs, `node_modules/` ou arquivos gerados em `dist/`.
- Não inclua dados reais de usuários, empresas, chamados ou credenciais em capturas de tela, exemplos ou documentação.
- Use repositório privado enquanto revisa o conteúdo e decide sobre o compartilhamento do código.
- Antes de uma implantação, defina HTTPS, política de backup, controle de acesso ao servidor e rotação de credenciais.

## Limitações conhecidas

- A migração dos dados do PocketBase para PostgreSQL não está incluída.
- A implantação como serviço Windows e a configuração do proxy HTTPS são tarefas do ambiente de destino.
- A build de produção não substitui testes de integração com PostgreSQL.
- Ainda não há testes automatizados configurados.
