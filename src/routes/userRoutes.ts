import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repository/UserRepository';
import { authenticateJWT, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Rotta per il profilo: GET /api/users/profile/:id
router.get('/profile/:id', userController.getProfile);

// Rotta per la classifica: GET /api/users/leaderboard
router.get('/leaderboard', userController.getLeaderboard);

// Rotta per ricaricare i token (PROTETTA DA JWT E RUOLO ADMIN)
router.post('/recharge', authenticateJWT, requireAdmin, userController.recharge);
export default router;