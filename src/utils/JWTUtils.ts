import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class JWTUtils
 * @description Classe di utilità per la gestione dei token JWT tramite algoritmo RS256.
 */
export class JWTUtils {
    // La chiave PUBBLICA può rimanere in un file fisico (Corretto)
    private static publicKey = fs.readFileSync(path.join(__dirname, '../../jwt/public.key'), 'utf8');

    /**
     * @method generateToken
     * @description Firma un nuovo token includendo il payload dell'utente.
     */
    public static generateToken(payload: object): string {
       
        const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!privateKey) {
            throw ErrorFactory.getError('INTERNAL_SERVER_ERROR', 'Chiave privata JWT non configurata nel .env');
        }

        return jwt.sign(payload, privateKey, { 
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