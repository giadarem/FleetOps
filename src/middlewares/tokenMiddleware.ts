import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repository/UserRepository';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { GAME_CREATION_COST } from '../config/gameCosts';

const userRepository = new UserRepository();

/**
 * @function checkTokenBalance
 * @description Middleware responsabile del controllo del credito token dell’utente autenticato.
 * Verifica che l’utente disponga del saldo minimo richiesto per creare una nuova partita,
 * senza applicare blocchi alle partite già iniziate.
 *
 * @param req Richiesta HTTP contenente i dati dell’utente autenticato.
 * @param res Risposta HTTP gestita da Express.
 * @param next Funzione Express per proseguire la catena dei middleware o delegare errori.
 * @returns Promise risolta al completamento del controllo sul saldo token.
 * @throws Errore applicativo se l’utente non è autenticato, non esiste o non ha token sufficienti.
 */
export const checkTokenBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authenticatedUser = (req as any).user;

        if (!authenticatedUser || !authenticatedUser.id) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Utente non autenticato o token non valido.');
        }

        const user = await userRepository.getUserById(authenticatedUser.id);
        
        if (!user) {
            throw ErrorFactory.getError('NOT_FOUND', 'Utente non trovato.');
        }

        if (user.tokenBalance < GAME_CREATION_COST) {
            throw ErrorFactory.getError(
                'UNAUTHORIZED',
                'Token insufficienti. Servono almeno 0.2 token per creare una nuova partita.'
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};