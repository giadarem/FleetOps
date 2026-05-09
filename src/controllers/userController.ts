import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
    constructor(private readonly userService: UserService) {}
    getProfile = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Validazione: l'ID deve essere una stringa
            if (typeof id !== 'string') {
                return res.status(400).json({ error: 'ID formato non valido' });
            }

            // Chiamo il Service passando solo la stringa 'id'
            const profile = await this.userService.getProfile(id);
            
            return res.status(200).json(profile);
        } catch (error: any) {
            return res.status(error.status || 500).json({ error: error.message });
        }
    };

    getLeaderboard = async (req: Request, res: Response) => {
        try {
            const leaderboard = await this.userService.getLeaderboard();
            return res.status(200).json(leaderboard);
        } catch (error: any) {
            return res.status(500).json({ error: 'Errore nel recupero della classifica.' });
        }
    };

    recharge = async (req: Request, res: Response) => {
        try {
            const { email, amount } = req.body;

            // Validazione base
            if (!email || typeof amount !== 'number' || amount <= 0) {
                return res.status(400).json({ error: 'Email o importo non validi.' });
            }

            const result = await this.userService.rechargeTokens(email, amount);
            return res.status(200).json(result);
            
        } catch (error: any) {
            return res.status(error.status || 500).json({ 
                error: error.name || 'Error',
                message: error.message 
            });
        }
    };
}