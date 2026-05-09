// src/routes/gameRoutes.ts
import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const gameController = new GameController();

/**
 * @route POST /api/games/create
 * @description Crea una nuova partita (PvP o PvE).
 * @access Private (Richiede un Token JWT valido)
 */
router.post('/create', authenticateJWT, gameController.createGame);

export default router;