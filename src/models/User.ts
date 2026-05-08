import { DataTypes, Model } from 'sequelize';
import database from '../config/database';
import { UserRole } from '../enum/userRole';

/**
 * @class User
 * @description Modello Sequelize per la gestione degli utenti.
 */
class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string; 
  public role!: UserRole;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.USER,
    }
  },
  {
    sequelize: database.sequelize,
    tableName: 'Users',
    timestamps: true, // Sequelize gestirà createdAt e updatedAt [cite: 233]
  }
);

export default User;