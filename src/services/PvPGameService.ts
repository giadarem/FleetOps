// src/services/PvPGameService.ts

import { BaseGameService } from './baseGameService';
import { GameType } from '../enum/gameType';
import { GameStatus } from '../enum/gameStatus';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { ShipConfiguration, GameState } from '../types/gameTypes';
import db from '../config/database';
import { GameEngine } from '../utils/gameEngine';
import { MOVE_COST } from '../config/gameCosts';

/**
 * @class PvPGameService
 * @description Service responsabile della logica applicativa delle partite PvP.
 * Estende BaseGameService e gestisce creazione della partita tra due utenti,
 * controllo dell’avversario, turnazione, mosse, aggiornamento dello stato,
 * consumo dei token e assegnazione dei punteggi.
 */
export class PvPGameService extends BaseGameService {
    /**
     * @method create
     * @description Crea una nuova partita PvP all’interno di una transazione.
     * Valida i dati di creazione, verifica l’avversario tramite email, controlla
     * che entrambi gli utenti non abbiano partite attive, scala il costo iniziale
     * e salva la partita con le board generate.
     *
     * @param player1Id Identificativo dell’utente che crea la partita.
     * @param gridSize Dimensione della griglia di gioco.
     * @param shipConfig Configurazione delle navi da posizionare sulle board.
     * @param opponentEmail Email dell’utente avversario.
     * @returns Partita PvP creata.
     * @throws Errore applicativo se i dati non sono validi, l’avversario non esiste,
     * l’avversario coincide con il creatore, uno dei giocatori ha una partita attiva
     * o la transazione fallisce.
     */
    async create(
        player1Id: string,
        gridSize: number,
        shipConfig: ShipConfiguration[],
        opponentEmail: string
    ) {
        if (typeof opponentEmail !== 'string' || !opponentEmail.trim()) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'Email dell’avversario obbligatoria per una partita PvP.'
            );
        }

        const normalizedOpponentEmail = opponentEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedOpponentEmail)) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'Formato email avversario non valido.'
            );
        }

        const transaction = await db.sequelize.transaction();

        try {
            const opponent = await this.userRepository.getUserByEmail(
                normalizedOpponentEmail,
                transaction,
                true
            );

            if (!opponent) {
                throw ErrorFactory.getError('NOT_FOUND', 'Avversario non trovato.');
            }

            if (opponent.id === player1Id) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'Non puoi scegliere te stesso come avversario.'
                );
            }

            const { player1, player1Board, player2Board, COST } =
                await this.prepareGameCreation(player1Id, gridSize, shipConfig, transaction);

            const opponentActiveGame = await this.gameRepository.getActiveGameByUserId(
                opponent.id,
                transaction,
                true
            );

            if (opponentActiveGame) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'L’avversario ha già una partita attiva.'
                );
            }

            player1.tokenBalance -= COST;
            await this.userRepository.saveUserChanges(player1, transaction);

            const game = await this.gameRepository.createGame(
                {
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
     * @description Elabora una mossa effettuata da un giocatore in una partita PvP attiva.
     * Verifica esistenza della partita, stato, partecipazione dell’utente, turno corrente
     * e validità delle coordinate, quindi applica la mossa, aggiorna storico,
     * turno successivo, stato partita, token e punteggio del vincitore.
     *
     * @param gameId Identificativo della partita.
     * @param userId Identificativo dell’utente che effettua la mossa.
     * @param x Coordinata orizzontale della mossa.
     * @param y Coordinata verticale della mossa.
     * @returns Esito della mossa, prossimo turno, stato della partita e vincitore.
     * @throws Errore applicativo se la partita non esiste, non è attiva, l’utente non è autorizzato,
     * non è il turno dell’utente, le coordinate non sono valide o la transazione fallisce.
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

            const isPlayer1Attacking = userId === game.player1Id;
            const isPlayer2Attacking = userId === game.player2Id;

            if (!isPlayer1Attacking && !isPlayer2Attacking) {
                throw ErrorFactory.getError(
                    'FORBIDDEN',
                    'Non sei un partecipante di questa partita.'
                );
            }

            const state = game.gameState as GameState;

            if (state.currentTurn !== userId) {
                throw ErrorFactory.getError(
                    'FORBIDDEN',
                    'Non è il tuo turno, tocca al tuo avversario.'
                );
            }

            const targetBoard = isPlayer1Attacking
                ? state.player2Board
                : state.player1Board;

            const gridSize = state.configuration.gridSize;
            this.validateCoordinates(x, y, gridSize);

            const alreadyShot = targetBoard.shotsReceived.some(
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
                throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato.');
            }

            const { result, updatedBoard } = GameEngine.applyMove(targetBoard, { x, y });

            if (isPlayer1Attacking) {
                state.player2Board = updatedBoard;
            } else {
                state.player1Board = updatedBoard;
            }

            state.history.push({
                playerId: userId,
                x,
                y,
                result,
                timestamp: new Date()
            });

            if (GameEngine.checkVictory(updatedBoard)) {
                game.status = GameStatus.FINISHED;
                game.winnerId = userId;
                user.points += 1;
            } else {
                state.currentTurn = isPlayer1Attacking
                    ? (game.player2Id as string)
                    : game.player1Id;
            }

            user.tokenBalance -= MOVE_COST;
            await this.userRepository.saveUserChanges(user, transaction);

            game.gameState = state;
            game.changed('gameState', true);

            await this.gameRepository.updateGame(game, transaction);

            await transaction.commit();

            return {
                result,
                nextTurn: state.currentTurn,
                gameStatus: game.status,
                winner: game.winnerId
            };
        } catch (e: any) {
            await transaction.rollback();

            if (e.toJSON) throw e;

            throw ErrorFactory.getError(
                'DATABASE_ERROR',
                `Transazione fallita durante l'elaborazione della mossa PvP: ${e.message}`
            );
        }
    }
}