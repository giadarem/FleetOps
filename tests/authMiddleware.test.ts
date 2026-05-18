import { Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../src/middlewares/authMiddleware';
import { JWTUtils } from '../src/utils/JWTUtils';
import { ErrorFactory } from '../src/patterns/ErrorFactory';

/**
 * @description Mock del modulo JWTUtils.
 * Permette di isolare il middleware authenticateJWT dalla reale logica di verifica
 * dei token RS256, evitando la necessità di usare chiavi JWT durante i test unitari.
 */
jest.mock('../src/utils/JWTUtils');

/**
 * @description Suite di test dedicata al middleware authenticateJWT.
 * Verifica il comportamento del middleware nei casi di token assente,
 * formato Authorization non valido, token valido e token scaduto/non valido.
 */
describe('Auth Middleware - authenticateJWT', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.MockedFunction<NextFunction>;

    /**
     * @description Inizializza una richiesta, una risposta e una funzione next mockate
     * prima di ogni test, garantendo isolamento tra i singoli scenari.
     */
    beforeEach(() => {
        mockRequest = {
            headers: {}
        };

        mockResponse = {};

        nextFunction = jest.fn();

        jest.clearAllMocks();
    });

    /**
     * @test
     * @description Verifica che il middleware deleghi un errore UNAUTHORIZED
     * al middleware globale quando l’header Authorization è assente.
     */
    it('dovrebbe delegare un errore UNAUTHORIZED se l\'header Authorization è assente', () => {
        authenticateJWT(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledTimes(1);

        const error = nextFunction.mock.calls[0][0] as any;

        expect(error.status).toBe(401);
        expect(error.message).toBe('Token mancante o non valido.');
    });

    /**
     * @test
     * @description Verifica che il middleware rifiuti un header Authorization
     * presente ma non conforme allo schema Bearer richiesto.
     */
    it('dovrebbe delegare un errore UNAUTHORIZED se l\'header Authorization non usa Bearer', () => {
        mockRequest.headers = {
            authorization: 'Basic token-valido-123'
        };

        authenticateJWT(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledTimes(1);

        const error = nextFunction.mock.calls[0][0] as any;

        expect(error.status).toBe(401);
        expect(error.message).toBe('Token mancante o non valido.');
    });

    /**
     * @test
     * @description Verifica che, in presenza di un token valido, il middleware
     * decodifichi il token, inserisca i dati utente nella request e prosegua
     * la catena dei middleware tramite next().
     */
    it('dovrebbe iniettare l\'utente nella request e richiamare next() se il token è valido', () => {
        mockRequest.headers = {
            authorization: 'Bearer token-valido-123'
        };

        const mockDecodedUser = {
            id: 'user-1',
            role: 'USER'
        };

        (JWTUtils.verifyToken as jest.Mock).mockReturnValue(mockDecodedUser);

        authenticateJWT(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(JWTUtils.verifyToken).toHaveBeenCalledWith('token-valido-123');
        expect((mockRequest as any).user).toEqual(mockDecodedUser);

        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect(nextFunction).toHaveBeenCalledWith();
    });

    /**
     * @test
     * @description Verifica che un token scaduto o non valido venga intercettato
     * e delegato al middleware globale come errore UNAUTHORIZED.
     */
    it('dovrebbe delegare un errore UNAUTHORIZED se il token è scaduto o invalido', () => {
        mockRequest.headers = {
            authorization: 'Bearer token-invalido'
        };

        const authError = ErrorFactory.getError(
            'UNAUTHORIZED',
            'Token non valido o scaduto'
        );

        (JWTUtils.verifyToken as jest.Mock).mockImplementation(() => {
            throw authError;
        });

        authenticateJWT(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(JWTUtils.verifyToken).toHaveBeenCalledWith('token-invalido');
        expect(nextFunction).toHaveBeenCalledTimes(1);

        const error = nextFunction.mock.calls[0][0] as any;

        expect(error.status).toBe(401);
        expect(error.message).toBe('Token non valido o scaduto');
    });
});