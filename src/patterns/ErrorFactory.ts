/**
 * @interface IAppError
 * @description Interfaccia base per la formattazione standardizzata degli errori.
 * Garantisce che ogni errore possegga uno status code e un metodo per la conversione in stringa JSON.
 */
export interface IAppError {
    statusCode: number;
    message: string;
    toJSON(): string; 
}

// --- CLASSI DI ERRORE CONCRETE ---

export class BadRequestError implements IAppError {
    public statusCode = 400;
    constructor(public message: string = "Bad Request - Parametri non validi") {}
    
    /**
     * @returns {string} L'oggetto errore serializzato come stringa JSON
     */
    toJSON(): string {
        return JSON.stringify({ status: this.statusCode, error: "Bad Request", message: this.message });
    }
}

export class UnauthorizedError implements IAppError {
    public statusCode = 401;
    constructor(public message: string = "Unauthorized - Accesso negato o token invalido") {}
    
    toJSON(): string {
        return JSON.stringify({ status: this.statusCode, error: "Unauthorized", message: this.message });
    }
}

export class InternalServerError implements IAppError {
    public statusCode = 500;
    constructor(public message: string = "Internal Server Error - Si è verificato un errore imprevisto") {}
    
    toJSON(): string {
        return JSON.stringify({ status: this.statusCode, error: "Internal Server Error", message: this.message });
    }
}

export class DatabaseError implements IAppError {
    public statusCode = 503;
    constructor(public message: string = "Service Unavailable - Errore di connessione al database") {}
    
    toJSON(): string {
        return JSON.stringify({ status: this.statusCode, error: "Database Error", message: this.message });
    }
}

// --- FACTORY ---

/**
 * @class ErrorFactory
 * @description Implementazione del pattern Factory per la generazione degli errori.
 */
export class ErrorFactory {
    /**
     * @method getError
     * @static
     * @param {string} type - La tipologia di errore richiesta
     * @param {string} [customMessage] - Messaggio opzionale per sovrascrivere quello di default.
     * @returns {IAppError} L'istanza dell'errore corrispondente.
     * @description Utilizza uno switch-case per gestire gli errori noti al sistema.
     */
    public static getError(type: string, customMessage?: string): IAppError {
        switch (type.toUpperCase()) {
            case 'BAD_REQUEST':
                return new BadRequestError(customMessage);
            case 'UNAUTHORIZED':
                return new UnauthorizedError(customMessage);
            case 'DATABASE_ERROR':
                return new DatabaseError(customMessage);
            case 'INTERNAL_SERVER_ERROR':
            default:
                return new InternalServerError(customMessage);
        }
    }
}