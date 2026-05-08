/**
 * FLEETOPS - DATABASE SCHEMA (PostgreSQL)
 * Progetto: Battaglia Navale Backend
 * Obiettivo: Gestione stato partite, economia a token e storico mosse.
 */

-- =============================================================================
-- DEFINIZIONE ENUM CUSTOM 

-- Definisce i permessi d'accesso: ADMIN per ricariche, USER per il gioco
CREATE TYPE "enum_Users_role" AS ENUM ('USER', 'ADMIN');

-- Specifica la modalità di gioco per attivare o meno la logica IA.
CREATE TYPE "enum_Games_type" AS ENUM ('PVP', 'PVE');

-- Macchina a stati della partita: gestisce il ciclo di vita dall'attesa alla conclusione.
CREATE TYPE "enum_Games_status" AS ENUM ('PENDING', 'ACTIVE', 'FINISHED', 'ABANDONED');

-- Risultato atomico di ogni mossa effettuata sulla griglia.
CREATE TYPE "enum_Moves_result" AS ENUM ('MISS', 'HIT', 'SUNK');

-- =============================================================================
-- TABELLA: Users
-- Gestisce l'identità, il sistema economico a token e le statistiche globali

CREATE TABLE "Users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" "enum_Users_role" NOT NULL DEFAULT 'USER',
    
    -- tokenBalance supporta decimali per gestire costi precisi (es: 0.025 per mossa).
    "tokenBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    -- Punteggio accumulato per la Leaderboard (1 pt vittoria, 0.5 pt abbandono).
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    -- Timestamps automatici richiesti da Sequelize per il tracciamento modifiche. 
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. TABELLA: Games
-- Entità centrale che aggrega i partecipanti e definisce le regole del match.

CREATE TABLE "Games" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" "enum_Games_type" NOT NULL,
    "status" "enum_Games_status" NOT NULL DEFAULT 'PENDING',
    
    -- Dimensione della griglia (necessariamente quadrata)
    "gridSize" INTEGER NOT NULL DEFAULT 22,
    
    -- FK opzionale verso il vincitore; aggiornata a fine match. 
    "winnerId" UUID REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE SET NULL,
    
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. TABELLA: PlayerBoards
-- Rappresenta la plancia di gioco di uno specifico giocatore in una partita.

CREATE TABLE "PlayerBoards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relazione 1:N con la partita (ON DELETE CASCADE pulisce le plance se il game viene eliminato).
    "gameId" UUID NOT NULL REFERENCES "Games"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- Se NULL, la plancia appartiene all'Intelligenza Artificiale (IA).
    "userId" UUID REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- shipsPlacement salva le coordinate delle navi in formato JSON. 
    -- JSONB è ideale per flessibilità (diverse tipologie di navi) e performance. 
    "shipsPlacement" JSONB NOT NULL,
    
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. TABELLA: Moves
-- Event Log di ogni azione compiuta. Permette di ricostruire lo storico completo.

CREATE TABLE "Moves" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "gameId" UUID NOT NULL REFERENCES "Games"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- Identifica chi ha effettuato la mossa (NULL per l'IA).
    "userId" UUID REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "result" "enum_Moves_result" NOT NULL,
    
    -- L'ordinamento cronologico permette la gestione dei turni e la rotta dello storico JSON.
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);