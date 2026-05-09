/**
 * @enum MoveResult
 * @description Rappresenta l'esito spaziale di un attacco sulla griglia.
 */
export enum MoveResult {
    HIT = 'HIT',   // Una sezione della nave è stata colpita
    MISS = 'MISS', // Acqua (nessuna nave colpita)
    SUNK = 'SUNK'  // L'ultimo elemento integro della nave è stato colpito
}