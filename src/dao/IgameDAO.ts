// src/dao/IGameDAO.ts
import Game from '../models/game';
import { Transaction } from 'sequelize';

/**
 * @interface IgameDAO
 * @description Contratto architetturale (Data Access Object) per l'entità Game.
 * Definisce le operazioni atomiche di lettura e scrittura sul database.
 */
export interface IGameDAO {
    
     // Inserisce un nuovo record partita.
    create(gameData: any, transaction?: Transaction): Promise<Game>;

     // Recupera una partita per la sua chiave primaria.
    findById(id: string): Promise<Game | null>;

    // Cerca una partita attiva in cui l'utente è coinvolto come player1 o player2.
    findActiveByUserId(userId: string): Promise<Game | null>;

     // Aggiorna lo stato persistito di una partita (ad esempio dopo una mossa).
    update(game: Game, transaction?: Transaction): Promise<Game>;
}