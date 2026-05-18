// src/utils/gameEngine.ts
import { ShipConfiguration, Ship, Coordinate, Board } from '../types/gameTypes';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { MoveResult } from '../enum/moveResult';

/**
 * @class GameEngine
 * @description Core engine di dominio per la Battaglia Navale.
 * Centralizza la logica pura di gioco, inclusa la generazione delle plance,
 * il posizionamento delle navi, il calcolo degli attacchi, la verifica della vittoria
 * e la generazione delle mosse dell’IA.
 */
export class GameEngine {
    
    /**
     * @method generateRandomBoard
     * @static
     * @description Genera una plancia iniziale posizionando casualmente le navi configurate.
     * Verifica che ogni nave sia interna alla griglia e non entri in collisione
     * con le navi già posizionate.
     *
     * @param gridSize Dimensione della griglia di gioco.
     * @param configurations Configurazione delle navi da posizionare.
     * @returns Plancia inizializzata con navi posizionate e storico colpi vuoto.
     * @throws Errore applicativo se una nave non può essere allocata dopo il numero massimo di tentativi.
     */
    public static generateRandomBoard(gridSize: number, configurations: ShipConfiguration[]): Board {
        const placedShips: Ship[] = [];
        const MAX_ATTEMPTS = 2000; 

        for (const config of configurations) {
            for (let i = 0; i < config.count; i++) {
                let isPlaced = false;
                let attempts = 0;

                while (!isPlaced && attempts < MAX_ATTEMPTS) {
                    attempts++;
                    const isVertical = Math.random() < 0.5;
                    const startX = Math.floor(Math.random() * gridSize);
                    const startY = Math.floor(Math.random() * gridSize);

                    const targetCoordinates = this.projectShipCoordinates(startX, startY, config.size, isVertical);

                    if (this.isWithinBounds(targetCoordinates, gridSize) && !this.hasCollision(targetCoordinates, placedShips)) {
                        const newShip: Ship = {
                            type: config.type,
                            size: config.size,
                            coordinates: targetCoordinates,
                            hits: new Array(config.size).fill(false), 
                            isSunk: false
                        };

                        placedShips.push(newShip);
                        isPlaced = true;
                    }
                }

                if (!isPlaced) {
                    throw ErrorFactory.getError('BAD_REQUEST', `Impossibile allocare la nave di tipo ${config.type}.`);
                }
            }
        }

        return {
            ships: placedShips,
            shotsReceived: []
        };
    }

    /**
     * @method projectShipCoordinates
     * @private
     * @static
     * @description Calcola le coordinate occupate da una nave a partire da posizione iniziale,
     * dimensione e orientamento.
     *
     * @param startX Coordinata orizzontale iniziale della nave.
     * @param startY Coordinata verticale iniziale della nave.
     * @param size Dimensione della nave.
     * @param isVertical Indica se la nave deve essere proiettata verticalmente.
     * @returns Lista delle coordinate occupate dalla nave.
     */
    private static projectShipCoordinates(startX: number, startY: number, size: number, isVertical: boolean): Coordinate[] {
        const coords: Coordinate[] = [];
        for (let i = 0; i < size; i++) {
            coords.push({
                x: isVertical ? startX : startX + i,
                y: isVertical ? startY + i : startY
            });
        }
        return coords;
    }

    /**
     * @method isWithinBounds
     * @private
     * @static
     * @description Verifica che tutte le coordinate indicate siano comprese nei limiti della griglia.
     *
     * @param coords Coordinate da verificare.
     * @param gridSize Dimensione della griglia di gioco.
     * @returns True se tutte le coordinate sono valide, false altrimenti.
     */
    private static isWithinBounds(coords: Coordinate[], gridSize: number): boolean {
        return coords.every(c => c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize);
    }

    /**
     * @method hasCollision
     * @private
     * @static
     * @description Verifica se le nuove coordinate di una nave si sovrappongono
     * a quelle delle navi già posizionate sulla plancia.
     *
     * @param newCoords Coordinate della nave da posizionare.
     * @param existingShips Navi già presenti sulla plancia.
     * @returns True se esiste una collisione, false altrimenti.
     */
    private static hasCollision(newCoords: Coordinate[], existingShips: Ship[]): boolean {
        for (const ship of existingShips) {
            for (const existingCoord of ship.coordinates) {
                for (const newCoord of newCoords) {
                    if (existingCoord.x === newCoord.x && existingCoord.y === newCoord.y) return true;
                }
            }
        }
        return false;
    }

    /**
     * @method applyMove
     * @static
     * @description Applica un attacco a una plancia e calcola l’esito della mossa.
     * Registra il colpo ricevuto, aggiorna lo stato dei colpi sulle navi
     * e determina se il risultato è acqua, colpito o affondato.
     *
     * @param board Plancia bersaglio su cui applicare la mossa.
     * @param target Coordinate dell’attacco.
     * @returns Esito della mossa e plancia aggiornata.
     */
    public static applyMove(board: Board, target: Coordinate): { result: MoveResult; updatedBoard: Board } {
        // Registra il colpo
        board.shotsReceived.push(target);
        let moveResult: MoveResult = MoveResult.MISS;

        for (const ship of board.ships) {
            const hitIndex = ship.coordinates.findIndex(c => c.x === target.x && c.y === target.y);

            if (hitIndex !== -1) {
                ship.hits[hitIndex] = true;
                moveResult = MoveResult.HIT;

                if (ship.hits.every(h => h === true)) {
                    ship.isSunk = true;
                    moveResult = MoveResult.SUNK;
                }
                break;
            }
        }

        return { result: moveResult, updatedBoard: board };
    }

    /**
     * @method checkVictory
     * @static
     * @description Verifica se tutte le navi presenti su una plancia sono state affondate.
     *
     * @param board Plancia da controllare.
     * @returns True se tutte le navi sono affondate, false altrimenti.
     */
    public static checkVictory(board: Board): boolean {
        return board.ships.every(ship => ship.isSunk);
    }

    /**
     * @method generateIAMove
     * @static
     * @description Genera una mossa casuale valida per l’IA.
     * Evita coordinate già presenti nello storico dei colpi ricevuti,
     * così da non ripetere attacchi sulla stessa cella.
     *
     * @param gridSize Dimensione della griglia di gioco.
     * @param shotsReceived Coordinate già colpite in precedenza.
     * @returns Coordinate valide per la prossima mossa dell’IA.
     */
    public static generateIAMove(gridSize: number, shotsReceived: Coordinate[]): Coordinate {
        let x: number = 0;
        let y: number = 0;
        let alreadyShot: boolean = false;

        do {
            x = Math.floor(Math.random() * gridSize);
            y = Math.floor(Math.random() * gridSize);
            // Controllo se l'IA ha già sparato in queste coordinate
            alreadyShot = shotsReceived.some(s => s.x === x && s.y === y);
        } while (alreadyShot);

        return { x, y };
    }
}