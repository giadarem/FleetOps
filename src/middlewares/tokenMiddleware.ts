import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repository/UserRepository';

const userRepository = new UserRepository();

export const checkTokenBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const user = await userRepository.getById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }

        // Se l'utente ha 0 o meno token, blocchiamo con 401
        if (user.tokenBalance <= 0) {
            return res.status(401).json({ 
                error: 'UNAUTHORIZED', 
                message: 'Token esauriti. Impossibile procedere.' 
            });
        }

        next(); // Se ha credito, prosegue
    } catch (error) {
        res.status(500).json({ error: 'TOKEN_CHECK_ERROR' });
    }
};