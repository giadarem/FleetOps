// src/dao/gameDAO.ts
import { IGameDAO } from './IgameDAO';
import Game from '../models/game';
import { Transaction, Op } from 'sequelize';

/**
 * @class gameDAO
 * @description Implementazione concreta del Data Access Object per l'entità Game usando Sequelize.
 * Incapsula le query di basso livello per isolare il database dal resto dell'applicazione.
 */
export class GameDAO implements IGameDAO {
    
    public async create(gameData: any, transaction?: Transaction): Promise<Game> {
        return await Game.create(gameData, { transaction });
    }

    public async findById(id: string): Promise<Game | null> {
        return await Game.findByPk(id);
    }

    public async findActiveByUserId(userId: string): Promise<Game | null> {
        return await Game.findOne({
            where: {
                [Op.or]: [
                    { player1Id: userId },
                    { player2Id: userId }
                ],
                status: 'ACTIVE'
            }
        });
    }

    public async update(game: Game, transaction?: Transaction): Promise<Game> {
        return await game.save({ transaction });
    }
}