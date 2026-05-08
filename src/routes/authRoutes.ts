import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repository/userRepository';
import { UserDAO } from '../dao/userDAO';

const router = Router();

// Implementazione della Dependency Injection esplicita
const userDAO = new UserDAO();
const userRepository = new UserRepository(userDAO);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// L'azione è già implicita nel verbo della chiamata HTTP
router.post('/login', authController.login);

export default router;