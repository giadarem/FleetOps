import { DataTypes, Model } from 'sequelize';
import database from '../config/database';
import { UserRole } from '../enum/userRole';

/**
 * @class User
 * @description Modello Sequelize aggiornato per FleetOps.
 * Allineato con lo schema SQL (UUID, tokenBalance, points).
 */
class User extends Model {
  public id!: string; 
  public email!: string;
  public password!: string; 
  public role!: UserRole;
  public tokenBalance!: number; 
  public points!: number;       
}

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
    // MAPPIAMO I NUOVI CAMPI
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