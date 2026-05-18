// src/services/PvEGameService.ts

import { BaseGameService } from './baseGameService';
import { GameType } from '../enum/gameType';
import { GameStatus } from '../enum/gameStatus';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { GameEngine } from '../utils/gameEngine';
import { ShipConfiguration, GameState } from '../types/gameTypes';
import db from '../config/database';
import { MOVE_COST } from '../config/gameCosts';

/**
 * @class PvEGameService
 * @description Service responsabile della logica applicativa delle partite PvE.
 * Estende BaseGameService e gestisce creazione della partita contro IA,
 * elaborazione delle mosse dell’utente, risposta automatica dell’IA,
 * aggiornamento dello stato di gioco, token e punteggi.
 */
export class PvEGameService extends BaseGameService {
    /**
     * @method create
     * @description Crea una nuova partita PvE all’interno di una transazione.
     * Prepara i dati comuni della partita, scala il costo di creazione all’utente,
     * inizializza le board dei giocatori e salva la partita con avversario IA.
     *
     * @param player1Id Identificativo dell’utente che crea la partita.
     * @param gridSize Dimensione della griglia di gioco.
     * @param shipConfig Configurazione delle navi da posizionare sulle board.
     * @returns Partita PvE creata.
     * @throws Errore applicativo se la validazione fallisce o la transazione non viene completata.
     */
    async create(player1Id: string, gridSize: number, shipConfig: ShipConfiguration[]) {
        const transaction = await db.sequelize.transaction();

        try {
            const { player1, player1Board, player2Board, COST } =
                await this.prepareGameCreation(player1Id, gridSize, shipConfig, transaction);

            player1.tokenBalance -= COST;
            await this.userRepository.saveUserChanges(player1, transaction);

            const game = await this.gameRepository.createGame(
                {
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
                },
                transaction
            );

            await transaction.commit();
            return game;
        } catch (e: any) {
            await transaction.rollback();

            if (e.toJSON) throw e;

            throw ErrorFactory.getError(
                'DATABASE_ERROR',
                `Transazione fallita: ${e.message}`
            );
        }
    }

    /**
     * @method processMove
     * @description Elabora una mossa dell’utente in una partita PvE attiva.
     * Verifica autorizzazione, turno corrente e coordinate, applica l’attacco dell’utente,
     * genera la risposta dell’IA quando necessario, aggiorna storico, stato partita,
     * saldo token e punteggio del vincitore.
     *
     * @param gameId Identificativo della partita.
     * @param userId Identificativo dell’utente che effettua la mossa.
     * @param x Coordinata orizzontale della mossa.
     * @param y Coordinata verticale della mossa.
     * @returns Esito della mossa dell’utente, eventuale mossa IA, stato corrente e vincitore.
     * @throws Errore applicativo se la partita non esiste, non è attiva, l’utente non è autorizzato,
     * le coordinate non sono valide o la transazione fallisce.
     */
    async processMove(gameId: string, userId: string, x: number, y: number) {
        const transaction = await db.sequelize.transaction();

        try {
            const game = await this.gameRepository.getById(gameId, transaction, true);

            if (!game) {
                throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
            }

            if (game.status !== GameStatus.ACTIVE) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'La partita non è più attiva.'
                );
            }

            if (game.player1Id !== userId) {
                throw ErrorFactory.getError(
                    'FORBIDDEN',
                    'Non sei un partecipante di questa partita.'
                );
            }

            const state = game.gameState as GameState;

            if (state.currentTurn !== userId) {
                throw ErrorFactory.getError(
                    'FORBIDDEN',
                    'Non è il turno dell\'utente corrente.'
                );
            }

            const gridSize = state.configuration.gridSize;
            this.validateCoordinates(x, y, gridSize);

            const alreadyShot = state.player2Board.shotsReceived.some(
                shot => shot.x === x && shot.y === y
            );

            if (alreadyShot) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'Hai già sparato in queste coordinate.'
                );
            }

            const user = await this.userRepository.getUserById(userId, transaction, true);

            if (!user) {
                throw ErrorFactory.getError(
                    'NOT_FOUND',
                    'Utente non trovato nel sistema.'
                );
            }

            const userAttack = GameEngine.applyMove(state.player2Board, { x, y });
            state.player2Board = userAttack.updatedBoard;

            state.history.push({
                playerId: userId,
                x,
                y,
                result: userAttack.result,
                timestamp: new Date()
            });

            if (GameEngine.checkVictory(state.player2Board)) {
                game.status = GameStatus.FINISHED;
                game.winnerId = userId;
                user.points += 1;
            } else {
                const iaTarget = GameEngine.generateIAMove(
                    state.configuration.gridSize,
                    state.player1Board.shotsReceived
                );

                const iaAttack = GameEngine.applyMove(state.player1Board, iaTarget);

                state.player1Board = iaAttack.updatedBoard;

                state.history.push({
                    playerId: 'IA',
                    x: iaTarget.x,
                    y: iaTarget.y,
                    result: iaAttack.result,
                    timestamp: new Date()
                });

                if (GameEngine.checkVictory(state.player1Board)) {
                    game.status = GameStatus.FINISHED;
                    game.winnerId = null;
                }
            }

            const iaMove = state.history[state.history.length - 1].playerId === 'IA'
                ? state.history[state.history.length - 1]
                : null;

            user.tokenBalance -= MOVE_COST;
            await this.userRepository.saveUserChanges(user, transaction);

            game.gameState = state;
            game.changed('gameState', true);

            await this.gameRepository.updateGame(game, transaction);

            await transaction.commit();

            return {
                userMove: userAttack.result,
                iaMove,
                currentStatus: game.status,
                winner: game.winnerId
            };
        } catch (e: any) {
            await transaction.rollback();

            if (e.toJSON) throw e;

            throw ErrorFactory.getError(
                'DATABASE_ERROR',
                `Transazione fallita durante l'elaborazione della mossa PvE: ${e.message}`
            );
        }
    }
}