import { UserRepository } from '../repository/UserRepository';
import { ErrorFactory } from '../patterns/ErrorFactory';
import User from '../models/User';

/**
 * @typedef UserProfileDTO
 * @description DTO pubblico utilizzato per rappresentare il profilo utente nelle risposte API.
 * Espone solo i dati necessari al client ed esclude campi sensibili come password o hash.
 */
type UserProfileDTO = {
    id: string;
    email: string;
    role: string;
    tokenBalance: number;
    points: number;
};

/**
 * @class UserService
 * @description Service responsabile della logica applicativa relativa agli utenti.
 * Si colloca nel livello Service dell’architettura e coordina repository, regole di business,
 * trasformazione dei dati e gestione delle operazioni su profili, classifiche e token.
 */
export class UserService {
    
    /**
     * @constructor
     * @description Inizializza il service con il repository necessario all’accesso ai dati utente.
     * L’iniezione tramite costruttore favorisce disaccoppiamento e testabilità.
     *
     * @param userRepository Repository utilizzato per le operazioni di dominio sugli utenti.
     */
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * @method getProfile
     * @description Recupera il profilo pubblico di un utente.
     * Verifica l’esistenza dell’utente e converte il model Sequelize in un DTO sicuro,
     * evitando l’esposizione di dati sensibili.
     *
     * @param id Identificativo dell’utente da recuperare.
     * @returns DTO pubblico del profilo utente.
     * @throws Errore applicativo se il profilo utente non viene trovato.
     */
    async getProfile(id: string): Promise<UserProfileDTO> {
        const user = await this.userRepository.getUserById(id);
        
        if (!user) {
            throw ErrorFactory.getError('NOT_FOUND', 'Profilo utente non trovato.');
        }
        
        return this.toUserProfileDTO(user);
    }

    /**
     * @method getLeaderboard
     * @description Recupera la classifica globale dei giocatori.
     * Delega al repository il recupero degli utenti ordinati per punteggio.
     *
     * @returns Lista degli utenti con punteggio più alto.
     */
    async getLeaderboard(): Promise<User[]> {
        return await this.userRepository.getGlobalLeaderboard(10);
    }

    /**
     * @method rechargeTokens
     * @description Ricarica il saldo token di un utente identificato tramite email.
     * Recupera l’utente, aggiorna il saldo in memoria e delega al repository
     * la persistenza del nuovo stato.
     *
     * @param email Email dell’utente da ricaricare.
     * @param amount Quantità di token da aggiungere al saldo.
     * @returns Esito della ricarica con email utente e nuovo saldo token.
     * @throws Errore applicativo se l’utente da ricaricare non viene trovato.
     */
    async rechargeTokens(email: string, amount: number) {
        const user = await this.userRepository.getUserByEmail(email);
        
        if (!user) {
            throw ErrorFactory.getError('NOT_FOUND', 'Impossibile ricaricare: utente non trovato nel sistema.');
        }

        user.tokenBalance += amount;
        await this.userRepository.saveUserChanges(user);
        
        return { 
            message: 'Ricarica effettuata con successo',
            email: user.email, 
            newTokenBalance: user.tokenBalance 
        };
    }

    /**
     * @method toUserProfileDTO
     * @private
     * @description Converte un model Sequelize User in un DTO pubblico sicuro.
     * Centralizza la selezione dei campi esposti al client, evitando la restituzione
     * di informazioni sensibili.
     *
     * @param user Istanza del model User da convertire.
     * @returns DTO pubblico del profilo utente.
     */
    private toUserProfileDTO(user: User): UserProfileDTO {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            tokenBalance: user.tokenBalance,
            points: user.points
        };
    }
}