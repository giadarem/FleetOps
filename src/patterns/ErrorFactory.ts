import { HttpStatus } from '../enum/httpStatus';

/**
 * @interface IAppError
 * @description Definisce il contratto comune per gli errori applicativi.
 * Standardizza status HTTP, messaggio descrittivo e serializzazione JSON
 * utilizzati dal middleware globale di gestione degli errori.
 */
export interface IAppError {
    /** Codice di stato HTTP associato all’errore */
    status: number;
    /** Messaggio descrittivo dell’errore */
    message: string;

    /**
     * @method toJSON
     * @description Serializza l’errore applicativo in formato JSON.
     *
     * @returns Stringa JSON contenente status, tipologia e messaggio dell’errore.
     */
    toJSON(): string; 
}

/**
 * @class BadRequestError
 * @description Errore applicativo utilizzato per richieste non valide.
 * Rappresenta scenari in cui parametri, body o input ricevuti dal client
 * non rispettano i requisiti attesi.
 */
export class BadRequestError implements IAppError {
    public status = HttpStatus.BAD_REQUEST;

    /**
     * @constructor
     * @description Inizializza un errore di richiesta non valida.
     *
     * @param message Messaggio descrittivo dell’errore.
     */
    constructor(public message: string = "Bad Request - Parametri non validi") {}
    
    /**
     * @method toJSON
     * @description Converte l’errore in una risposta JSON standardizzata.
     *
     * @returns Stringa JSON dell’errore Bad Request.
     */
    toJSON(): string {
        return JSON.stringify({ status: this.status, error: "Bad Request", message: this.message });
    }
}

/**
 * @class UnauthorizedError
 * @description Errore applicativo utilizzato quando l’utente non è autenticato
 * o presenta credenziali/token non validi.
 */
export class UnauthorizedError implements IAppError {
    public status = HttpStatus.UNAUTHORIZED;

    /**
     * @constructor
     * @description Inizializza un errore di autenticazione.
     *
     * @param message Messaggio descrittivo dell’errore.
     */
    constructor(public message: string = "Unauthorized - Accesso negato o token invalido") {}
    
    /**
     * @method toJSON
     * @description Converte l’errore in una risposta JSON standardizzata.
     *
     * @returns Stringa JSON dell’errore Unauthorized.
     */
    toJSON(): string {
        return JSON.stringify({ status: this.status, error: "Unauthorized", message: this.message });
    }
}

/**
 * @class ForbiddenError
 * @description Errore applicativo utilizzato quando l’utente è autenticato
 * ma non dispone dei permessi necessari per accedere alla risorsa richiesta.
 */
export class ForbiddenError implements IAppError {
    public status = HttpStatus.FORBIDDEN;

    /**
     * @constructor
     * @description Inizializza un errore di autorizzazione.
     *
     * @param message Messaggio descrittivo dell’errore.
     */
    constructor(public message: string = "Forbidden - Accesso negato") {}
    
    /**
     * @method toJSON
     * @description Converte l’errore in una risposta JSON standardizzata.
     *
     * @returns Stringa JSON dell’errore Forbidden.
     */
    toJSON(): string {
        return JSON.stringify({ status: this.status, error: "Forbidden", message: this.message });
    }
}

/**
 * @class NotFoundError
 * @description Errore applicativo utilizzato quando una risorsa richiesta
 * non viene trovata nel sistema.
 */
export class NotFoundError implements IAppError {
    public status = HttpStatus.NOT_FOUND;

    /**
     * @constructor
     * @description Inizializza un errore di risorsa non trovata.
     *
     * @param message Messaggio descrittivo dell’errore.
     */
    constructor(public message: string = "Not Found - Risorsa non trovata") {}
    
    /**
     * @method toJSON
     * @description Converte l’errore in una risposta JSON standardizzata.
     *
     * @returns Stringa JSON dell’errore Not Found.
     */
    toJSON(): string {
        return JSON.stringify({ status: this.status, error: "Not Found", message: this.message });
    }
}

/**
 * @class InternalServerError
 * @description Errore applicativo utilizzato per eccezioni generiche o inattese.
 * Rappresenta errori non gestiti esplicitamente dagli altri tipi applicativi.
 */
export class InternalServerError implements IAppError {
    public status = HttpStatus.INTERNAL_SERVER_ERROR;

    /**
     * @constructor
     * @description Inizializza un errore interno del server.
     *
     * @param message Messaggio descrittivo dell’errore.
     */
    constructor(public message: string = "Internal Server Error - Si è verificato un errore imprevisto") {}
    
    /**
     * @method toJSON
     * @description Converte l’errore in una risposta JSON standardizzata.
     *
     * @returns Stringa JSON dell’errore Internal Server Error.
     */
    toJSON(): string {
        return JSON.stringify({ status: this.status, error: "Internal Server Error", message: this.message });
    }
}

/**
 * @class DatabaseError
 * @description Errore applicativo utilizzato per problemi legati al database.
 * Rappresenta errori di connessione, indisponibilità o criticità del livello di persistenza.
 */
export class DatabaseError implements IAppError {
    public status = HttpStatus.SERVICE_UNAVAILABLE;

    /**
     * @constructor
     * @description Inizializza un errore relativo al database.
     *
     * @param message Messaggio descrittivo dell’errore.
     */
    constructor(public message: string = "Service Unavailable - Errore di connessione al database") {}
    
    /**
     * @method toJSON
     * @description Converte l’errore in una risposta JSON standardizzata.
     *
     * @returns Stringa JSON dell’errore Database Error.
     */
    toJSON(): string {
        return JSON.stringify({ status: this.status, error: "Database Error", message: this.message });
    }
}

/**
 * @class ErrorFactory
 * @description Factory responsabile della creazione centralizzata degli errori applicativi.
 * Incapsula la scelta della classe di errore concreta in base alla tipologia richiesta,
 * mantenendo coerente la gestione degli errori nei diversi livelli dell’applicazione.
 */
export class ErrorFactory {
    /**
     * @method getError
     * @static
     * @description Crea l’istanza di errore applicativo corrispondente alla tipologia indicata.
     * Se la tipologia non è riconosciuta, restituisce un errore interno generico.
     *
     * @param type Tipologia di errore richiesta.
     * @param customMessage Messaggio opzionale da utilizzare al posto di quello predefinito.
     * @returns Istanza dell’errore applicativo corrispondente.
     */
    public static getError(type: string, customMessage?: string): IAppError {
        switch (type.toUpperCase()) {
            case 'BAD_REQUEST':
                return new BadRequestError(customMessage);
            case 'UNAUTHORIZED':
                return new UnauthorizedError(customMessage);
            case 'FORBIDDEN':
                return new ForbiddenError(customMessage);
            case 'NOT_FOUND':
                return new NotFoundError(customMessage);
            case 'DATABASE_ERROR':
                return new DatabaseError(customMessage);
            case 'INTERNAL_SERVER_ERROR':
            default:
                return new InternalServerError(customMessage);
        }
    }
}