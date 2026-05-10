// src/controllers/GameController.ts
import { Request, Response } from 'express'; // 
import { PvPGameService } from '../services/PvPGameService';
import { PvEGameService } from '../services/PvEGameService';
import { GameRepository } from '../repository/gameRepository';
import { GameType } from '../enum/gameType';

export class GameController {
    private pvpService = new PvPGameService();
    private pveService = new PvEGameService();
    private gameRepository = new GameRepository(); //controlla il tipo di partita

    /**
     * @method createGame
     * @description Gestisce la creazione di una partita smistando la richiesta
     * tra il servizio PvP e quello PvE.
     */
    public createGame = async (req: Request, res: Response): Promise<Response> => {
        try {
            // Estrae i dati dal body
            const { type, gridSize, shipConfig, opponentEmail } = req.body;
            
            // Recupera l'ID utente iniettato dal middleware di autenticazione
            const userId = (req as any).user.id;

            let game;

            if (type === 'PVP') {
                // Chiamata al servizio per giocatore contro giocatore
                game = await this.pvpService.create(userId, gridSize, shipConfig, opponentEmail);
            } else {
                // Chiamata al servizio per giocatore contro IA
                game = await this.pveService.create(userId, gridSize, shipConfig);
            }

            // res.status(201)
            return res.status(201).json(game);

        } catch (error: any) {
            // Gestione centralizzata degli errori 
            const statusCode = error.status || 500;
            return res.status(statusCode).json({
                error: error.name || 'Internal Server Error',
                message: error.message
            });
        }
    }



    public abandonGame = async (req: Request, res: Response): Promise<Response> => {
        try {
            // Estrae l'id e forzia il tipo a stringa
            const id = req.params.id as string; 
        
            const userId = (req as any).user.id as string;

            const updatedGame = await this.pvpService.abandonGame(id, userId);

            return res.status(200).json({
                message: 'Partita abbandonata con successo.',
                gameId: updatedGame.id,
                status: updatedGame.status,
                winnerId: updatedGame.winnerId
            });
        } catch (error: any) {
            const status = error.status || 500;
            return res.status(status).json({ error: error.name, message: error.message });
        }
    };


    /**
     * @method makeMove
     * @description Endpoint per effettuare un attacco.
     */
    public makeMove = async (req: Request, res: Response): Promise<Response> => {
        try {
            const  id  = req.params.id as string; // ID della partita dall'URL
            const { x, y } = req.body; // Coordinate dal Body
            const userId = (req as any).user.id as string;

            // 1. Recupera la partita per capire se dobbiamo usare la logica PvP o PvE
            const game = await this.gameRepository.getById(id);
            if (!game) {
                return res.status(404).json({ error: 'NOT_FOUND', message: 'Partita non trovata.' });
            }

            let result;

            // 2. Smistamento in base alla tipologia 
            if (game.type === GameType.PVP) {
                result = await this.pvpService.processMove(id, userId, x, y);
            } else {
                result = await this.pveService.processMove(id, userId, x, y);
            }

            // 3. Risposta con l'esito del colpo (HIT, MISS, SUNK) e lo stato aggiornato
            return res.status(200).json(result);

        } catch (error: any) {
            const status = error.status || 500;
            return res.status(status).json({ 
                error: error.name || 'INTERNAL_ERROR', 
                message: error.message 
            });
        }
    };


    /**
     * @method getGameHistory
     * @description Requisito Esame: Restituisce lo storico delle mosse come FILE .json scaricabile.
     */
    public getGameHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id as string;
            const game = await this.gameRepository.getById(id);

            if (!game) {
                res.status(404).json({ error: 'NOT_FOUND', message: 'Partita non trovata.' });
                return;
            }

            const state = game.gameState as any;
            const historyData = {
                gameId: game.id,
                player1Id: game.player1Id,
                player2Id: game.player2Id,
                type: game.type,
                history: state.history || []
            };

            // Trasformiamo l'oggetto in una stringa JSON formattata
            const jsonString = JSON.stringify(historyData, null, 2);

            // SETTAGGIO HEADER PER IL DOWNLOAD DEL FILE
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=history_game_${id}.json`);
            
            // Inviamo la stringa come corpo del file
            res.send(jsonString);

        } catch (error: any) {
            res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
        }
    };


    /**
     * @method getGameState
     * @description Requisito Esame: Valuta lo stato di una partita (turno, status, vincitore).
     */
    public getGameState = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id as string;
            const game = await this.gameRepository.getById(id);

            if (!game) {
                res.status(404).json({ error: 'NOT_FOUND', message: 'Partita non trovata.' });
                return;
            }

            // Estraiamo lo stato dal JSONB
            const state = game.gameState as any; 

            // Risposta con i dati essenziali richiesti
            res.status(200).json({
                gameId: game.id,
                type: game.type,
                status: game.status,            // es: 'ACTIVE', 'FINISHED', 'ABANDONED'
                currentTurn: state.currentTurn, // L'ID del giocatore a cui tocca sparare
                winnerId: game.winnerId         // L'ID del vincitore (null se in corso)
            });

        } catch (error: any) {
            res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
        }
    };


    /**
     * @method getUserGamesList
     * @description Rotta Extra: Restituisce la lista di tutte le partite dell'utente
     * con email dei partecipanti, vincitore e stato.
     */
    public getUserGamesList = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;

            // Chiamiamo il repository per avere le partite con le email
            const games = await this.gameRepository.getAllUserGamesWithEmails(userId);

            const formattedHistory = games.map((g: any) => ({
                id: g.id,
                type: g.type,
                status: g.status,
                player1: g.Player1?.email || 'N/A',
                player2: g.type === 'PVE' ? 'IA' : (g.Player2?.email || 'N/A'),
                winner: g.winnerId === null && g.status === 'FINISHED' ? 'IA' : (g.Winner?.email || 'Nessuno'),
                createdAt: g.createdAt
            }));

            res.status(200).json(formattedHistory);
        } catch (error: any) {
            res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
        }
    };
    

}