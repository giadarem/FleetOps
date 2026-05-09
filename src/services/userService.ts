import { UserRepository } from '../repository/UserRepository';
import { ErrorFactory } from '../patterns/ErrorFactory';

export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async getProfile(id: string) {
        const user = await this.userRepository.getById(id);
        if (!user) {
            throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato.');
        }
        return user;
    }

    async getLeaderboard() {
        return await this.userRepository.getLeaderboard();
    }


    /**
     * Effettua la ricarica dei token di un utente specifico.
     * @param email L'email dell'utente da ricaricare
     * @param amount La quantità di token da aggiungere
     */
    async rechargeTokens(email: string, amount: number) {
        const user = await this.userRepository.getByEmail(email);
        
        if (!user) {
            throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato nel sistema.');
        }

    
        user.tokenBalance += amount;
        await this.userRepository.update(user);
        
        return { 
            message: 'Ricarica effettuata con successo',
            email: user.email, 
            newTokenBalance: user.tokenBalance 
        };
    }
}