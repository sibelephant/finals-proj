import { DataTypes, Model } from 'sequelize';

export default function defineUser(sequelize) {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.TaxReturn, { foreignKey: 'userId', as: 'taxReturns' });
      User.hasMany(models.AdminLog, { foreignKey: 'userId', as: 'adminLogs' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      fullName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      tin: { type: DataTypes.STRING, allowNull: false, unique: true },
      role: { type: DataTypes.ENUM('taxpayer', 'admin'), allowNull: false, defaultValue: 'taxpayer' },
      complianceStatus: { type: DataTypes.ENUM('pending', 'compliant'), allowNull: false, defaultValue: 'pending' },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      underscored: true,
    },
  );

  return User;
}
