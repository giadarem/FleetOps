// src/repository/gameRepository.ts
import { GameDAO } from '../dao/gameDAO';
import Game from '../models/game';
import { Transaction } from 'sequelize';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class GameRepository
 * @description Repository responsabile dell’astrazione di dominio per l’entità Game.
 * Si colloca tra il livello Service e il livello DAO, coordinando l’accesso ai dati
 * e convertendo eventuali errori di persistenza in errori applicativi standardizzati.
 */
export class GameRepository {
    private gameDAO: GameDAO;

    /**
     * @constructor
     * @description Inizializza il repository creando l’istanza del DAO dedicato alle partite.
     * Il DAO viene utilizzato per delegare le operazioni dirette sul database.
     */
    constructor() {
        // Iniezione del DAO: Il repository delega tutte le query dirette a questa istanza.
        this.gameDAO = new GameDAO();
    }

    /**
     * @method createGame
     * @description Coordina la creazione di una nuova partita.
     * Supporta l’uso opzionale di una transazione Sequelize per rendere atomiche
     * operazioni correlate, come la detrazione dei token e la creazione della partita.
     *
     * @param gameData Dati della partita da creare.
     * @param transaction Transazione Sequelize opzionale da utilizzare durante la creazione.
     * @returns Partita creata.
     * @throws Errore applicativo se la creazione della partita fallisce.
     */
    async createGame(gameData: any, transaction?: Transaction): Promise<Game> {
        try {
            if (transaction) {
                return await this.gameDAO.createWithTransaction(gameData, transaction);
            }
            return await this.gameDAO.create(gameData);
        } catch (error: any) {
            throw ErrorFactory.getError('DATABASE_ERROR', `Impossibile creare la partita: ${error.message}`);
        }
    }

    /**
     * @method getById
     * @description Recupera una partita tramite il suo identificativo.
     * Può essere eseguito all’interno di una transazione e con lock della riga,
     * utile nelle operazioni che richiedono consistenza dello stato di gioco.
     *
     * @param id Identificativo della partita da recuperare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Partita trovata oppure null se non esiste.
     * @throws Errore applicativo se il recupero della partita fallisce.
     */
    async getById(
        id: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<Game | null> {
        try {
            return await this.gameDAO.fetchSingle(id, transaction, lock);
        } catch (error: any) {
            throw ErrorFactory.getError('DATABASE_ERROR', `Errore nel recupero della partita: ${error.message}`);
        }
    }

    /**
     * @method getActiveGameByUserId
     * @description Recupera l’eventuale partita attiva associata a un utente.
     * Delega al DAO la ricerca sui ruoli di giocatore e supporta transazioni
     * e lock per gestire correttamente scenari concorrenti.
     *
     * @param userId Identificativo dell’utente da verificare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Partita attiva trovata oppure null se l’utente non ha partite in corso.
     * @throws Errore applicativo se la verifica delle partite attive fallisce.
     */
    async getActiveGameByUserId(
        userId: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<Game | null> {
        try {
            return await this.gameDAO.findActiveByUserId(userId, transaction, lock);
        } catch (error: any) {
            throw ErrorFactory.getError('DATABASE_ERROR', `Errore nella verifica delle partite attive: ${error.message}`);
        }
    }

    /**
     * @method updateGame
     * @description Persiste lo stato aggiornato di una partita.
     * Viene utilizzato dopo operazioni di dominio che modificano la partita,
     * come mosse, conclusione, abbandono o aggiornamento del vincitore.
     *
     * @param game Istanza della partita da salvare.
     * @param transaction Transazione Sequelize opzionale.
     * @returns Partita aggiornata.
     * @throws Errore applicativo se l’aggiornamento dello stato della partita fallisce.
     */
    async updateGame(game: Game, transaction?: Transaction): Promise<Game> {
        try {
            return await this.gameDAO.updateStateWithTransaction(game, transaction);
        } catch (error: any) {
            throw ErrorFactory.getError('DATABASE_ERROR', `Impossibile aggiornare lo stato della partita: ${error.message}`);
        }
    }

    /**
     * @method getAllUserGamesWithEmails
     * @description Recupera lo storico delle partite associate a un utente includendo le email dei partecipanti.
     * Mantiene nel DAO la complessità della query e restituisce al livello Service
     * dati già arricchiti per la costruzione della risposta applicativa.
     *
     * @param userId Identificativo dell’utente di cui recuperare lo storico partite.
     * @returns Lista delle partite dell’utente con le email dei giocatori coinvolti.
     * @throws Errore applicativo se il recupero dello storico partite fallisce.
     */
    async getAllUserGamesWithEmails(userId: string): Promise<Game[]> {
        try {
            return await this.gameDAO.fetchUserGamesWithEmails(userId);
        } catch (error: any) {
            throw ErrorFactory.getError('DATABASE_ERROR', `Errore nel recupero dello storico partite: ${error.message}`);
        }
    }
}