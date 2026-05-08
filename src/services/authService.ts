import bcrypt from 'bcrypt'; 
import { UserRepository } from '../repository/UserRepository';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { JWTUtils } from '../utils/JWTUtils';

/**
 * @class AuthService
 * @description Gestisce la logica di business per l'autenticazione degli utenti.
 */
export class AuthService {
    
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * Valida le credenziali dell'utente e restituisce un token JWT.
     * @async
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<object>}
     * @throws {HttpError} Se l'utente non esiste o la password è errata.
     */
    async login(email: string, password: string): Promise<object> {
        const user = await this.userRepository.getByEmail(email);
    
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