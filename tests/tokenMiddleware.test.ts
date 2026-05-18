import { Request, Response, NextFunction } from 'express';
import { checkTokenBalance } from '../src/middlewares/tokenMiddleware';
import { UserRepository } from '../src/repository/UserRepository';

/**
 * @description Mock del modulo UserRepository.
 * Permette di isolare il middleware checkTokenBalance dal database reale,
 * simulando il recupero dell’utente senza eseguire query su PostgreSQL.
 */
jest.mock('../src/repository/UserRepository');

/**
 * @description Suite di test dedicata al middleware checkTokenBalance.
 * Verifica il comportamento del middleware in base allo stato dell’utente autenticato
 * e alla disponibilità del saldo token necessario per creare una nuova partita.
 */
describe('Token Middleware - checkTokenBalance', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.MockedFunction<NextFunction>;

    /**
     * @description Inizializza request, response e next mockati prima di ogni test.
     * Questo garantisce che ogni scenario venga eseguito in modo isolato,
     * senza dati residui provenienti dai test precedenti.
     */
    beforeEach(() => {
        mockRequest = {
            user: { id: 'test-user-id' }
        } as any;

        mockResponse = {};

        nextFunction = jest.fn();

        jest.clearAllMocks();
    });

    /**
     * @test
     * @description Verifica che il middleware deleghi un errore UNAUTHORIZED
     * quando l’utente autenticato non ha token sufficienti per creare una nuova partita.
     */
    it('dovrebbe delegare un errore UNAUTHORIZED se il saldo token è insufficiente', async () => {
        (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue({
            id: 'test-user-id',
            tokenBalance: 0
        });

        await checkTokenBalance(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledTimes(1);

        const error = nextFunction.mock.calls[0][0] as any;

        expect(error.status).toBe(401);
        expect(error.message).toBe(
            'Token insufficienti. Servono almeno 0.2 token per creare una nuova partita.'
        );
    });

    /**
     * @test
     * @description Verifica che il middleware consenta il proseguimento della richiesta
     * quando l’utente autenticato dispone di un saldo token sufficiente.
     */
    it('dovrebbe richiamare next() e procedere se il saldo token è sufficiente', async () => {
        (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue({
            id: 'test-user-id',
            tokenBalance: 10
        });

        await checkTokenBalance(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect(nextFunction).toHaveBeenCalledWith();
    });

    /**
     * @test
     * @description Verifica che il middleware deleghi un errore UNAUTHORIZED
     * quando nella request non sono presenti i dati dell’utente autenticato.
     */
    it('dovrebbe delegare un errore UNAUTHORIZED se l’utente autenticato è assente', async () => {
        mockRequest = {} as any;

        await checkTokenBalance(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledTimes(1);

        const error = nextFunction.mock.calls[0][0] as any;

        expect(error.status).toBe(401);
        expect(error.message).toBe('Utente non autenticato o token non valido.');
    });

    /**
     * @test
     * @description Verifica che il middleware deleghi un errore NOT_FOUND
     * quando l’utente autenticato non viene trovato nel sistema.
     */
    it('dovrebbe delegare un errore NOT_FOUND se l’utente non esiste', async () => {
        (UserRepository.prototype.getUserById as jest.Mock).mockResolvedValue(null);

        await checkTokenBalance(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledTimes(1);

        const error = nextFunction.mock.calls[0][0] as any;

        expect(error.status).toBe(404);
        expect(error.message).toBe('Utente non trovato.');
    });
});