import User from '../models/User';
import { UserDAO } from '../dao/userDAO';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { Transaction } from 'sequelize';

/**
 * @class UserRepository
 * @description Repository responsabile dell’astrazione di dominio per l’entità User.
 * Si colloca tra il livello Service e il livello DAO, delegando le operazioni di persistenza
 * e convertendo gli errori del database in errori applicativi standardizzati.
 */
export class UserRepository {
    private userDAO: UserDAO;

    /**
     * @constructor
     * @description Inizializza il repository creando l’istanza del DAO dedicato agli utenti.
     * Il DAO viene utilizzato per eseguire le operazioni dirette sul database.
     */
    constructor() {
        /** Iniezione del DAO: Il repository delega le operazioni sui dati a questa istanza */
        this.userDAO = new UserDAO();
    }

    /**
     * @method getUserById
     * @description Recupera un utente tramite il suo identificativo.
     * Supporta l’esecuzione in transazione e l’eventuale lock della riga,
     * utile nelle operazioni che richiedono consistenza sui dati dell’utente.
     *
     * @param id Identificativo dell’utente da recuperare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Utente trovato oppure null se non esiste.
     * @throws Errore applicativo se il recupero dell’utente fallisce.
     */
    async getUserById(
        id: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<User | null> {
        try {
            return await this.userDAO.fetchSingle(id, transaction, lock);
        } catch (error: any) {
            throw ErrorFactory.getError('DATABASE_ERROR', `Impossibile recuperare l'utente: ${error.message}`);
        }
    }

    /**
     * @method getUserByEmail
     * @description Recupera un utente tramite indirizzo email.
     * Viene utilizzato in scenari applicativi come autenticazione,
     * ricarica token e verifiche sull’identità dell’utente.
     *
     * @param email Indirizzo email dell’utente da cercare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Utente trovato oppure null se non esiste.
     */
    async getUserByEmail(
        email: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<User | null> {
        return await this.userDAO.findByEmail(email, transaction, lock);
    }

    /**
     * @method getGlobalLeaderboard
     * @description Recupera la classifica globale degli utenti.
     * Delega al DAO l’ordinamento per punteggio e limita il numero di risultati
     * restituiti secondo il parametro indicato.
     *
     * @param limit Numero massimo di utenti da includere nella classifica.
     * @returns Lista degli utenti con punteggio più alto.
     */
    async getGlobalLeaderboard(limit: number = 10): Promise<User[]> {
        return await this.userDAO.getTopByPoints(limit);
    }

    /**
     * @method saveUserChanges
     * @description Persiste le modifiche applicate a un’istanza utente.
     * Supporta l’uso di una transazione Sequelize per rendere atomiche
     * operazioni che coinvolgono più entità, come token utente e stato partita.
     *
     * @param user Istanza dell’utente da salvare.
     * @param transaction Transazione Sequelize opzionale.
     * @returns Utente aggiornato.
     * @throws Errore applicativo se il salvataggio dell’utente fallisce.
     */
    async saveUserChanges(user: User, transaction?: Transaction): Promise<User> {
        try {
            // Permette ai Service di salvare l'utente dentro una transaction Sequelize.
            // Serve quando una singola operazione di business aggiorna più entità,
            // ad esempio: token utente + stato della partita.
            return await user.save({ transaction });
        } catch (error: any) {
            throw ErrorFactory.getError(
                'DATABASE_ERROR',
                `Salvataggio fallito: ${error.message}`
            );
        }
    }

    /**
     * @method create
     * @description Crea un nuovo utente delegando l’operazione al DAO.
     *
     * @param userData Dati dell’utente da creare.
     * @returns Utente creato.
     */
    async create(userData: any): Promise<User> {
        return await this.userDAO.create(userData);
    }
}