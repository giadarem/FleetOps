import { IDAO } from './IDAO';
import User from '../models/User';
import { Transaction } from 'sequelize';

/**
 * @interface IUserDAO
 * @description Contratto specifico per l’accesso ai dati dell’entità User.
 * Estende l’interfaccia CRUD generica definendo operazioni necessarie
 * per autenticazione, verifiche di unicità, gestione concorrente e classifica.
 */
export interface IUserDAO extends IDAO<User, string> {
    /**
     * @method findByEmail
     * @description Recupera un utente tramite indirizzo email.
     * Supporta transazioni e lock per operazioni che richiedono consistenza,
     * come autenticazione, controlli di unicità o aggiornamenti del portafoglio token.
     *
     * @param email Indirizzo email dell’utente da cercare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Utente trovato oppure null se non esiste.
     */
    findByEmail(email: string, transaction?: Transaction, lock?: boolean): Promise<User | null>;
    
    /**
     * @method getTopByPoints
     * @description Recupera gli utenti con il punteggio più alto.
     * Viene utilizzato per costruire la classifica pubblica dell’applicazione.
     *
     * @param limit Numero massimo di utenti da includere nella classifica.
     * @returns Lista degli utenti ordinati per punteggio.
     */
    getTopByPoints(limit: number): Promise<User[]>;
}