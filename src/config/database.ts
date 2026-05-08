import { Sequelize, Dialect } from 'sequelize';
import dotenv from 'dotenv';
import { ErrorFactory } from '../patterns/ErrorFactory';

dotenv.config();

/**
 * @class Database
 * @description Singleton per la gestione della connessione a Sequelize con validazione delle variabili d'ambiente.
 */
class Database {
    private static instance: Database;
    public sequelize: Sequelize;

    private constructor() {
        // Estrazione delle variabili d'ambiente 
        const DB_NAME = process.env.DB_NAME || '';
        const DB_USER = process.env.DB_USER || '';
        const DB_PWD = process.env.DB_PWD || '';
        const DB_HOST = process.env.DB_HOST || '';
        // Utilizzo di un cast per il tipo Dialect richiesto da Sequelize
        const DB_DIALECT = (process.env.DB_DIALECT as Dialect) || 'postgres';

        // Validazione rigorosa: se manca una variabile fondamentale, si solleva un errore immediato 
        if (!DB_NAME || !DB_USER || !DB_PWD || !DB_HOST) {
            const msg = 'Errore di configurazione: Variabili d\'ambiente del database (DB_NAME, DB_USER, DB_PWD, DB_HOST) mancanti.';
            throw ErrorFactory.getError('DATABASE_ERROR', msg);
        }

        // Inizializzazione della connessione [cite: 207, 265]
        this.sequelize = new Sequelize(DB_NAME, DB_USER, DB_PWD, {
            host: DB_HOST,
            dialect: DB_DIALECT,
            logging: false, // Disabilita i log SQL nel terminale per pulizia 
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * @method connect
     * @description Verifica la connessione. La creazione delle tabelle è gestita dagli script SQL.
     */
    public async connect(): Promise<void> {
        try {
            // Verifichiamo solo se il database risponde
            await this.sequelize.authenticate();
            console.log('[DATABASE] Connessione stabilita con successo.');
            
            // RIMOSSO: this.sequelize.sync() 
            // In un approccio SQL-First, non vogliamo che l'ORM modifichi lo schema.
            console.log('[DATABASE] Modalità SQL-First attiva: Schema gestito esternamente.');
        } catch (error: any) {
            const dbError = ErrorFactory.getError('DATABASE_ERROR', error.message);
            console.error('[DATABASE] Errore critico durante il bootstrap:', dbError.toJSON());
            throw dbError;
        }
    }
}

// Export dell'istanza Singleton 
export default Database.getInstance();