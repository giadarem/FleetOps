// src/services/BaseGameService.ts
import { GameRepository } from '../repository/gameRepository';
import { UserRepository } from '../repository/UserRepository';
import { GameEngine } from '../utils/gameEngine';
import { ErrorFactory } from '../patterns/ErrorFactory';
import db from '../config/database';
import { GameStatus } from '../enum/gameStatus';
import { GameType } from '../enum/gameType';
import Game from '../models/game';

export abstract class BaseGameService {
    protected gameRepository: GameRepository;
    protected userRepository: UserRepository;

    constructor() {
        this.gameRepository = new GameRepository();
        this.userRepository = new UserRepository();
    }

    /**
     * Logica comune per scalare token e preparare i dati iniziali
     */
    protected async prepareGameCreation(player1Id: string, gridSize: number, shipConfig: any[]) {
        const player1 = await this.userRepository.getById(player1Id);
        if (!player1) throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato.');

        const COST = 0.2;
        if (player1.tokenBalance < COST) {
            throw ErrorFactory.getError('PAYMENT_REQUIRED', 'Token insufficienti.');
        }

        const activeGame = await this.gameRepository.getActiveGameByUserId(player1Id);
        if (activeGame) {
            throw ErrorFactory.getError('CONFLICT', 'Hai già una partita attiva.');
        }

        if (gridSize < 5) {
            throw ErrorFactory.getError('BAD_REQUEST', 'La griglia deve avere una dimensione minima di 5x5.');
        }

        const player1Board = GameEngine.generateRandomBoard(gridSize, shipConfig);
        const player2Board = GameEngine.generateRandomBoard(gridSize, shipConfig);

        return { player1, player1Board, player2Board, COST };
    }

    /**
     * @method abandonGame
     * @description Permette a un utente di ritirarsi da una partita attiva.
     * Lo stato diventa ABANDONED e il vincitore viene assegnato all'avversario.
     */
    async abandonGame(gameId: string, userId: string): Promise<Game> {
        const game = await this.gameRepository.getById(gameId);
        
        if (!game) throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
        
        if (game.status !== GameStatus.ACTIVE) {
            throw ErrorFactory.getError('BAD_REQUEST', 'La partita non è attiva e non può essere abbandonata.');
        }

        // Verifica che l'utente faccia parte della partita
        if (game.player1Id !== userId && game.player2Id !== userId) {
            throw ErrorFactory.getError('FORBIDDEN', 'Non hai i permessi per chiudere questa partita.');
        }

        // 1. Cambia lo stato della partita
        game.status = GameStatus.ABANDONED;

        // 2. Dichiara e calcola l'ID del vincitore salvandolo in una costante
        const calculatedWinnerId = (game.player1Id === userId) ? game.player2Id : game.player1Id;
        
        // 3. Lo assegna all'oggetto game
        game.winnerId = calculatedWinnerId;
            
        // 4. Se esiste un avversario reale (in PvE calculatedWinnerId sarà null), assegna 0.5 punti
        if (calculatedWinnerId) { 
            const winner = await this.userRepository.getById(calculatedWinnerId);
            if (winner) {
                winner.points += 0.5;
                await winner.save();
            }
        }

        // 5. Salva la partita aggiornata
        return await this.gameRepository.updateGame(game);
    }
}