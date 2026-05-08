import { UserRepository } from '../repository/userRepository';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { HttpStatus } from '../enum/httpStatus';
import { JWTUtils } from '../utils/JWTUtils';

/**
 * @class AuthService
 * @description Servizio dedicato all'elaborazione della logica di business per i processi di autenticazione.
 */
export class AuthService {
    /**
     * @constructor
     * @param {UserRepository} userRepository - Repository per l'accesso astratto ai dati degli utenti.
     */
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * @method login
     * @description Esegue la validazione delle credenziali e genera un token di autorizzazione.
     * @param {string} email - Identificativo dell'utente.
     * @param {string} password - Credenziale segreta dell'utente.
     * @returns {Promise<object>} L'oggetto contenente il token e i dati essenziali dell'utente.
     * @throws Lancia un'eccezione formattata dalla Factory in caso di fallimento dell'autenticazione.
     */
    async login(email: string, password: string) {
        const user = await this.userRepository.getByEmail(email);

        if (!user || user.password !== password) {
            // PASSAGGIO CORRETTO: Passiamo la stringa attesa dallo switch della Factory
            throw ErrorFactory.getError('UNAUTHORIZED', 'Credenziali di accesso non valide.');
        }

        // Delega la generazione del token
        const token = JWTUtils.generateToken({ id: user.id, role: user.role });
        
        return { token, user: { email: user.email, role: user.role } };
    }
}