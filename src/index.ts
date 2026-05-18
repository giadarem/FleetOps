import express, { Application } from 'express';
import dotenv from 'dotenv';
import database from './config/database';
import { errorHandlerMiddleware } from './middlewares/errorHandler';
import { ErrorFactory } from './patterns/ErrorFactory';
import authRoutes from './routes/authRoutes';
import User from './models/User';
import userRoutes from './routes/userRoutes';
import gameRoutes from './routes/gameRoutes';

dotenv.config();

/**
 * @class AppServer
 * @description Classe responsabile del bootstrap dell’applicazione Express.
 * Si occupa di configurare middleware, rotte, gestione centralizzata degli errori
 * e avvio della connessione al database prima dell’ascolto HTTP.
 */
class AppServer {
    private app: Application;
    private port: number | string;

    /**
     * @constructor
     * @description Inizializza l’applicazione Express, legge la porta di esecuzione
     * e configura middleware, rotte e gestione globale degli errori.
     */
    constructor() {
        this.app = express();
        this.port = process.env.APP_PORT || 3000;
        
        this.configureMiddlewares();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    /**
     * @method configureMiddlewares
     * @private
     * @description Registra i middleware applicativi di base necessari alla gestione delle richieste.
     * In particolare abilita il parsing automatico del body in formato JSON.
     *
     * @returns void
     */
    private configureMiddlewares(): void {
        this.app.use(express.json());
    }

    /**
     * @method configureRoutes
     * @private
     * @description Registra le rotte principali dell’applicazione.
     * Collega i router di autenticazione, utenti e partite ai rispettivi prefissi API.
     *
     * @returns void
     */
    private configureRoutes(): void {
        this.app.use(express.json());
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/games', gameRoutes)
    }

    /**
     * @method configureErrorHandling
     * @private
     * @description Registra il middleware globale di gestione degli errori.
     * Deve essere configurato dopo le rotte per intercettare correttamente
     * gli errori prodotti dai livelli applicativi precedenti.
     *
     * @returns void
     */
    private configureErrorHandling(): void {
        this.app.use(errorHandlerMiddleware);
    }

    /**
     * @method bootstrap
     * @async
     * @description Avvia la sequenza di bootstrap dell’applicazione.
     * Verifica la connessione al database e, solo in caso di successo,
     * avvia il server HTTP sulla porta configurata.
     *
     * @returns Promise risolta quando il server è stato avviato correttamente.
     * @throws Termina il processo se il bootstrap fallisce in modo critico.
     */
    public async bootstrap(): Promise<void> {
        try {
            console.log('[SERVER] Avvio del processo di bootstrap...');

            await database.connect();

            this.app.listen(this.port, () => {
                console.log(`[SERVER] Applicazione pronta e in ascolto sulla porta: ${this.port}`);
            });

        } catch (error: any) {
            let fatalError = error;
            // Se l'errore non proviene dalla Factory (es. manca il metodo toJSON), lo wrappiamo
            if (typeof error.toJSON !== 'function') {
                fatalError = ErrorFactory.getError('INTERNAL_SERVER_ERROR', error.message);
            }
            
            console.error('[SERVER] Bootstrap fallito. Terminazione processo.', fatalError.toJSON());
            process.exit(1);
        }
    }
}

const server = new AppServer();
server.bootstrap();