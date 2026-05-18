import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/JWTUtils';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @function authenticateJWT
 * @description Middleware responsabile della verifica del token JWT nelle richieste protette.
 * Estrae il token dall’header Authorization, lo valida e rende disponibili i dati
 * dell’utente autenticato all’interno della richiesta Express.
 *
 * @param req Richiesta HTTP contenente l’header Authorization con token Bearer.
 * @param res Risposta HTTP gestita da Express.
 * @param next Funzione Express per proseguire la catena dei middleware o delegare errori.
 * @returns void
 * @throws Errore applicativo se il token è mancante, malformato o non valido.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Token mancante o non valido.');
        }

        const token = authHeader.split(' ')[1];
        const decoded = JWTUtils.verifyToken(token);
        (req as any).user = decoded; 
        
        next();
    } catch (error: any) {
        // CORRETTO: Passa l'errore al Global Error Handler
        next(error); 
    }
};

/**
 * @function requireAdmin
 * @description Middleware responsabile del controllo dei privilegi amministrativi.
 * Verifica che l’utente autenticato abbia ruolo ADMIN prima di consentire
 * l’accesso alle rotte riservate.
 *
 * @param req Richiesta HTTP contenente i dati dell’utente autenticato.
 * @param res Risposta HTTP gestita da Express.
 * @param next Funzione Express per proseguire la catena dei middleware o delegare errori.
 * @returns void
 * @throws Errore applicativo se l’utente non possiede privilegi di amministratore.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user && user.role === 'ADMIN') {
        next();
    } else {
        // CORRETTO: Usa la factory e passa al Global Error Handler
        next(ErrorFactory.getError('FORBIDDEN', 'Accesso negato. Privilegi di ADMIN richiesti.'));
    }
};