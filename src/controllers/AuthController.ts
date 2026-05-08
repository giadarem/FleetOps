import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { HttpStatus } from '../enum/httpStatus';

/**
 * @class AuthController
 * @description Controller che espone gli endpoint per l'autenticazione, facendo uso di un service 
 * per poter interrogare le basi di dati in modo indiretto.
 */
export class AuthController {
    /**
     * @constructor
     * @param {AuthService} authService - Servizio iniettato tramite Dependency Injection.
     */
    constructor(private readonly authService: AuthService) {}

    /**
     * @method login
     * @description Intercetta la richiesta HTTP POST, estrae il payload e delega l'elaborazione.
     * @param {Request} req - Oggetto della richiesta Express.
     * @param {Response} res - Oggetto della risposta Express.
     * @param {NextFunction} next - Middleware per la propagazione delle eccezioni all'ErrorHandler.
     */
    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);

            // Nelle API è obbligatorio far rispondere con stringhe sotto forma di JSON
            return res.status(HttpStatus.OK).json({
                status: HttpStatus.OK,
                message: 'Accesso eseguito correttamente.',
                data: result
            });
        } catch (error) {
            // Inoltro dell'errore verso i livelli di middleware successivi (ErrorHandler)
            next(error);
        }
    };
}