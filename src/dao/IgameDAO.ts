import { IDAO } from './IDAO';
import Game from '../models/game';
import { Transaction } from 'sequelize';

/**
 * @interface IGameDAO
 * @description Contratto architetturale per l’accesso ai dati dell’entità Game.
 * Estende l’interfaccia CRUD generica aggiungendo operazioni specifiche del dominio di gioco
 * e il supporto alle transazioni Sequelize per le operazioni che richiedono atomicità.
 */
export interface IGameDAO extends IDAO<Game, string> {
    /**
     * @method findActiveByUserId
     * @description Recupera l’eventuale partita attiva associata a un utente.
     * Supporta l’uso di transazioni e lock per garantire consistenza nelle operazioni concorrenti.
     *
     * @param userId Identificativo dell’utente di cui cercare la partita attiva.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Partita attiva trovata oppure null se non esiste.
     */
    findActiveByUserId(userId: string, transaction?: Transaction, lock?: boolean): Promise<Game | null>;
    
    /**
     * @method createWithTransaction
     * @description Crea una nuova partita all’interno di una transazione Sequelize.
     * Viene usato quando la creazione della partita deve essere coordinata
     * con altre scritture, come l’aggiornamento dei token dell’utente.
     *
     * @param gameData Dati della partita da creare.
     * @param transaction Transazione Sequelize da utilizzare.
     * @returns Partita creata.
     */
    createWithTransaction(gameData: any, transaction: Transaction): Promise<Game>;

    /**
     * @method updateStateWithTransaction
     * @description Salva lo stato aggiornato di una partita, eventualmente dentro una transazione Sequelize.
     * Permette di rendere atomiche le modifiche allo stato della partita insieme ad altre operazioni correlate.
     *
     * @param game Istanza della partita da salvare.
     * @param transaction Transazione Sequelize opzionale.
     * @returns Partita aggiornata.
     */
    updateStateWithTransaction(game: Game, transaction?: Transaction): Promise<Game>;
}