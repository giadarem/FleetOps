import User from '../models/User';

/**
 * @class UserRepository
 * @description Gestisce le query dirette sulla tabella Users tramite Sequelize.
 */
export class UserRepository {
    /**
     * Recupera un utente tramite la sua email.
     * @param {string} email 
     * @returns {Promise<User | null>}
     */
    async getByEmail(email: string): Promise<User | null> {
        return await User.findOne({ where: { email } });
    }

    /**
     * Recupera un utente tramite il suo ID.
     */
    async getById(id: string): Promise<User | null> {
    return await User.findByPk(id, {
        attributes: ['id', 'email', 'role', 'tokenBalance', 'points']
    });
}

    /**
     * Restituisce la classifica ordinata per punteggio decrescente.
     * Limita i risultati per non appesantire il database.
     */
    async getLeaderboard(limit: number = 10): Promise<User[]> {
        return await User.findAll({
            order: [['points', 'DESC']],
            limit: limit,
            attributes: ['id', 'email', 'points'] // Escludiamo la password per sicurezza
        });
    }
}