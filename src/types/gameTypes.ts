// src/types/GameTypes.ts
import { MoveResult } from '../enum/moveResult';

/**
 * @interface Coordinate
 * @description Rappresenta una singola posizione spaziale (X, Y) all'interno del sistema di riferimento
 * della plancia di gioco. L'origine (0,0) è tipicamente intesa nell'angolo in alto a sinistra.
 */
export interface Coordinate {
    x: number;
    y: number;
}

/**
 * @interface ShipConfiguration
 * @description Definisce i vincoli e le regole di setup per l'allocazione delle flotte.
 * Risponde al requisito di specificare "Numero e tipologie delle imbarcazioni" alla creazione.
 */
export interface ShipConfiguration {
    /** Identificativo numerico della classe della nave  */
    type: number;
    /** L'ingombro spaziale della nave in termini di celle occupate sulla griglia */
    size: number;
    /** La cardinalità: quante istanze di questa specifica imbarcazione devono essere allocate */
    count: number;
}

/**
 * @interface Ship
 * @description Rappresenta l'entità di dominio di una singola nave posizionata sulla griglia.
 * Traccia in modo indipendente la sua integrità strutturale mappando ogni sua sezione.
 */
export interface Ship {
    /** Riferimento al tipo di nave configurato alla creazione */
    type: number;
    /** Dimensione totale della nave (ridondante ma utile per controlli rapidi di integrità) */
    size: number;
    /** Array di coordinate esatte in cui risiede la nave. La lunghezza deve essere uguale a 'size' */
    coordinates: Coordinate[];
    /** * Array parallelo a 'coordinates'. 
     * Se hits[i] è true, significa che la sezione della nave in coordinates[i] è stata colpita.
     */
    hits: boolean[];
    /** * Flag di stato derivato, mantenuto qui per ottimizzare le performance (evita di ciclare 
     * iterativamente l'array 'hits' ad ogni verifica di vittoria).
     */
    isSunk: boolean;
}

/**
 * @interface Move
 * @description Modello per il tracciamento transazionale di una singola azione di gioco.
 * Questa struttura garantisce la persistenza dello "storico delle mosse" richiesto dalle specifiche,
 * consentendo la ricostruzione a posteriori degli eventi della partita.
 */
export interface Move {
    /** UUID del giocatore che ha effettuato l'attacco, oppure la costante 'IA' nel caso PvE */
    playerId: string | 'IA';
    /** Coordinata X dell'attacco */
    x: number;
    /** Coordinata Y dell'attacco */
    y: number;
    /** L'esito computato dell'attacco basato sullo stato della griglia avversaria */
    result: MoveResult;      
    /** Marca temporale esatta dell'azione, essenziale per l'ordinamento cronologico dello storico */
    timestamp: Date;
}

/**
 * @interface Board
 * @description Struttura dati che modella lo scenario personale (schieramento) di uno dei due contendenti.
 */
export interface Board {
    /** Flotta assegnata e allocata per il giocatore */
    ships: Ship[];
    /** * Registro spaziale delle coordinate su cui il giocatore ha subito attacchi.
     * Necessario all'IA (per evitare di sparare dove ha già sparato) e per validazioni di business 
     * (prevenire mosse duplicate dell'avversario).
     */
    shotsReceived: Coordinate[];
}

/**
 * @interface GameState
 * @description Root schema per la serializzazione all'interno della colonna JSONB su PostgreSQL.
 * Rappresenta la "Single Source of Truth" (singola fonte di verità) per l'intero ciclo di vita di una partita.
 * Incapsula tutto il dominio necessario a valutare lo stato del match senza ricorrere a JOIN relazionali.
 */
export interface GameState {
    /** Copia immutabile delle direttive iniziali di creazione (limiti e quantità) */
    configuration: {
        gridSize: number;
        shipTypes: ShipConfiguration[];
    };
    /** Stato della plancia appartenente al creatore della partita (player1Id) */
    player1Board: Board;
    /** Stato della plancia appartenente all'avversario sfidato o all'Elaboratore (IA) */
    player2Board: Board;
    /** * Indicatore del turno. Determina quale giocatore (tramite UUID) o l'IA 
     * è autorizzato a effettuare la prossima operazione di Move.
     */
    currentTurn: string | 'IA';
    /** * Log sequenziale e persistente (Append-Only) di tutte le operazioni di gioco.
     */
    history: Move[];
}