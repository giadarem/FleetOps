// src/models/Game.ts
import { DataTypes, Model, Optional } from 'sequelize';
import db from '../config/database'; // Importazione del Singleton Database 
import User from './User';
import { GameState } from '../types/gameTypes';
import { GameStatus } from '../enum/gameStatus';
import { GameType } from '../enum/gameType';

/**
 * @interface GameAttributes
 * @description Definisce rigorosamente le proprietà dell'entità Game per TypeScript.
 * Garantisce type-safety durante le operazioni di CRUD e l'accesso ai dati.
 */
interface GameAttributes {
    /** Identificativo univoco della partita */
    id: string;
    /** UUID del giocatore che ha creato la partita (sempre presente) */
    player1Id: string;
    /** UUID dell'avversario. Può essere null nel caso di partita contro l'IA */
    player2Id: string | null; 
    /** Stato corrente del ciclo di vita della partita  */
    status: GameStatus; 
    /** UUID del giocatore vincitore. Null se la partita è in corso o terminata in pareggio/abbandono */
    winnerId: string | null;
    /**
     * Struttura complessa (salvata come JSONB in PostgreSQL) che incapsula 
     * l'intero stato del gioco (configurazione, plance, storico mosse).
     * Questa scelta architetturale evita complessi mapping relazionali e garantisce
     * prestazioni ottimali in lettura/scrittura dell'intero contesto di gioco.
     */
    gameState: GameState;
    type: GameType;
}

/**
 * @interface GameCreationAttributes
 * @description Estende GameAttributes rendendo opzionali i campi generati automaticamente (id)
 * o con valori di default (status) durante la fase di creazione (INSERT).
 */
interface GameCreationAttributes extends Optional<GameAttributes, 'id' | 'status' | 'winnerId'> {}

/**
 * @class Game
 * @description Modello ORM Sequelize per l'entità "Partita".
 * Mappa la tabella fisica 'Games' sul database relazionale.
 */
class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
    public id!: string;
    public type!: GameType;
    public player1Id!: string;
    public player2Id!: string | null;
    public status!: GameStatus; 
    public winnerId!: string | null;
    public gameState!: GameState;

    // Timestamps gestiti automaticamente da Sequelize per auditing 
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Inizializzazione dello schema e mapping con il database 
Game.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            // Estrae i valori 'PVP' e 'PVE' dall'enum
            type: DataTypes.ENUM(...Object.values(GameType)),
            allowNull: false,
            defaultValue: GameType.PVE // Scelta prudenziale
         },
        player1Id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Users', key: 'id' } // Vincolo di integrità referenziale 
        },
        player2Id: {
            type: DataTypes.UUID,
            allowNull: true, // Ammesso null per soddisfare il requisito PvE 
            references: { model: 'Users', key: 'id' }
        },
        status: {
            // Estrae dinamicamente i valori dall'enum per passarli al dialect PostgreSQL
            type: DataTypes.ENUM(...Object.values(GameStatus)),
            defaultValue: GameStatus.ACTIVE,
        },
        winnerId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'Users', key: 'id' }
        },
        gameState: {
            // Delega a PostgreSQL l'indicizzazione e l'archiviazione dello stato completo
            type: DataTypes.JSONB,
            allowNull: false,
        }
    },
    {
        sequelize: db.sequelize, // Passaggio dell'istanza di connessione pura 
        modelName: 'Game',
        tableName: 'Games', // Evita l'autopluralizzazione (creerebbe la tabella "Games" invece di "Games" o "Game") 
        timestamps: true,   // Abilita il tracking nativo di creazione e aggiornamento (createdAt, updatedAt) 
    }
);

// --- Definizione delle Associazioni (Relazioni 1:N) --
// Un utente (User) può partecipare a molte partite (Game) come Player 1
User.hasMany(Game, { foreignKey: 'player1Id', as: 'gamesAsPlayer1' });
// Un utente (User) può partecipare a molte partite (Game) come Player 2
User.hasMany(Game, { foreignKey: 'player2Id', as: 'gamesAsPlayer2' });

// Ogni partita appartiene sempre a un Player 1 (User)
Game.belongsTo(User, { foreignKey: 'player1Id', as: 'player1' });
// Ogni partita può appartenere a un Player 2 (User)
Game.belongsTo(User, { foreignKey: 'player2Id', as: 'player2' });

export default Game;