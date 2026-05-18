import { Request, Response, NextFunction } from 'express';
import { IAppError, ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @function errorHandlerMiddleware
 * @description Middleware globale per la gestione centralizzata degli errori in Express.
 * Intercetta gli errori generati dall’applicazione, normalizza quelli non già formattati
 * tramite ErrorFactory e restituisce al client una risposta JSON coerente.
 *
 * @param err Errore catturato durante la gestione della richiesta.
 * @param req Oggetto richiesta Express.
 * @param res Oggetto risposta Express utilizzato per inviare l’errore al client.
 * @param next Funzione Express per passare il controllo al middleware successivo.
 * @returns void
 */
export const errorHandlerMiddleware = (
    err: any, 
    req: Request, 
    res: Response, 
    next: NextFunction
): void => {
    console.error('[MIDDLEWARE ERROR]:', err);

    let appError: IAppError;

    // Verifica se l'errore è già stato formattato dalla nostra Factory
    if (err && typeof err.toJSON === 'function') {
        appError = err;
    } else {
        //wrappa l'errore generico non gestito tramite la Factory
        appError = ErrorFactory.getError('INTERNAL_SERVER_ERROR', err.message || 'Errore di sistema imprevisto');
    }

    // Risponde al client con il corretto Status Code e la stringa in formato JSON
    res.status(appError.status).type('application/json').send(appError.toJSON());
};