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
}