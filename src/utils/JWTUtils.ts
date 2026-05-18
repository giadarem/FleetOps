import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class JWTUtils
 * @description Classe di utilità responsabile della gestione dei token JWT.
 * Centralizza la generazione e la verifica dei token firmati con algoritmo RS256,
 * utilizzando chiave privata per la firma e chiave pubblica per la validazione.
 */
export class JWTUtils {
    // La chiave PUBBLICA può rimanere in un file fisico (Corretto)
    private static publicKey = fs.readFileSync(path.join(__dirname, '../../jwt/public.key'), 'utf8');

    /**
     * @method generateToken
     * @static
     * @description Genera e firma un nuovo token JWT a partire dal payload fornito.
     * Recupera la chiave privata dalle variabili d’ambiente e imposta una scadenza temporale
     * per limitare la validità del token.
     *
     * @param payload Dati da includere nel token JWT.
     * @returns Token JWT firmato.
     * @throws Errore applicativo se la chiave privata JWT non è configurata.
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
     * @static
     * @description Verifica la validità e l’integrità di un token JWT tramite chiave pubblica.
     * Accetta esclusivamente token firmati con algoritmo RS256 e restituisce il payload decodificato.
     *
     * @param token Token JWT da verificare.
     * @returns Payload decodificato del token se valido.
     * @throws Errore applicativo se il token è non valido o scaduto.
     */
    public static verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] });
        } catch (error) {
            throw ErrorFactory.getError('UNAUTHORIZED', 'Token non valido o scaduto');
        }
    }
}