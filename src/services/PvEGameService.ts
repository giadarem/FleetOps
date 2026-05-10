import { BaseGameService } from './baseGameService';
import { GameType } from '../enum/gameType';
import { GameStatus } from '../enum/gameStatus';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { GameEngine } from '../utils/gameEngine'; // Assicurati che il path sia corretto
import { ShipConfiguration, GameState } from '../types/gameTypes';
import db from '../config/database';

export class PvEGameService extends BaseGameService {
    
    async create(player1Id: string, gridSize: number, shipConfig: ShipConfiguration[]) {
        const { player1, player1Board, player2Board, COST } = await this.prepareGameCreation(player1Id, gridSize, shipConfig);

        const transaction = await db.sequelize.transaction();
        try {
            player1.tokenBalance -= COST;
            await player1.save({ transaction });

            const game = await this.gameRepository.createGame({
                type: GameType.PVE,
                player1Id,
                player2Id: null,
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
     * @description Elabora il turno di gioco in modalità PvE (Player vs Environment).
     * Gestisce l'intera pipeline di esecuzione: validazione dei vincoli di stato,
     * detrazione del costo dell'operazione, calcolo dell'impatto sulla plancia bersaglio,
     * generazione della risposta deterministica dell'IA e persistenza dei dati.
     * * @param {string} gameId - Identificatore univoco della partita.
     * @param {string} userId - Identificatore dell'utente che effettua la mossa.
     * @param {number} x - Coordinata orizzontale del bersaglio.
     * @param {number} y - Coordinata verticale del bersaglio.
     * @returns {Promise<Object>} Esito dell'operazione e stato aggiornato della partita.
     * @throws {HttpError} In caso di validazione fallita o fondi insufficienti.
     */
    async processMove(gameId: string, userId: string, x: number, y: number) {
        // 1. VALIDAZIONE DELLO STATO DI DOMINIO E DEI VINCOLI
        const game = await this.gameRepository.getById(gameId);
        
        if (!game) {
            throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
        }

        // Verifica l'idoneità della macchina a stati per elaborare nuove transazioni
        if (game.status !== GameStatus.ACTIVE) {
            throw ErrorFactory.getError('BAD_REQUEST', 'La partita non è più attiva.');
        }

        const state = game.gameState as GameState;
        
        // Validazione dei permessi di sequenzialità (Turnazione)
        if (state.currentTurn !== userId) {
            throw ErrorFactory.getError('FORBIDDEN', 'Non è il turno dell\'utente corrente.');
        }

        const gridSize = state.configuration.gridSize;
        // La griglia va da 0 a gridSize - 1. 
        // Esempio: se gridSize è 22, le coordinate valide vanno da 0 a 21.
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
            throw ErrorFactory.getError(
                'BAD_REQUEST', 
                `Coordinate fuori mappa! Valori ammessi: da 0 a ${gridSize - 1}.`
            );
        }
        

        // 2. VALIDAZIONE ECONOMICA E GESTIONE DEL WALLET (TOKEN)
        const user = await this.userRepository.getById(userId);
        
        if (!user) {
            throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato nel sistema.');
        }

        const MOVE_COST = 0.025; // Costante del costo unitario della transazione

        // 3. ESECUZIONE LOGICA DI GIOCO: ATTACCO DELL'UTENTE
        // Delega al GameEngine il calcolo dell'impatto spaziale sulla plancia avversaria
        const userAttack = GameEngine.applyMove(state.player2Board, { x, y });
        state.player2Board = userAttack.updatedBoard;
        
        // Registrazione dell'evento nell'Audit Log della partita
        state.history.push({ 
            playerId: userId, 
            x, 
            y, 
            result: userAttack.result, 
            timestamp: new Date() 
        });

        // 4. VALUTAZIONE CONDIZIONE DI VITTORIA UTENTE & RISPOSTA IA
        if (GameEngine.checkVictory(state.player2Board)) {
            // Transizione di stato: Fine partita con vittoria dell'Utente
            game.status = GameStatus.FINISHED;
            game.winnerId = userId;
            user.points += 1;
        } else {
            // Generazione procedurale della contromossa IA ottimizzata (evita collisioni su colpi pregressi)
            const iaTarget = GameEngine.generateIAMove(state.configuration.gridSize, state.player1Board.shotsReceived);
            const iaAttack = GameEngine.applyMove(state.player1Board, iaTarget);
            
            state.player1Board = iaAttack.updatedBoard;
            
            state.history.push({ 
                playerId: 'IA', 
                x: iaTarget.x, 
                y: iaTarget.y, 
                result: iaAttack.result, 
                timestamp: new Date() 
            });

            // Valutazione condizione di vittoria asincrona (IA vince nel turno in corso)
            if (GameEngine.checkVictory(state.player1Board)) {
                game.status = GameStatus.FINISHED;
                game.winnerId = null; // Il valore null definisce sistematicamente la vittoria dell'Entità IA
            }
        }

        // 5. PERSISTENZA E CONSOLIDAMENTO DATI (DB UPDATE)
        // Addebita il costo transazionale e persiste il saldo
        user.tokenBalance -= MOVE_COST;
        await user.save();
        // Sincronizzazione dell'oggetto in memoria col modello ORM
        game.gameState = state;
        // Istruzione esplicita a Sequelize per tracciare la mutazione interna del tipo JSONB
        game.changed('gameState', true);
        await this.gameRepository.updateGame(game);

        // 6. FORMATTAZIONE PAYLOAD DI RISPOSTA
        return {
            userMove: userAttack.result,
            // Estrazione dell'ultimo record storico se appartenente all'IA (Safety check)
            iaMove: state.history[state.history.length - 1].playerId === 'IA' 
                ? state.history[state.history.length - 1] 
                : null,
            currentStatus: game.status,
            winner: game.winnerId
        };
    }
}