import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/JWTUtils';
import { ErrorFactory } from '../patterns/ErrorFactory';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Token mancante o non valido.');
        }

        const token = authHeader.split(' ')[1];
        // Sfruttiamo il tuo JWTUtils per validare la firma RS256
        const decoded = JWTUtils.verifyToken(token);
        
        // Iniettiamo i dati dell'utente nella request per i middleware successivi
        (req as any).user = decoded; 
        
        next();
    } catch (error: any) {
        return res.status(error.status || 401).json({ error: error.message });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user && user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ error: 'Accesso negato. Privilegi di ADMIN richiesti.' });
    }
};