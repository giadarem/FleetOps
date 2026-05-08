import User from '../models/User';
import { IDAO } from './IDAO';

/**
 * @class UserDAO
 * @description Implementazione dell'interfaccia IDAO per l'entità User [cite: 93-100].
 */
export class UserDAO implements IDAO<User> {
    
    // Implementazioni base richieste dall'interfaccia IDAO
    public async create(obj: any): Promise<User> {
        return await User.create(obj);
    }
    public async delete(id: number): Promise<boolean> {
        const deleted = await User.destroy({ where: { id } });
        return deleted > 0;
    }
    public async update(id: number, obj: any): Promise<boolean> {
        const [updated] = await User.update(obj, { where: { id } });
        return updated > 0;
    }
    public async fetchSingle(id: number): Promise<User | null> {
        return await User.findByPk(id);
    }
    public async fetchAll(): Promise<User[]> {
        return await User.findAll();
    }

    // Metodo specifico per l'autenticazione
    public async findByEmail(email: string): Promise<User | null> {
        return await User.findOne({ where: { email } });
    }
}