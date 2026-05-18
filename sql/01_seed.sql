-- Inserimento degli Utenti (Admin e due giocatori demo con 10 token)
-- ID generati staticamente per poter creare le relazioni sottostanti in modo coerente
INSERT INTO "Users" ("id", "email", "password", "role", "tokenBalance", "points", "createdAt", "updatedAt")
VALUES 
-- password: password123
('a0000000-0000-0000-0000-000000000000', 'admin@fleetops.com', '$2b$10$9HwoL5MG5ERHhUDkbCm8Hel5GNK8JrfZZVtc8l0Jy4q0p/fxaPnfW', 'ADMIN', 1000.0, 0.0, NOW(), NOW()),
('b0000000-0000-0000-0000-000000000001', 'player1@fleetops.com', '$2b$10$9HwoL5MG5ERHhUDkbCm8Hel5GNK8JrfZZVtc8l0Jy4q0p/fxaPnfW', 'USER', 10.0, 1.0, NOW(), NOW()),
('b0000000-0000-0000-0000-000000000002', 'player2@fleetops.com', '$2b$10$9HwoL5MG5ERHhUDkbCm8Hel5GNK8JrfZZVtc8l0Jy4q0p/fxaPnfW', 'USER', 0.2, 0.0, NOW(), NOW());


-- ============ INSERIMENTO PARTITA ===================
INSERT INTO "Games" ("id", "type", "player1Id", "player2Id", "status", "winnerId", "gameState", "createdAt", "updatedAt")
VALUES 
(
  'c0000000-0000-0000-0000-000000000001', 
  'PVP',                                  -- type (Aggiunto per matchare lo schema)
  'b0000000-0000-0000-0000-000000000001', -- player1Id
  'b0000000-0000-0000-0000-000000000002', -- player2Id
  'FINISHED',                             -- status
  'b0000000-0000-0000-0000-000000000001', -- winnerId (Player 1 ha vinto)
  
  -- Inizio del campo JSONB
  '{
    "configuration": {
      "gridSize": 22,
      "shipTypes": [
        { "type": 1, "size": 2, "count": 1 },
        { "type": 2, "size": 3, "count": 1 }
      ]
    },
    
    "player1Board": {
      "ships": [
        {
          "type": 1, "size": 2, 
          "coordinates": [{"x": 0, "y": 0}, {"x": 0, "y": 1}], 
          "hits": [true, false], 
          "isSunk": false
        },
        {
          "type": 2, "size": 3, 
          "coordinates": [{"x": 5, "y": 5}, {"x": 5, "y": 6}, {"x": 5, "y": 7}], 
          "hits": [false, false, false], 
          "isSunk": false
        }
      ],
      "shotsReceived": [{"x": 0, "y": 0}]
    },
    
    "player2Board": {
      "ships": [
        {
          "type": 1, "size": 2, 
          "coordinates": [{"x": 10, "y": 10}, {"x": 10, "y": 11}], 
          "hits": [true, true], 
          "isSunk": true
        },
        {
          "type": 2, "size": 3, 
          "coordinates": [{"x": 15, "y": 15}, {"x": 15, "y": 16}, {"x": 15, "y": 17}], 
          "hits": [false, false, false], 
          "isSunk": false
        }
      ],
      "shotsReceived": [{"x": 10, "y": 10}, {"x": 10, "y": 11}]
    },
    
    "currentTurn": "b0000000-0000-0000-0000-000000000002",
    
    "history": [
      {
        "playerId": "b0000000-0000-0000-0000-000000000001",
        "x": 10, "y": 10,
        "result": "HIT",
        "timestamp": "2026-05-09T08:00:00Z"
      },
      {
        "playerId": "b0000000-0000-0000-0000-000000000002",
        "x": 0, "y": 0,
        "result": "HIT",
        "timestamp": "2026-05-09T08:01:00Z"
      },
      {
        "playerId": "b0000000-0000-0000-0000-000000000001",
        "x": 10, "y": 11,
        "result": "SUNK",
        "timestamp": "2026-05-09T08:02:00Z"
      }
    ]
  }'::jsonb, 
  
  NOW(), 
  NOW()
);