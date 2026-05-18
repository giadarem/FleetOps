import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { checkTokenBalance } from '../middlewares/tokenMiddleware';

/**
 * @constant router
 * @description Router Express dedicato alle rotte di gestione delle partite.
 * Definisce gli endpoint relativi a creazione, mosse, abbandono, storico e stato partita.
 */
const router = Router();

/**
 * @constant gameController
 * @description Controller responsabile della gestione HTTP delle operazioni sulle partite.
 */
const gameController = new GameController();

/**
 * @route POST /api/games/new-game
 * @description Crea una nuova partita PvP o PvE.
 * Applica l’autenticazione JWT e il controllo del credito token prima di delegare
 * la richiesta al controller.
 *
 * @access Private - richiede JWT valido e credito iniziale disponibile.
 */
router.post('/new-game', authenticateJWT, checkTokenBalance, gameController.createGame);

/**
 * @route GET /api/games/my-history
 * @description Restituisce lo storico delle partite associate all’utente autenticato.
 * Applica l’autenticazione JWT e delega al controller il recupero dell’elenco.
 *
 * @access Private - richiede JWT valido.
 */
router.get('/my-history', authenticateJWT, gameController.getUserGamesList);

/**
 * @route PATCH /api/games/:id/abandon
 * @description Gestisce l’abbandono di una partita già iniziata.
 * Richiede solo autenticazione, poiché il controllo del credito non deve bloccare
 * operazioni su partite in corso.
 *
 * @access Private - richiede JWT valido.
 */
router.patch('/:id/abandon', authenticateJWT, gameController.abandonGame);

/**
 * @route POST /api/games/:id/move
 * @description Registra una mossa su una partita già iniziata.
 * Delega al controller la selezione del service corretto in base alla tipologia di partita.
 *
 * @access Private - richiede JWT valido.
 */
router.post('/:id/move', authenticateJWT, gameController.makeMove);

/**
 * @route GET /api/games/:id/history-game
 * @description Restituisce lo storico delle mosse di una partita come file JSON scaricabile.
 *
 * @access Private - richiede JWT valido.
 */
router.get('/:id/history-game', authenticateJWT, gameController.getGameHistory);

/**
 * @route GET /api/games/:id/state-game
 * @description Restituisce lo stato sintetico corrente di una partita.
 *
 * @access Private - richiede JWT valido.
 */
router.get('/:id/state-game', authenticateJWT, gameController.getGameState);

export default router;