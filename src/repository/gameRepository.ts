// src/repository/GameRepository.ts
import { GameDAO } from '../dao/gameDAO';
import Game from '../models/game';
import { Transaction } from 'sequelize';

/**
 * @class gameRepository
 * @description Layer di astrazione di medio livello (Domain Repository).
 * Interfaccia il Service con il DAO sottostante, permettendo un domani di cambiare ORM o DB
 * senza dover riscrivere la logica di business.
 */
export class GameRepository {
    private gameDAO: GameDAO;

    constructor() {
        this.gameDAO = new GameDAO();
    }

    /**
     * @method createGame
     */
    async createGame(gameData: any, transaction?: Transaction): Promise<Game> {
        return await this.gameDAO.create(gameData, transaction);
    }

    /**
     * @method getById
     */
    async getById(id: string): Promise<Game | null> {
        return await this.gameDAO.findById(id);
    }

    /**
     * @method getActiveGameByUserId
     */
    async getActiveGameByUserId(userId: string): Promise<Game | null> {
        return await this.gameDAO.findActiveByUserId(userId);
    }

    /**
     * @method updateGame
     */
    async updateGame(game: Game, transaction?: Transaction): Promise<Game> {
        return await this.gameDAO.update(game, transaction);
    }
}