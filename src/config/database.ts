import { Sequelize, Dialect } from 'sequelize';
import dotenv from 'dotenv';
import { ErrorFactory } from '../patterns/ErrorFactory';

dotenv.config();

/**
 * @class Database
 * @description Classe responsabile della configurazione e gestione della connessione al database.
 * Implementa il pattern Singleton per garantire un’unica istanza Sequelize condivisa
 * all’interno dell’applicazione.
 *
 * Si colloca nel livello di configurazione dell’architettura e centralizza:
 * - lettura delle variabili d’ambiente;
 * - validazione della configurazione del database;
 * - inizializzazione della connessione Sequelize;
 * - verifica della raggiungibilità del database.
 */
class Database {
    private static instance: Database;
    public sequelize: Sequelize;

    /**
     * @constructor
     * @description Inizializza la configurazione Sequelize a partire dalle variabili d’ambiente.
     * Valida i parametri obbligatori prima di creare l’istanza di connessione al database.
     *
     * @throws Errore applicativo se una o più variabili d’ambiente richieste sono mancanti.
     */
    private constructor() {
        // Lettura delle variabili d’ambiente necessarie alla connessione.
        const DB_NAME = process.env.DB_NAME || '';
        const DB_USER = process.env.DB_USER || '';
        const DB_PWD = process.env.DB_PWD || '';
        const DB_HOST = process.env.DB_HOST || '';

        // Il dialect viene tipizzato secondo il tipo richiesto da Sequelize.
        const DB_DIALECT = (process.env.DB_DIALECT as Dialect) || 'postgres';

        // La configurazione viene validata prima di creare l’istanza Sequelize.
        if (!DB_NAME || !DB_USER || !DB_PWD || !DB_HOST) {
            const msg = 'Errore di configurazione: Variabili d\'ambiente del database (DB_NAME, DB_USER, DB_PWD, DB_HOST) mancanti.';
            throw ErrorFactory.getError('DATABASE_ERROR', msg);
        }

        // Inizializzazione della connessione Sequelize con i parametri configurati.
        this.sequelize = new Sequelize(DB_NAME, DB_USER, DB_PWD, {
            host: DB_HOST,
            dialect: DB_DIALECT,
            logging: false, // I log SQL sono disabilitati per mantenere pulito l’output del server.
        });
    }

    /**
     * @description Restituisce l’unica istanza della classe Database.
     * Se l’istanza non esiste, viene creata al primo accesso secondo il pattern Singleton.
     *
     * @returns Istanza condivisa della classe Database.
     */
    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * @description Verifica che la connessione al database sia correttamente funzionante.
     * La creazione e gestione delle tabelle resta demandata agli script SQL
     * o ad altri meccanismi esterni alla fase di bootstrap.
     *
     * @returns Promise risolta quando la connessione al database viene verificata con successo.
     * @throws Errore applicativo se Sequelize non riesce a stabilire la connessione.
     */
    public async connect(): Promise<void> {
        try {
            // authenticate controlla che Sequelize riesca a comunicare con il database.
            await this.sequelize.authenticate();
            console.log('[DATABASE] Connessione stabilita con successo.');
            
        } catch (error: any) {
            // L’errore viene convertito tramite ErrorFactory per mantenere coerente la gestione degli errori.
            const dbError = ErrorFactory.getError('DATABASE_ERROR', error.message);
            console.error('[DATABASE] Errore critico durante il bootstrap:', dbError.toJSON());
            throw dbError;
        }
    }
}

// Esporta l’istanza Singleton da riutilizzare negli altri livelli dell’applicazione.
export default Database.getInstance();