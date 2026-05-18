/**
 * @enum GameStatus
 * @description Rappresenta i possibili stati del ciclo di vita di una partita.
 */
export enum GameStatus {
    ACTIVE = 'ACTIVE',       // Partita in corso d'opera
    FINISHED = 'FINISHED',   // Partita terminata con un vincitore regolare
    ABANDONED = 'ABANDONED'  // Partita terminata per abbandono di un giocatore
}