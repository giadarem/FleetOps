import { DataTypes, Model } from 'sequelize';
import database from '../config/database';
import { UserRole } from '../enum/userRole';

/**
 * @class User
 * @description Modello ORM Sequelize dell’entità Utente.
 * Si colloca nel livello Model dell’architettura e mappa la tabella Users,
 * definendo credenziali, ruolo, saldo token e punteggio dell’utente.
 */
class User extends Model {
  /** Identificativo univoco dell’utente */
  public id!: string; 
  /** Email utilizzata per autenticazione e identificazione dell’utente */
  public email!: string;
  /** Password dell’utente, gestita secondo la logica di autenticazione applicativa */
  public password!: string; 
  /** Ruolo applicativo dell’utente */
  public role!: UserRole;
  /** Saldo token disponibile per le operazioni di gioco */
  public tokenBalance!: number; 
  /** Punteggio accumulato dall’utente nelle partite */
  public points!: number;       
}

/**
 * @description Inizializza il mapping Sequelize tra il modello User e la tabella Users.
 * Definisce colonne, vincoli, validazioni, valori di default e configurazioni ORM
 * necessarie alla persistenza degli utenti.
 */
User.init(
  {
    id: {
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true, 
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.USER,
    },
    // MAPPA I NUOVI CAMPI
    tokenBalance: {
      type: DataTypes.DOUBLE, 
      allowNull: false,
      defaultValue: 0.0,
      field: 'tokenBalance' 
    },
    points: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.0,
      field: 'points'
    }
  },
  {
    sequelize: database.sequelize, 
    tableName: 'Users',
    timestamps: true, 
  }
);

export default User;