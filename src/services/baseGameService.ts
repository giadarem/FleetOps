// src/services/baseGameService.ts
import { GameRepository } from '../repository/gameRepository';
import { UserRepository } from '../repository/UserRepository';
import { GameEngine } from '../utils/gameEngine';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { GameStatus } from '../enum/gameStatus';
import { GameType } from '../enum/gameType';
import { ShipConfiguration, GameState } from '../types/gameTypes';
import Game from '../models/game';
import db from '../config/database';
import { Transaction } from 'sequelize';
import { GAME_CREATION_COST } from '../config/gameCosts';

/**
 * @abstract
 * @class BaseGameService
 * @description Service astratto che centralizza la logica comune alle partite PvP e PvE.
 * Si colloca nel livello Service dell’architettura e gestisce validazioni,
 * recupero dati condiviso, controllo accessi, storico, stato partita e abbandono.
 */
export abstract class BaseGameService {
    protected gameRepository: GameRepository;
    protected userRepository: UserRepository;

    /**
     * @constructor
     * @description Inizializza i repository necessari alla gestione applicativa delle partite.
     */
    constructor() {
        this.gameRepository = new GameRepository();
        this.userRepository = new UserRepository();
    }

    /**
     * @method validateGameCreationInput
     * @protected
     * @description Valida i dati comuni richiesti per la creazione di una partita.
     * Controlla la tipologia di partita, la dimensione della griglia e la configurazione delle navi.
     *
     * @param type Tipologia della partita da creare.
     * @param gridSize Dimensione della griglia ricevuta in input.
     * @param shipConfig Configurazione delle navi ricevuta in input.
     * @returns void
     * @throws Errore applicativo se i dati di creazione non sono validi.
     */
    protected validateGameCreationInput(
        gridSize: unknown,
        shipConfig: unknown
    ): void {
        this.validateGridSize(gridSize);
        this.validateShipConfig(shipConfig, gridSize as number);
    }

    /**
     * @method validateGridSize
     * @protected
     * @description Valida la dimensione della griglia di gioco.
     * Garantisce che il valore sia un numero intero compatibile con i requisiti minimi della partita.
     *
     * @param gridSize Dimensione della griglia da validare.
     * @returns void
     * @throws Errore applicativo se la dimensione della griglia non è valida.
     */
    protected validateGridSize(gridSize: unknown): void {
        if (!Number.isInteger(gridSize) || (gridSize as number) < 5) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'La dimensione della griglia deve essere un numero intero maggiore o uguale a 5.'
            );
        }
    }

    /**
     * @method validateShipConfig
     * @protected
     * @description Valida la configurazione delle navi prima della generazione delle board.
     * Controlla struttura, valori numerici, compatibilità con la griglia e spazio occupato complessivo.
     *
     * @param shipConfig Configurazione delle navi da validare.
     * @param gridSize Dimensione della griglia su cui posizionare le navi.
     * @returns void
     * @throws Errore applicativo se la configurazione delle navi non è valida o non è compatibile con la griglia.
     */
    protected validateShipConfig(shipConfig: unknown, gridSize: number): void {
        if (!Array.isArray(shipConfig) || shipConfig.length === 0) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'La configurazione delle navi è obbligatoria.'
            );
        }

        let occupiedCells = 0;

        for (const ship of shipConfig) {
            if (
                !ship ||
                typeof ship !== 'object' ||
                !Number.isInteger((ship as ShipConfiguration).type) ||
                (ship as ShipConfiguration).type <= 0 ||
                !Number.isInteger((ship as ShipConfiguration).size) ||
                (ship as ShipConfiguration).size <= 0 ||
                !Number.isInteger((ship as ShipConfiguration).count) ||
                (ship as ShipConfiguration).count <= 0
            ) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'Ogni nave deve avere type, size e count interi positivi.'
                );
            }

            const currentShip = ship as ShipConfiguration;

            if (currentShip.size > gridSize) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'La dimensione di una nave non può superare la dimensione della griglia.'
                );
            }

            occupiedCells += currentShip.size * currentShip.count;
        }

        if (occupiedCells > gridSize * gridSize) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'La configurazione delle navi non è compatibile con la dimensione della griglia.'
            );
        }
    }

    /**
     * @method validateCoordinates
     * @protected
     * @description Valida le coordinate di una mossa rispetto alla griglia di gioco.
     * Garantisce che le coordinate siano intere e comprese nei limiti della mappa.
     *
     * @param x Coordinata orizzontale della mossa.
     * @param y Coordinata verticale della mossa.
     * @param gridSize Dimensione della griglia di riferimento.
     * @returns void
     * @throws Errore applicativo se le coordinate non sono intere o sono fuori griglia.
     */
    protected validateCoordinates(x: unknown, y: unknown, gridSize: number): void {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'Le coordinate devono essere numeri interi.'
            );
        }

        if (
            (x as number) < 0 ||
            (y as number) < 0 ||
            (x as number) >= gridSize ||
            (y as number) >= gridSize
        ) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                `Coordinate fuori mappa! Valori ammessi: da 0 a ${gridSize - 1}.`
            );
        }
    }

    /**
     * @method prepareGameCreation
     * @protected
     * @description Prepara la creazione di una partita eseguendo i controlli comuni di dominio.
     * Valida griglia e navi, recupera l’utente con lock transazionale, verifica credito,
     * controlla l’assenza di partite attive e genera le board iniziali.
     *
     * @param player1Id Identificativo dell’utente che crea la partita.
     * @param gridSize Dimensione della griglia di gioco.
     * @param shipConfig Configurazione delle navi da posizionare.
     * @param transaction Transazione Sequelize usata per garantire atomicità nella creazione.
     * @returns Dati preparatori necessari alla creazione della partita.
     * @throws Errore applicativo se l’utente non esiste, ha credito insufficiente o ha già una partita attiva.
     */
    protected async prepareGameCreation(
        player1Id: string,
        gridSize: number,
        shipConfig: ShipConfiguration[],
        transaction: Transaction
    ) {
        this.validateGameCreationInput(gridSize, shipConfig);

        const player1 = await this.userRepository.getUserById(player1Id, transaction, true);

        if (!player1) {
            throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato.');
        }

        const COST = GAME_CREATION_COST;

        if (player1.tokenBalance < COST) {
            throw ErrorFactory.getError(
                'UNAUTHORIZED',
                'Token insufficienti per avviare una partita.'
            );
        }

        const activeGame = await this.gameRepository.getActiveGameByUserId(player1Id, transaction, true);

        if (activeGame) {
            throw ErrorFactory.getError(
                'BAD_REQUEST',
                'Hai già una partita attiva. Terminala prima di iniziarne una nuova.'
            );
        }

        const player1Board = GameEngine.generateRandomBoard(gridSize, shipConfig);
        const player2Board = GameEngine.generateRandomBoard(gridSize, shipConfig);

        return {
            player1,
            player1Board,
            player2Board,
            COST
        };
    }

    /**
     * @method getGameType
     * @description Recupera la tipologia di una partita tramite il suo identificativo.
     * Mantiene il Controller separato dall’accesso diretto al Repository.
     *
     * @param gameId Identificativo della partita da consultare.
     * @returns Tipologia della partita.
     * @throws Errore applicativo se la partita non viene trovata.
     */
    public async getGameType(gameId: string): Promise<GameType> {
        const game = await this.gameRepository.getById(gameId);

        if (!game) {
            throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
        }

        return game.type;
    }

    /**
     * @method getGameHistory
     * @description Restituisce lo storico delle mosse di una partita.
     * Verifica che l’utente richiedente sia uno dei partecipanti prima di esporre i dati.
     *
     * @param gameId Identificativo della partita.
     * @param userId Identificativo dell’utente richiedente.
     * @returns Oggetto contenente dati principali della partita e storico delle mosse.
     * @throws Errore applicativo se la partita non esiste o l’utente non è autorizzato.
     */
    public async getGameHistory(gameId: string, userId: string) {
        const game = await this.gameRepository.getById(gameId);

        if (!game) {
            throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
        }

        if (game.player1Id !== userId && game.player2Id !== userId) {
            throw ErrorFactory.getError(
                'FORBIDDEN',
                'Non sei autorizzato a visualizzare lo storico di questa partita.'
            );
        }

        const state = game.gameState as GameState;

        return {
            gameId: game.id,
            player1Id: game.player1Id,
            player2Id: game.player2Id,
            type: game.type,
            history: state.history || []
        };
    }

    /**
     * @method getGameState
     * @description Restituisce uno stato sintetico della partita.
     * Verifica l’autorizzazione dell’utente e arricchisce la risposta con email
     * del turno corrente e dell’eventuale vincitore quando disponibili.
     *
     * @param gameId Identificativo della partita.
     * @param userId Identificativo dell’utente richiedente.
     * @returns Stato sintetico della partita con informazioni su turno, stato e vincitore.
     * @throws Errore applicativo se la partita non esiste o l’utente non è autorizzato.
     */
    public async getGameState(gameId: string, userId: string) {
        const game = await this.gameRepository.getById(gameId);

        if (!game) {
            throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
        }

        if (game.player1Id !== userId && game.player2Id !== userId) {
            throw ErrorFactory.getError(
                'FORBIDDEN',
                'Non sei autorizzato a visualizzare questa partita.'
            );
        }

        const state = game.gameState as GameState;

        let currentTurnEmail = 'IA';

        if (state.currentTurn && state.currentTurn !== 'IA') {
            const currentPlayer = await this.userRepository.getUserById(state.currentTurn);

            if (currentPlayer) {
                currentTurnEmail = currentPlayer.email;
            }
        }

        let winnerEmail = null;

        if (game.winnerId) {
            const winner = await this.userRepository.getUserById(game.winnerId);

            if (winner) {
                winnerEmail = winner.email;
            }
        }

        return {
            gameId: game.id,
            type: game.type,
            status: game.status,
            currentTurnId: state.currentTurn,
            currentTurnEmail,
            winnerId: game.winnerId,
            winnerEmail
        };
    }

    /**
     * @method getUserGamesList
     * @description Restituisce l’elenco delle partite associate all’utente autenticato.
     * Trasforma i dati persistiti in una rappresentazione sintetica adatta alla risposta API,
     * includendo email dei giocatori e gestione del caso IA.
     *
     * @param userId Identificativo dell’utente di cui recuperare le partite.
     * @returns Lista sintetica delle partite associate all’utente.
     */
    public async getUserGamesList(userId: string) {
        const games = await this.gameRepository.getAllUserGamesWithEmails(userId);

        return games.map((game: any) => ({
            id: game.id,
            type: game.type,
            status: game.status,
            player1: game.Player1?.email || 'N/A',
            player2: game.type === GameType.PVE ? 'IA' : (game.Player2?.email || 'N/A'),
            winner: game.type === GameType.PVE &&
            game.winnerId === null &&
            (game.status === GameStatus.FINISHED || game.status === GameStatus.ABANDONED)
                ? 'IA'
                : (game.Winner?.email || 'Nessuno'),
            createdAt: game.createdAt
        }));
    }

    /**
     * @method abandonGame
     * @description Gestisce l’abbandono di una partita attiva tramite transazione.
     * Verifica esistenza, stato e autorizzazione, aggiorna lo stato della partita,
     * calcola l’eventuale vincitore e assegna il punteggio previsto.
     *
     * @param gameId Identificativo della partita da abbandonare.
     * @param userId Identificativo dell’utente che richiede l’abbandono.
     * @returns Partita aggiornata dopo l’abbandono.
     * @throws Errore applicativo se la partita non esiste, non è attiva, l’utente non è autorizzato o la transazione fallisce.
     */
    public async abandonGame(gameId: string, userId: string): Promise<Game> {
        const transaction = await db.sequelize.transaction();

        try {
            const game = await this.gameRepository.getById(gameId, transaction, true);

            if (!game) {
                throw ErrorFactory.getError('NOT_FOUND', 'Partita non trovata.');
            }

            if (game.status !== GameStatus.ACTIVE) {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'La partita non è attiva e non può essere abbandonata.'
                );
            }

            if (game.player1Id !== userId && game.player2Id !== userId) {
                throw ErrorFactory.getError(
                    'FORBIDDEN',
                    'Non hai i permessi per chiudere questa partita.'
                );
            }


            const calculatedWinnerId =
                game.type === GameType.PVE
                    ? null
                    : game.player1Id === userId
                        ? game.player2Id
                        : game.player1Id;

            game.status = GameStatus.ABANDONED;
            game.winnerId = calculatedWinnerId;

            if (calculatedWinnerId) {
                const winner = await this.userRepository.getUserById(calculatedWinnerId, transaction, true);

                if (winner) {
                    winner.points += 0.5;
                    await this.userRepository.saveUserChanges(winner, transaction);
                }
            }

            const updatedGame = await this.gameRepository.updateGame(game, transaction);

            await transaction.commit();

            return updatedGame;
        } catch (e: any) {
            await transaction.rollback();

            if (e.toJSON) throw e;

            throw ErrorFactory.getError(
                'DATABASE_ERROR',
                `Transazione fallita durante l'abbandono della partita: ${e.message}`
            );
        }
    }
}