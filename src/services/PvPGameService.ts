import { BaseGameService } from './baseGameService';
import { GameType } from '../enum/gameType';
import { GameStatus } from '../enum/gameStatus';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { ShipConfiguration,  GameState } from '../types/gameTypes'; 
import db from '../config/database';
import { GameEngine } from '../utils/gameEngine';


export class PvPGameService extends BaseGameService {
    async create(
        player1Id: string, 
        gridSize: number, 
        shipConfig: ShipConfiguration[], 
        opponentEmail: string
    ) {
        const opponent = await this.userRepository.getByEmail(opponentEmail);
        if (!opponent) throw ErrorFactory.getError('NOT_FOUND', 'Avversario non trovato.');
        if (opponent.id === player1Id) throw ErrorFactory.getError('BAD_REQUEST', 'Non puoi sfidarti da solo.');

        const { player1, player1Board, player2Board, COST } = await this.prepareGameCreation(player1Id, gridSize, shipConfig);

        const transaction = await db.sequelize.transaction();
        try {
            player1.tokenBalance -= COST;
            await player1.save({ transaction });

            const game = await this.gameRepository.createGame({
                type: GameType.PVP,
                player1Id,
                player2Id: opponent.id,
                status: GameStatus.ACTIVE,
                gameState: {
                    configuration: { gridSize, shipTypes: shipConfig },
                    player1Board, 
                    player2Board,
                    currentTurn: player1Id,
                    history: []
                }
            }, transaction);

            await transaction.commit();
            return game;
        } catch (e) { 
            await transaction.rollback(); 
            throw e; 
        }
    }

    /**
     * @method processMove
     * @description Gestisce l'attacco di un giocatore umano contro un altro umano.
     */
    async processMove(gameId: string, userId: string, x: number, y: number) {
        // 1. Recupera partita
        const game = await this.gameRepository.getById(gameId);
        if (!game) throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');

        // 2. Validazione Stato
        if (game.status !== GameStatus.ACTIVE) {
            throw ErrorFactory.getError('BAD_REQUEST', 'La partita non è più attiva.');
        }

        const state = game.gameState as GameState;

        // 3. Controlla Turno: solo chi è in currentTurn può sparare
        if (state.currentTurn !== userId) {
            throw ErrorFactory.getError('FORBIDDEN', 'Non è il tuo turno, tocca al tuo avversario.');
        }

        // 4. Identificazione del difensore (Target)
        // Se spara il Player 1, il bersaglio è la plancia del Player 2 e viceversa
        const isPlayer1Attacking = userId === game.player1Id;
        const targetBoard = isPlayer1Attacking ? state.player2Board : state.player1Board;

        // 5. Controllo mosse duplicate
        const alreadyShot = targetBoard.shotsReceived.some(s => s.x === x && s.y === y);
        if (alreadyShot) {
            throw ErrorFactory.getError('BAD_REQUEST', 'Hai già sparato in queste coordinate.');
        }

        // 6. Esecuzione mossa tramite Engine
        const { result, updatedBoard } = GameEngine.applyMove(targetBoard, { x, y });

        // Aggiorniamo la plancia corretta nello stato
        if (isPlayer1Attacking) {
            state.player2Board = updatedBoard;
        } else {
            state.player1Board = updatedBoard;
        }

        // 7. Registrazione nello storico
        state.history.push({ 
            playerId: userId, 
            x, y, 
            result, 
            timestamp: new Date() 
        });

        // 8. Cambio Turno o Vittoria
        if (GameEngine.checkVictory(updatedBoard)) {
            game.status = GameStatus.FINISHED;
            game.winnerId = userId;

            const winner = await this.userRepository.getById(userId);
        if (winner) {
            winner.points += 1;
            await winner.save();
        }
        } else {
            // Se nessuno ha vinto, invertiamo il turno
            // Se ero il P1, ora tocca al P2 (e viceversa)
            state.currentTurn = isPlayer1Attacking ? (game.player2Id as string) : game.player1Id;
        }

        // 9. Salvataggio e Persistenza
        game.gameState = state;
        game.changed('gameState', true); // Forza Sequelize a vedere la modifica nel JSONB
        
        await this.gameRepository.updateGame(game);

        return {
            result,
            nextTurn: state.currentTurn,
            gameStatus: game.status,
            winner: game.winnerId
        };
    }

}