// src/utils/GameEngine.ts
import { ShipConfiguration, Ship, Coordinate, Board } from '../types/gameTypes';
import { ErrorFactory } from '../patterns/ErrorFactory';

/**
 * @class GameEngine
 * @description Core engine di dominio per la Battaglia Navale.
 * Gestisce la logica spaziale complessa, totalmente disaccoppiata dall'infrastruttura web o DB.
 */
export class GameEngine {
    
    /**
     * @method generateRandomBoard
     * @description Genera lo schieramento iniziale di una singola plancia, posizionando le navi
     * in modo pseudo-casuale rispettando i vincoli di non-sovrapposizione e i limiti della griglia.
     * @param {number} gridSize - Il lato della griglia quadrata (es. 22).
     * @param {ShipConfiguration[]} configurations - Le regole di generazione (quantità e dimensione navi).
     * @returns {Board} L'oggetto Board rappresentante la plancia pronta per il salvataggio.
     * @throws {HttpError} Se la densità richiesta è troppo alta e l'algoritmo va in timeout.
     */
    public static generateRandomBoard(gridSize: number, configurations: ShipConfiguration[]): Board {
        const placedShips: Ship[] = [];
        // Limite massimo di tentativi per nave per prevenire loop infiniti (Edge Case: griglia troppo piccola)
        const MAX_ATTEMPTS = 2000; 

        for (const config of configurations) {
            for (let i = 0; i < config.count; i++) {
                let isPlaced = false;
                let attempts = 0;

                while (!isPlaced && attempts < MAX_ATTEMPTS) {
                    attempts++;
                    
                    // 1. Scelta direzionale randomica: true = Verticale, false = Orizzontale
                    const isVertical = Math.random() < 0.5;
                    
                    // 2. Generazione del punto di origine (testa della nave)
                    const startX = Math.floor(Math.random() * gridSize);
                    const startY = Math.floor(Math.random() * gridSize);

                    // 3. Proiezione spaziale dell'ingombro della nave
                    const targetCoordinates = this.projectShipCoordinates(startX, startY, config.size, isVertical);

                    // 4. Validazione Architetturale: Controllo Limiti e Collisioni
                    if (this.isWithinBounds(targetCoordinates, gridSize) && !this.hasCollision(targetCoordinates, placedShips)) {
                        
                        // Creazione dell'entità Nave pronta per l'inserimento
                        const newShip: Ship = {
                            type: config.type,
                            size: config.size,
                            coordinates: targetCoordinates,
                            // Inizializza l'array dei colpi a false (nessun danno)
                            hits: new Array(config.size).fill(false), 
                            isSunk: false
                        };

                        placedShips.push(newShip);
                        isPlaced = true; // Interrompe il loop while per passare alla nave successiva
                    }
                }

                // Gestione Errori: Se l'algoritmo non trova spazio dopo 2000 tentativi, la configurazione è invalida
                if (!isPlaced) {
                    throw ErrorFactory.getError(
                        'BAD_REQUEST', 
                        `Impossibile allocare la nave di tipo ${config.type}. Griglia troppo densa o piccola.`
                    );
                }
            }
        }

        // Ritorna la plancia formattata secondo il contratto GameTypes
        return {
            ships: placedShips,
            shotsReceived: [] // Nessun colpo ricevuto all'inizio della partita
        };
    }

    /**
     * @method projectShipCoordinates
     * @private
     * @description Calcola l'array di coordinate occupate da una nave partendo dalla sua origine.
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
     * @description Verifica che nessuna sezione della nave sporga oltre i limiti della griglia.
     */
    private static isWithinBounds(coords: Coordinate[], gridSize: number): boolean {
        // Ritorna true solo se TUTTE (every) le coordinate rispettano i limiti [0, gridSize-1]
        return coords.every(c => c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize);
    }

    /**
     * @method hasCollision
     * @private
     * @description Algoritmo di intersezione. Verifica se le nuove coordinate collidono con la flotta esistente.
     */
    private static hasCollision(newCoords: Coordinate[], existingShips: Ship[]): boolean {
        for (const ship of existingShips) {
            for (const existingCoord of ship.coordinates) {
                for (const newCoord of newCoords) {
                    // Controllo di equivalenza spaziale 1:1
                    if (existingCoord.x === newCoord.x && existingCoord.y === newCoord.y) {
                        return true; // Collisione rilevata, interruzione anticipata (Short-circuit)
                    }
                }
            }
        }
        return false; // Nessuna collisione, rotta libera
    }
}