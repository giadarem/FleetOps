// src/controllers/GameController.ts
import { Request, Response } from 'express';
import { GameService } from '../services/gameService';

/**
 * @class GameController
 * @description Gestisce le richieste HTTP in ingresso per il dominio delle partite.
 * Agisce come strato di traduzione tra il protocollo web (Express) e la logica di business (Service).
 */
export class GameController {
    private gameService: GameService;

    constructor() {
        this.gameService = new GameService();
    }

    /**
     * @method createGame
     * @description Endpoint per l'inizializzazione di una nuova sessione di gioco.
     * Esegue una validazione sintattica dell'input prima di delegare l'esecuzione al Service.
     */
    public createGame = async (req: Request, res: Response): Promise<Response> => {
        try {
            //  Estrazione del payload e dell'identità utente
            // L'ID utente è garantito dal middleware authenticateJWT che inietta req.user
            const player1Id = (req as any).user.id; 
            const { gridSize, shipConfig, player2Email } = req.body;

            //  Validazione Sintattica (Fail-Fast)
            // Se i dati base mancano o sono palesemente errati, respingiamo subito la richiesta (400)
            if (!gridSize || typeof gridSize !== 'number' || gridSize < 10) {
                return res.status(400).json({ error: 'BAD_REQUEST', message: 'gridSize non valido. Deve essere un numero >= 10.' });
            }

            if (!shipConfig || !Array.isArray(shipConfig) || shipConfig.length === 0) {
                return res.status(400).json({ error: 'BAD_REQUEST', message: 'shipConfig mancante o in formato errato.' });
            }

            //  Esecuzione Business Logic
            const newGame = await this.gameService.createGame(
                player1Id,
                gridSize,
                shipConfig,
                player2Email
            );

            //  Risposta di Successo (201 Created)
            return res.status(201).json({
                message: 'Partita creata con successo.',
                gameId: newGame.id,
                status: newGame.status,
            });

        } catch (error: any) {
            // Gestione Centralizzata Errori
            // Intercetta le eccezioni lanciate da ErrorFactory 
            const status = error.status || 500;
            return res.status(status).json({
                error: error.name || 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Si è verificato un errore imprevisto.'
            });
        }
    };
}