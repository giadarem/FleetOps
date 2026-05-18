// src/controllers/gameController.ts
import { Request, Response, NextFunction } from 'express';
import { PvPGameService } from '../services/PvPGameService';
import { PvEGameService } from '../services/PvEGameService';
import { GameType } from '../enum/gameType';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class GameController
 * @description Controller responsabile della gestione delle richieste HTTP relative alle partite.
 * Si colloca nel livello Controller dell’architettura e si occupa di validare il flusso
 * della richiesta, selezionare il service corretto e restituire le risposte HTTP al client.
 */
export class GameController {
    private pvpService = new PvPGameService();
    private pveService = new PvEGameService();

    /**
     * @method createGame
     * @description Gestisce la creazione di una nuova partita PvP o PvE.
     * Estrae i dati della richiesta, identifica l’utente autenticato e delega
     * la creazione al service specifico in base alla tipologia di partita richiesta.
     *
     * @param req Richiesta HTTP contenente tipo di partita, dimensione griglia, configurazione navi ed eventuale email dell’avversario.
     * @param res Risposta HTTP utilizzata per restituire la partita creata.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     * @throws Errore applicativo se la tipologia di partita non è valida o se i dati PvE non sono coerenti.
     */
    public createGame = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { type, gridSize, shipConfig, opponentEmail } = req.body;
            const userId = (req as any).user.id as string;

            let game;

            if (type === GameType.PVP) {
                game = await this.pvpService.create(
                    userId,
                    gridSize,
                    shipConfig,
                    opponentEmail
                );
            } else if (type === GameType.PVE) {
                if (opponentEmail !== undefined && opponentEmail !== null) {
                    throw ErrorFactory.getError(
                        'BAD_REQUEST',
                        'L’email dell’avversario non deve essere fornita per una partita PvE.'
                    );
                }

                game = await this.pveService.create(
                    userId,
                    gridSize,
                    shipConfig
                );
            } else {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'Tipologia di partita non valida.'
                );
            }

            res.status(201).json(game);
        } catch (error: any) {
            next(error);
        }
    };

    /**
     * @method abandonGame
     * @description Gestisce l’abbandono di una partita in corso da parte dell’utente autenticato.
     * Recupera l’identificativo della partita e dell’utente, delegando al service
     * l’applicazione delle regole di dominio relative alla chiusura della partita.
     *
     * @param req Richiesta HTTP contenente l’identificativo della partita nei parametri.
     * @param res Risposta HTTP utilizzata per restituire l’esito dell’abbandono.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     */
    public abandonGame = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id as string;

            const updatedGame = await this.pveService.abandonGame(id, userId);

            res.status(200).json({
                message: 'Partita abbandonata con successo.',
                gameId: updatedGame.id,
                status: updatedGame.status,
                winnerId: updatedGame.winnerId
            });
        } catch (error: any) {
            next(error);
        }
    };

    /**
     * @method makeMove
     * @description Gestisce l’esecuzione di una mossa in una partita esistente.
     * Determina la tipologia della partita e delega la logica di movimento
     * al service PvP o PvE appropriato.
     *
     * @param req Richiesta HTTP contenente l’identificativo della partita nei parametri e le coordinate della mossa nel body.
     * @param res Risposta HTTP utilizzata per restituire il risultato della mossa.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     * @throws Errore applicativo se la tipologia di partita recuperata non è valida.
     */
    public makeMove = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id as string;
            const { x, y } = req.body;
            const userId = (req as any).user.id as string;

            const gameType = await this.pveService.getGameType(id);

            let result;

            if (gameType === GameType.PVP) {
                result = await this.pvpService.processMove(id, userId, x, y);
            } else if (gameType === GameType.PVE) {
                result = await this.pveService.processMove(id, userId, x, y);
            } else {
                throw ErrorFactory.getError(
                    'BAD_REQUEST',
                    'Tipologia di partita non valida.'
                );
            }

            res.status(200).json(result);
        } catch (error: any) {
            next(error);
        }
    };

    /**
     * @method getGameHistory
     * @description Gestisce il download dello storico delle mosse di una partita.
     * Recupera i dati tramite il service e li restituisce al client come file JSON scaricabile.
     *
     * @param req Richiesta HTTP contenente l’identificativo della partita nei parametri.
     * @param res Risposta HTTP utilizzata per inviare lo storico in formato JSON.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     */
    public getGameHistory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id as string;

            const historyData = await this.pveService.getGameHistory(id, userId);
            const jsonString = JSON.stringify(historyData, null, 2);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=history_game_${id}.json`
            );

            res.send(jsonString);
        } catch (error: any) {
            next(error);
        }
    };

    /**
     * @method getGameState
     * @description Restituisce lo stato sintetico di una partita.
     * Delega al service il recupero e il controllo di accesso ai dati della partita richiesta.
     *
     * @param req Richiesta HTTP contenente l’identificativo della partita nei parametri.
     * @param res Risposta HTTP utilizzata per restituire lo stato della partita.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     */
    public getGameState = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id as string;

            const gameState = await this.pveService.getGameState(id, userId);

            res.status(200).json(gameState);
        } catch (error: any) {
            next(error);
        }
    };

    /**
     * @method getUserGamesList
     * @description Restituisce l’elenco delle partite associate all’utente autenticato.
     * Delega al service il recupero delle partite e mantiene nel controller
     * la sola responsabilità di gestione della risposta HTTP.
     *
     * @param req Richiesta HTTP contenente i dati dell’utente autenticato.
     * @param res Risposta HTTP utilizzata per restituire la lista delle partite.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     */
    public getUserGamesList = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = (req as any).user.id as string;

            const games = await this.pveService.getUserGamesList(userId);

            res.status(200).json(games);
        } catch (error: any) {
            next(error);
        }
    };
}