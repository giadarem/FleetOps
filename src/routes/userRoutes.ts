import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repository/UserRepository';
import { authenticateJWT, requireAdmin } from '../middlewares/authMiddleware';

/**
 * @constant router
 * @description Router Express dedicato alle rotte relative agli utenti.
 * Definisce gli endpoint per profilo, classifica e ricarica del saldo token.
 */
const router = Router();

/**
 * @constant userRepository
 * @description Repository utilizzato dal service utenti per accedere ai dati persistenti.
 */
const userRepository = new UserRepository();

/**
 * @constant userService
 * @description Service applicativo responsabile della logica relativa agli utenti.
 */
const userService = new UserService(userRepository);

/**
 * @constant userController
 * @description Controller che gestisce le richieste HTTP relative agli utenti.
 */
const userController = new UserController(userService);

/**
 * @route GET /api/users/profile/:id
 * @description Restituisce il profilo dell’utente identificato dal parametro id.
 *
 * @access Public
 */
router.get('/profile/:id', userController.getProfile);

/**
 * @route GET /api/users/leaderboard
 * @description Restituisce la classifica pubblica degli utenti ordinata per punteggio.
 *
 * @access Public
 */
router.get('/leaderboard', userController.getLeaderboard);

/**
 * @route PATCH /api/users/balance
 * @description Ricarica il saldo token di un utente.
 * Applica autenticazione JWT e controllo del ruolo ADMIN prima di delegare
 * la richiesta al controller.
 *
 * @access Private - richiede JWT valido e ruolo ADMIN.
 */
router.patch('/balance', authenticateJWT, requireAdmin, userController.recharge);

export default router;