// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class UserController
 * @description Controller responsabile della gestione delle richieste HTTP relative agli utenti.
 * Si colloca nel livello Controller dell’architettura ed espone operazioni per profilo,
 * classifica pubblica e gestione del portafoglio token.
 */
export class UserController {
    
    /**
     * @constructor
     * @description Inizializza il controller con il service dedicato alla logica applicativa degli utenti.
     *
     * @param userService Service che gestisce le operazioni di dominio relative agli utenti.
     */
    constructor(private readonly userService: UserService) {}

    /**
     * @method getProfile
     * @description Recupera le informazioni del profilo di un utente a partire dall’identificativo ricevuto nei parametri.
     * Esegue una validazione minima dell’input HTTP e delega al service il recupero dei dati.
     *
     * @param req Richiesta HTTP contenente l’identificativo dell’utente nei parametri.
     * @param res Risposta HTTP utilizzata per restituire il profilo dell’utente.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     * @throws Errore applicativo se l’identificativo dell’utente è mancante.
     */
    getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Estraiamo l'ID e forziamo TypeScript a trattarlo come singola stringa
            const id = req.params.id as string;

            if (!id) {
                // Utilizziamo la Factory invece di hardcodare il 400
                throw ErrorFactory.getError('BAD_REQUEST', 'ID mancante nella richiesta.');
            }

            const profile = await this.userService.getProfile(id);
            
            res.status(200).json(profile);
        } catch (error: any) {
            // Deleghiamo l'errore al middleware globale
            next(error);
        }
    };

    /**
     * @method getLeaderboard
     * @description Recupera la classifica pubblica globale degli utenti.
     * Delega al service il recupero dei dati ordinati secondo il punteggio applicativo.
     *
     * @param req Richiesta HTTP associata alla consultazione della classifica.
     * @param res Risposta HTTP utilizzata per restituire la leaderboard.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     */
    getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const leaderboard = await this.userService.getLeaderboard();
            res.status(200).json(leaderboard);
        } catch (error: any) {
            // Deleghiamo l'errore al middleware globale
            next(error);
        }
    };

    /**
     * @method recharge
     * @description Gestisce la ricarica dei token di un utente.
     * Valida i dati essenziali della richiesta e delega al service l’aggiornamento
     * del portafoglio token secondo le regole applicative.
     *
     * @param req Richiesta HTTP contenente email dell’utente e importo della ricarica nel body.
     * @param res Risposta HTTP utilizzata per restituire l’esito della ricarica.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     * @throws Errore applicativo se email o importo non sono validi.
     */
    recharge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, amount } = req.body;

            // Validazione base I/O direttamente nel Controller tramite ErrorFactory
            if (!email || typeof amount !== 'number' || amount <= 0) {
                throw ErrorFactory.getError('BAD_REQUEST', 'Email o importo forniti non validi. Assicurati che amount sia un numero positivo.');
            }

            // Delega la logica di business al Service
            const result = await this.userService.rechargeTokens(email, amount);
            
            res.status(200).json(result);
        } catch (error: any) {
            // Deleghiamo l'errore al middleware globale
            next(error);
        }
    };
}