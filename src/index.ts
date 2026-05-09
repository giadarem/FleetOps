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
 * @description Classe di bootstrap per l'inizializzazione del server Express e del database.
 */
class AppServer {
    private app: Application;
    private port: number | string;

    constructor() {
        this.app = express();
        this.port = process.env.APP_PORT || 3000;
        
        this.configureMiddlewares();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    private configureMiddlewares(): void {
        this.app.use(express.json());
    }

    private configureRoutes(): void {
        this.app.use(express.json());
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/games', gameRoutes);
        // Esempio temporaneo per testare il flusso degli errori
        this.app.get('/test-error', (req, res, next) => {
            // Solleva un'eccezione che verrà intercettata dall'ErrorHandler
            next(ErrorFactory.getError('BAD_REQUEST', 'Simulazione di errore per testare la Factory'));
        });
    }

    /**
     * @method configureErrorHandling
     * @private
     * @description Registra il middleware degli errori. Deve essere l'ultimo middleware caricato.
     */
    private configureErrorHandling(): void {
        this.app.use(errorHandlerMiddleware);
    }

    /**
     * @method bootstrap
     * @async
     * @description Avvia la sequenza di caricamento (Database -> Server).
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