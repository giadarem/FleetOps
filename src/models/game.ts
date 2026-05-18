// src/models/Game.ts
import { DataTypes, Model, Optional } from 'sequelize';
import db from '../config/database'; // Importazione del Singleton Database 
import User from './User';
import { GameState } from '../types/gameTypes';
import { GameStatus } from '../enum/gameStatus';
import { GameType } from '../enum/gameType';

/**
 * @interface GameAttributes
 * @description Definisce le proprietà dell’entità Game utilizzate dal modello Sequelize.
 * Garantisce type-safety nelle operazioni di accesso, creazione e aggiornamento
 * dei dati relativi alle partite.
 */
interface GameAttributes {
    /** Identificativo univoco della partita */
    id: string;
    /** UUID del giocatore che ha creato la partita */
    player1Id: string;
    /** UUID dell’avversario, nullo nelle partite contro IA */
    player2Id: string | null; 
    /** Stato corrente del ciclo di vita della partita */
    status: GameStatus; 
    /** UUID del giocatore vincitore, nullo finché la partita non ha un vincitore */
    winnerId: string | null;
    /**
     * Stato completo della partita salvato come struttura JSONB.
     * Contiene le informazioni necessarie alla ricostruzione del contesto di gioco,
     * incluse configurazioni, griglie e storico delle mosse.
     */
    gameState: GameState;
    /** Tipologia della partita, PvP o PvE */
    type: GameType;
}

/**
 * @interface GameCreationAttributes
 * @description Definisce gli attributi richiesti in fase di creazione di una partita.
 * Estende GameAttributes rendendo opzionali i campi generati automaticamente
 * o valorizzati tramite default dal modello.
 */
interface GameCreationAttributes extends Optional<GameAttributes, 'id' | 'status' | 'winnerId'> {}

/**
 * @class Game
 * @description Modello ORM Sequelize dell’entità Partita.
 * Si colloca nel livello Model dell’architettura e mappa la tabella fisica Games,
 * definendo attributi, tipi e relazioni principali con gli utenti coinvolti.
 */
class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
    public id!: string;
    public type!: GameType;
    public player1Id!: string;
    public player2Id!: string | null;
    public status!: GameStatus; 
    public winnerId!: string | null;
    public gameState!: GameState;

    /** Timestamp di creazione gestito automaticamente da Sequelize */
    public readonly createdAt!: Date;
    /** Timestamp di aggiornamento gestito automaticamente da Sequelize */
    public readonly updatedAt!: Date;
}

/**
 * @description Inizializza il mapping Sequelize tra il modello Game e la tabella Games.
 * Definisce colonne, vincoli, valori di default e configurazioni ORM necessarie
 * alla persistenza delle partite.
 */
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

/**
 * @description Definisce le associazioni Sequelize tra User e Game.
 * Le relazioni permettono di collegare una partita ai giocatori coinvolti
 * e all’eventuale vincitore, abilitando l’eager-loading tramite alias dedicati.
 */
User.hasMany(Game, { foreignKey: 'player1Id', as: 'gamesAsPlayer1' });
User.hasMany(Game, { foreignKey: 'player2Id', as: 'gamesAsPlayer2' });

Game.belongsTo(User, { foreignKey: 'player1Id', as: 'Player1' });
Game.belongsTo(User, { foreignKey: 'player2Id', as: 'Player2' });
Game.belongsTo(User, { foreignKey: 'winnerId', as: 'Winner' }); // Relazione aggiunta per evitare crash

export default Game;