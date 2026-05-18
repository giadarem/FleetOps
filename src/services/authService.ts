// src/services/authService.ts
import bcrypt from 'bcrypt'; 
import { UserRepository } from '../repository/UserRepository';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { JWTUtils } from '../utils/JWTUtils';

/**
 * @class AuthService
 * @description Service responsabile della logica applicativa relativa all’autenticazione.
 * Si colloca nel livello Service dell’architettura e coordina repository, verifica password
 * e generazione del token JWT.
 */
export class AuthService {
    
    /**
     * @constructor
     * @description Inizializza il service con il repository necessario all’accesso ai dati utente.
     *
     * @param userRepository Repository utilizzato per recuperare gli utenti durante il login.
     */
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * @method login
     * @description Autentica un utente tramite email e password.
     * Valida i dati in ingresso, recupera l’utente dal repository, verifica la password
     * e genera un token JWT contenente le informazioni essenziali dell’utente autenticato.
     *
     * @param email Email dell’utente che richiede l’accesso.
     * @param password Password in chiaro da confrontare con quella salvata.
     * @returns Oggetto contenente token JWT e dati principali dell’utente autenticato.
     * @throws Errore applicativo se email o password sono mancanti oppure se le credenziali non sono valide.
     */
    async login(email: string, password: string): Promise<object> {
        // Aggiunta validazione base per evitare query inutili al DB
        if (!email || !password) {
            throw ErrorFactory.getError('BAD_REQUEST', 'Email e password sono campi obbligatori.');
        }

        const user = await this.userRepository.getUserByEmail(email);
    
        if (!user) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Credenziali di accesso non valide.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Credenziali di accesso non valide.');
        }

        const token = JWTUtils.generateToken({ 
            id: user.id, 
            role: user.role 
        });
        
        return { 
            token, 
            user: { 
                id: user.id,
                email: user.email, 
                role: user.role,
                tokenBalance: user.tokenBalance 
            } 
        };
    }
}