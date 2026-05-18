/**
 * @constant GAME_CREATION_COST
 * @description Costo in token richiesto per la creazione di una nuova partita.
 * Viene utilizzato dai service per applicare in modo centralizzato la regola
 * di consumo associata all’avvio di una partita.
 */
export const GAME_CREATION_COST = 0.2;

/**
 * @constant MOVE_COST
 * @description Costo in token richiesto per l’esecuzione di una mossa.
 * Viene utilizzato dai service per mantenere coerente il consumo dei token
 * durante lo svolgimento della partita.
 */
export const MOVE_COST = 0.025;