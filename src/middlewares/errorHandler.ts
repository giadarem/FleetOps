import { Request, Response, NextFunction } from 'express';
import { IAppError, ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @function errorHandlerMiddleware
 * @description Middleware globale per la gestione centralizzata degli errori in Express.
 * Intercetta gli errori e li restituisce al client sotto forma di stringa JSON.
 * * @param {any} err - L'errore catturato (può essere un IAppError o un'eccezione nativa).
 * @param {Request} req - L'oggetto richiesta Express.
 * @param {Response} res - L'oggetto risposta Express.
 * @param {NextFunction} next - Funzione per passare il controllo al middleware successivo.
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
    res.status(appError.statusCode).type('application/json').send(appError.toJSON());
};