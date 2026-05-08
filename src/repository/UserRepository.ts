import { UserDAO } from '../dao/userDAO';
import User from '../models/User';

/**
 * @class UserRepository
 * @description Rappresenta lo strato aggiuntivo del repository che aggrega uno o più DAO 
 * per consentire il collegamento standardizzato con i servizi e il controller.
 */
export class UserRepository {
    /**
     * @constructor
     * @param {UserDAO} userDAO - Oggetto di accesso ai dati iniettato per eseguire le operazioni CRUD.
     */
    constructor(private readonly userDAO: UserDAO) {}

    /**
     * @method getByEmail
     * @description Interroga il DAO sottostante per recuperare un'entità utente tramite email.
     * @param {string} email - Indirizzo email dell'utente.
     * @returns {Promise<User | null>} La promessa contenente l'istanza dell'utente o null se inesistente.
     */
    async getByEmail(email: string): Promise<User | null> {
        return await this.userDAO.findByEmail(email);
    }
}