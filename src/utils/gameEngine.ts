// src/utils/gameEngine.ts
import { ShipConfiguration, Ship, Coordinate, Board } from '../types/gameTypes';
import { ErrorFactory } from '../patterns/ErrorFactory';
import { MoveResult } from '../enum/moveResult';

/**
 * @class GameEngine
 * @description Core engine di dominio per la Battaglia Navale.
 */
export class GameEngine {
    
    /**
     * @method generateRandomBoard
     * @description Genera lo schieramento iniziale di una singola plancia.
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

    private static isWithinBounds(coords: Coordinate[], gridSize: number): boolean {
        return coords.every(c => c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize);
    }

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
     * @description Calcola l'esito di un attacco (MISS, HIT, SUNK).
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
     */
    public static checkVictory(board: Board): boolean {
        return board.ships.every(ship => ship.isSunk);
    }

    /**
     * @method generateIAMove
     * @description Genera coordinate valide per l'IA evitando duplicati.
     * @fix Risolto errore di inizializzazione variabili e tipizzazione Coordinate.
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