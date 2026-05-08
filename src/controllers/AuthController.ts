import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

/**
 * @class AuthController
 * @description Gestore delle richieste HTTP per l'autenticazione.
 */
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Gestisce l'endpoint di login.
     */
    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            
            // Invochiamo il servizio
            const result = await this.authService.login(email, password);
            
            // Se tutto va bene, rispondiamo 200 OK
            return res.status(200).json(result);
        } catch (error: any) {
            /**
             * Agisce ErrorFactory. 
             * Se il service lancia un errore 'UNAUTHORIZED', 
             * verrà catturato qui e inviato al client.
             */
            return res.status(error.status || 500).json({
                error: error.name,
                message: error.message
            });
        }
    };
}