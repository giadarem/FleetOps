import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repository/UserRepository';

const router = Router();

// Dependency Injection manuale (colleghiamo i pezzi)
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/login', authController.login);

export default router;