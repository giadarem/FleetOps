// src/services/GameService.ts
import { GameRepository } from '../repository/gameRepository';
import { UserRepository } from '../repository/UserRepository';
import { GameEngine } from '../utils/gameEngine';
import { ErrorFactory } from '../patterns/ErrorFactory';
import db from '../config/database'; // Necessario per le transazioni
import { ShipConfiguration, GameState } from '../types/gameTypes';
import { GameStatus } from '../enum/gameStatus';
import Game from '../models/game';

/**
 * @class GameService
 * @description Orchestratore della logica di business per il modulo FleetOps.
 * Gestisce il ciclo di vita delle partite, le transazioni economiche (token) e 
 * l'integrazione tra il motore di gioco e la persistenza.
 */
export class GameService {
    private gameRepository: GameRepository;
    private userRepository: UserRepository;

    constructor() {
        this.gameRepository = new GameRepository();
        this.userRepository = new UserRepository();
    }

    /**
     * @method createGame
     * @description Inizializza una nuova sessione di gioco (PvP o PvE).
     * Gestisce la decurtazione del credito, la generazione delle plance e la persistenza atomica.
     * * @param {string} player1Id - UUID del richiedente.
     * @param {number} gridSize - Dimensione della griglia (es. 22).
     * @param {ShipConfiguration[]} shipConfig - Array di configurazione navi.
     * @param {string} [player2Email] - Email dell'avversario (opzionale per PvE).
     * @returns {Promise<Game>} La partita creata e salvata.
     */
    async createGame(
        player1Id: string, 
        gridSize: number, 
        shipConfig: ShipConfiguration[], 
        player2Email?: string
    ): Promise<Game> {
        
        // 1. Recupero e validazione del Player 1
        const player1 = await this.userRepository.getById(player1Id);
        if (!player1) throw ErrorFactory.getError('NOT_FOUND', 'Utente richiedente non trovato.');

        // 2. Controllo disponibilità Token (Costo creazione: 0.2)
        const CREATION_COST = 0.2;
        if (player1.tokenBalance < CREATION_COST) {
            throw ErrorFactory.getError('PAYMENT_REQUIRED', 'Credito insufficiente per iniziare una nuova partita (0.2 token richiesti).');
        }

        // 3. Controllo partita attiva (Requisito: una sola partita alla volta)
        const activeGame = await this.gameRepository.getActiveGameByUserId(player1Id);
        if (activeGame) {
            throw ErrorFactory.getError('CONFLICT', 'Hai già una partita attiva. Terminala prima di crearne una nuova.');
        }

        // 4. Gestione Avversario (PvP vs PvE)
        let player2Id: string | null = null;
        if (player2Email) {
            const player2 = await this.userRepository.getByEmail(player2Email);
            if (!player2) throw ErrorFactory.getError('NOT_FOUND', 'L\'avversario specificato non esiste.');
            if (player2.id === player1Id) throw ErrorFactory.getError('BAD_REQUEST', 'Non puoi sfidare te stesso.');
            player2Id = player2.id;
        }

        // 5. Generazione delle Plance tramite GameEngine (Logica Spaziale)
        const player1Board = GameEngine.generateRandomBoard(gridSize, shipConfig);
        const player2Board = GameEngine.generateRandomBoard(gridSize, shipConfig);

        // Costruzione dell'oggetto GameState iniziale (JSONB)
        const initialState: GameState = {
            configuration: { gridSize, shipTypes: shipConfig },
            player1Board,
            player2Board,
            currentTurn: player1Id, // Il creatore inizia sempre per primo
            history: []
        };

        // 6. Esecuzione Atomica tramite Transazione
        const transaction = await db.sequelize.transaction();

        try {
            // Decurtazione Token
            player1.tokenBalance -= CREATION_COST;
            await player1.save({ transaction });

            // Creazione Record Partita
            const newGame = await this.gameRepository.createGame({
                player1Id,
                player2Id,
                status: GameStatus.ACTIVE,
                gameState: initialState
            }, transaction);

            // Consolidamento delle modifiche
            await transaction.commit();
            
            return newGame;

        } catch (error: any) {
            // Se qualcosa fallisce, annulliamo tutto (Rollback) per proteggere i token dell'utente
            await transaction.rollback();
            throw ErrorFactory.getError('INTERNAL_SERVER_ERROR', 'Errore critico durante la creazione della partita: ' + error.message);
        }
    }
}