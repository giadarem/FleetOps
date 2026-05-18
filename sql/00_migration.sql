/**
 * FLEETOPS - DATABASE SCHEMA (PostgreSQL)
 * Progetto: Battaglia Navale Backend
 * Obiettivo: Gestione stato partite, economia a token e storico mosse.
 * Architettura: Ottimizzata con JSONB per massime prestazioni di lettura/scrittura dello stato.
 */

-- ======== CLEANUP VECCHIO SCHEMA ==============
DROP TABLE IF EXISTS "Moves" CASCADE;
DROP TABLE IF EXISTS "PlayerBoards" CASCADE;
DROP TABLE IF EXISTS "Games" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

DROP TYPE IF EXISTS "enum_Moves_result" CASCADE;
DROP TYPE IF EXISTS "enum_Games_type" CASCADE;
DROP TYPE IF EXISTS "enum_Games_status" CASCADE;
DROP TYPE IF EXISTS "enum_Users_role" CASCADE;


-- =========== 1. DEFINIZIONE ENUM CUSTOM ===================
-- Definisce i permessi d'accesso: ADMIN per ricariche, USER per il gioco
CREATE TYPE "enum_Users_role" AS ENUM ('USER', 'ADMIN');

-- Distingue le partite tra giocatore vs giocatore e giocatore vs IA
CREATE TYPE "enum_Games_type" AS ENUM ('PVP', 'PVE');

-- Macchina a stati della partita: gestisce il ciclo di vita dall'attesa alla conclusione
CREATE TYPE "enum_Games_status" AS ENUM ('PENDING', 'ACTIVE', 'FINISHED', 'ABANDONED');


-- ============= 2. TABELLA: Users ==============
CREATE TABLE "Users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" "enum_Users_role" NOT NULL DEFAULT 'USER',
    
    -- tokenBalance supporta decimali per gestire costi precisi
    "tokenBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    -- Punteggio accumulato per la Leaderboard (1 pt vittoria, 0.5 pt abbandono).
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========== 3. TABELLA: Games ===================
CREATE TABLE "Games" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    "type" "enum_Games_type" NOT NULL DEFAULT 'PVE',
    
    -- Chiavi esterne verso i giocatori. player2Id è NULL se la partita è contro l'IA (PvE).
    "player1Id" UUID NOT NULL REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "player2Id" UUID REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE SET NULL,
    
    "status" "enum_Games_status" NOT NULL DEFAULT 'ACTIVE',
    
    -- FK opzionale verso il vincitore; aggiornata a fine match. 
    "winnerId" UUID REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE SET NULL,
    
    -- IL CORE DEL GIOCO: Contiene gridSize, shipTypes, plance, navi e storico mosse.
    "gameState" JSONB NOT NULL,
    
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);