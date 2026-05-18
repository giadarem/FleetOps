import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repository/UserRepository';

/**
 * @constant router
 * @description Router Express dedicato alle rotte di autenticazione.
 * Collega gli endpoint HTTP al controller responsabile della gestione del login.
 */
const router = Router();

/**
 * @constant userRepository
 * @description Repository utilizzato dal service di autenticazione per accedere ai dati utente.
 */
const userRepository = new UserRepository();

/**
 * @constant authService
 * @description Service applicativo che gestisce la logica di autenticazione.
 */
const authService = new AuthService(userRepository);

/**
 * @constant authController
 * @description Controller che espone le operazioni HTTP relative all’autenticazione.
 */
const authController = new AuthController(authService);

/**
 * @description Registra la rotta di login e la collega al metodo del controller dedicato.
 */
router.post('/login', authController.login);

export default router;