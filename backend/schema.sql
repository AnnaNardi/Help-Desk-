CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  company TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Tecnico', 'Usuario')),
  ativo BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT,
  theme TEXT NOT NULL DEFAULT 'claro' CHECK (theme IN ('claro', 'escuro')),
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  responsavel TEXT,
  contrato_status TEXT NOT NULL CHECK (contrato_status IN ('Ativo', 'Inativo', 'Sem contrato')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_company_fk FOREIGN KEY (company) REFERENCES companies(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  company TEXT REFERENCES companies(id) ON DELETE SET NULL,
  requester TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  technician TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Alta', 'Média', 'Baixa')),
  status TEXT NOT NULL CHECK (status IN ('Aberto', 'Em andamento', 'Agendado', 'Fechado')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ,
  scheduled_note TEXT,
  closed_at TIMESTAMPTZ,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tickets ALTER COLUMN company DROP NOT NULL;

CREATE TABLE IF NOT EXISTS ticket_history (
  id TEXT PRIMARY KEY,
  ticket TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "user" TEXT REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  service_details JSONB,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  ticket TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  "user" TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preventivas (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  technician TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Agendada', 'Em andamento', 'Concluída', 'Cancelada')),
  observations TEXT,
  completed_date TIMESTAMPTZ,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "user" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  ticket TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  preventiva TEXT REFERENCES preventivas(id) ON DELETE CASCADE,
  read_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  "user" TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(ativo);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company);
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket, created);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON messages(ticket, created);
CREATE INDEX IF NOT EXISTS idx_preventivas_company ON preventivas(company);
CREATE INDEX IF NOT EXISTS idx_preventivas_technician ON preventivas(technician);
CREATE INDEX IF NOT EXISTS idx_preventivas_status ON preventivas(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("user");
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications("user", read_flag, created DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs("user");
