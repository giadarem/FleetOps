-- 01_seed.sql
-- Inserimento dei dati di Seeding

INSERT INTO "Users" ("email", "password", "role") 
VALUES 
('utente@progetto.it', 'user123', 'utente')
ON CONFLICT ("email") DO NOTHING;