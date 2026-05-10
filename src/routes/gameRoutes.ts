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
router.patch('/:id/abandon', authenticateJWT, gameController.abandonGame);
router.post('/:id/move', authenticateJWT, gameController.makeMove);
// 3. Storico (Restituisce il FILE JSON)
router.get('/:id/history', authenticateJWT, gameController.getGameHistory);

// 4. Stato partita
router.get('/:id/state', authenticateJWT, gameController.getGameState);
router.get('/my-history', authenticateJWT, gameController.getUserGamesList);
export default router;