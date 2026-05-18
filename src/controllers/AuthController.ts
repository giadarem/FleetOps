import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

/**
 * @class AuthController
 * @description Controller responsabile della gestione delle richieste HTTP relative all’autenticazione.
 * Si colloca nel livello Controller e delega al service la verifica delle credenziali
 * e la generazione della risposta applicativa.
 */
export class AuthController {
    /**
     * @constructor
     * @description Inizializza il controller con il service dedicato alla logica di autenticazione.
     *
     * @param authService Service che gestisce le operazioni applicative di autenticazione.
     */
    constructor(private readonly authService: AuthService) {}

    /**
     * @description Gestisce la richiesta di login di un utente.
     * Estrae le credenziali dal body della richiesta, delega l’autenticazione al service
     * e restituisce al client il risultato dell’operazione.
     *
     * @param req Richiesta HTTP contenente email e password nel body.
     * @param res Risposta HTTP utilizzata per restituire l’esito del login.
     * @param next Funzione Express per delegare eventuali errori al middleware globale.
     * @returns Promise risolta al completamento della gestione della richiesta.
     */
    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;
            
            // Invoca il servizio
            const result = await this.authService.login(email, password);
            
            res.status(200).json(result);
        } catch (error: any) {
            // Deleghiamo l'errore al Global Error Handler
            next(error); 
        }
    };
}