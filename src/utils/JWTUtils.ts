import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class JWTUtils
 * @description Classe di utilità per la gestione dei token JWT tramite algoritmo RS256.
 */
export class JWTUtils {
    private static privateKey = fs.readFileSync(path.join(__dirname, '../../jwt/private.key'), 'utf8');
    private static publicKey = fs.readFileSync(path.join(__dirname, '../../jwt/public.key'), 'utf8');

    /**
     * @method generateToken
     * @description Firma un nuovo token includendo il payload dell'utente.
     */
    public static generateToken(payload: object): string {
        return jwt.sign(payload, this.privateKey, { 
            algorithm: 'RS256', 
            expiresIn: '1h' 
        });
    }

    /**
     * @method verifyToken
     * @description Verifica la validità di un token utilizzando la chiave pubblica.
     */
    public static verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] });
        } catch (error) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Token non valido o scaduto');
        }
    }
}