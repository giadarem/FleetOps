import User from '../models/User';
import { IUserDAO } from './IuserDAO';
import { Op, Transaction } from 'sequelize';

/**
 * @class UserDAO
 * @description Implementazione concreta del pattern DAO per l’entità User.
 * Si colloca nel livello DAO dell’architettura e gestisce esclusivamente
 * l’accesso al database tramite Sequelize, senza contenere logica di business.
 */
export class UserDAO implements IUserDAO {
    
    /**
     * @method create
     * @description Crea un nuovo utente nel database.
     *
     * @param obj Dati dell’utente da salvare.
     * @returns Utente creato.
     */
    public async create(obj: any): Promise<User> {
        return await User.create(obj);
    }

    /**
     * @method delete
     * @description Elimina un utente tramite il suo identificativo.
     *
     * @param id Identificativo dell’utente da eliminare.
     * @returns True se l’eliminazione è avvenuta, false altrimenti.
     */
    public async delete(id: string): Promise<boolean> {
        const deletedRows = await User.destroy({ where: { id } });
        return deletedRows > 0;
    }

    /**
     * @method update
     * @description Aggiorna i dati di un utente esistente.
     *
     * @param id Identificativo dell’utente da aggiornare.
     * @param obj Dati da applicare all’utente.
     * @returns True se almeno una riga è stata aggiornata, false altrimenti.
     */
    public async update(id: string, obj: any): Promise<boolean> {
        const [updatedRows] = await User.update(obj, { where: { id } });
        return updatedRows > 0;
    }

    /**
     * @method fetchSingle
     * @description Recupera un singolo utente tramite il suo identificativo.
     * Supporta l’esecuzione in transazione e l’eventuale lock della riga
     * per operazioni che richiedono consistenza.
     *
     * @param id Identificativo dell’utente da recuperare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Utente trovato oppure null se non esiste.
     */
    public async fetchSingle(
        id: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<User | null> {
        return await User.findByPk(id, {
            transaction,
            lock: lock || undefined
        });
    }

    /**
     * @method fetchAll
     * @description Recupera tutti gli utenti presenti nel database.
     *
     * @returns Lista completa degli utenti.
     */
    public async fetchAll(): Promise<User[]> {
        return await User.findAll();
    }

    /**
     * @method findByEmail
     * @description Recupera un utente tramite indirizzo email.
     * Viene utilizzato in scenari come autenticazione, verifiche di unicità
     * e aggiornamenti del portafoglio token, anche con supporto a transazioni e lock.
     *
     * @param email Indirizzo email dell’utente da cercare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Utente trovato oppure null se non esiste.
     */
    public async findByEmail(
        email: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<User | null> {
        return await User.findOne({
            where: { email },
            transaction,
            lock: lock || undefined
        });
    }

    /**
     * @method getTopByPoints
     * @description Recupera gli utenti con il punteggio più alto.
     * Applica l’ordinamento per punteggio e limita gli attributi restituiti
     * per esporre solo i dati necessari alla classifica pubblica.
     *
     * @param limit Numero massimo di utenti da includere nella classifica.
     * @returns Lista degli utenti ordinati per punteggio decrescente.
     */
    public async getTopByPoints(limit: number): Promise<User[]> {
        return await User.findAll({
            order: [['points', 'DESC']],
            limit: limit,
            attributes: ['id', 'email', 'points'] // Data hiding per sicurezza
        });
    }
}