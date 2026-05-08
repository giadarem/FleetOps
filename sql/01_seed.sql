-- Inserimento degli Utenti (Admin e due giocatori demo con 10 token)
-- ID generati staticamente per poter creare le relazioni sottostanti in modo coerente
INSERT INTO "Users" ("id", "email", "password", "role", "tokenBalance", "points", "createdAt", "updatedAt")
VALUES 
-- password: password123
('a0000000-0000-0000-0000-000000000000', 'admin@fleetops.com', '$2b$10$9HwoL5MG5ERHhUDkbCm8Hel5GNK8JrfZZVtc8l0Jy4q0p/fxaPnfW', 'ADMIN', 1000.0, 0.0, NOW(), NOW()),
('b0000000-0000-0000-0000-000000000001', 'player1@fleetops.com', '$2b$10$9HwoL5MG5ERHhUDkbCm8Hel5GNK8JrfZZVtc8l0Jy4q0p/fxaPnfW', 'USER', 10.0, 1.0, NOW(), NOW()),
('b0000000-0000-0000-0000-000000000002', 'player2@fleetops.com', '$2b$10$9HwoL5MG5ERHhUDkbCm8Hel5GNK8JrfZZVtc8l0Jy4q0p/fxaPnfW', 'USER', 9.775, 0.0, NOW(), NOW());

-- Inserimento di una Partita Demo conclusa (PVP)
INSERT INTO "Games" ("id", "type", "status", "gridSize", "winnerId", "createdAt", "updatedAt")
VALUES 
('c0000000-0000-0000-0000-000000000001', 'PVP', 'FINISHED', 22, 'b0000000-0000-0000-0000-000000000001', NOW(), NOW());

-- Inserimento delle Plance di Gioco collegate alla partita demo (con le navi in formato JSONB)
INSERT INTO "PlayerBoards" ("id", "gameId", "userId", "shipsPlacement", "createdAt", "updatedAt")
VALUES 
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '{"destroyer": [[0,0],[0,1]], "submarine": [[5,5],[5,6],[5,7]]}'::jsonb, NOW(), NOW()),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '{"destroyer": [[10,10],[10,11]], "submarine": [[15,15],[15,16],[15,17]]}'::jsonb, NOW(), NOW());

-- Inserimento delle mosse nello storico della partita demo
INSERT INTO "Moves" ("id", "gameId", "userId", "x", "y", "result", "createdAt", "updatedAt")
VALUES 
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 10, 10, 'HIT', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '3 minutes'),
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 0, 0, 'HIT', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '2 minutes'),
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 10, 11, 'SUNK', NOW() - INTERVAL '1 minute', NOW() - INTERVAL '1 minute');