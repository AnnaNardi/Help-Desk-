-- Zera cadastros e registros de demonstração em um banco PostgreSQL existente,
-- preservando e promovendo apenas o usuário indicado em app.admin_email.
-- Execute após conferir e fazer backup. Não existe chamada automática para este arquivo.
BEGIN;

DO $$
DECLARE admin_mail TEXT := lower(current_setting('app.admin_email', true));
BEGIN
  IF admin_mail IS NULL OR admin_mail = '' THEN
    RAISE EXCEPTION 'Defina app.admin_email antes de executar a limpeza.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = admin_mail) THEN
    RAISE EXCEPTION 'O usuário administrador informado não existe; nenhum dado foi apagado.';
  END IF;
END $$;

DELETE FROM ticket_history;
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM activity_logs;
DELETE FROM tickets;
DELETE FROM preventivas;
DELETE FROM users WHERE lower(email) <> lower(current_setting('app.admin_email'));
DELETE FROM companies;
SELECT setval('ticket_number_seq', 1000, TRUE);

UPDATE users
SET role = 'Admin', ativo = TRUE, company = NULL, updated = NOW()
WHERE lower(email) = lower(current_setting('app.admin_email'));

COMMIT;
