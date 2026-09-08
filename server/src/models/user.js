import { DataTypes, Model } from 'sequelize';

export default function defineUser(sequelize) {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.TaxReturn, { foreignKey: 'userId', as: 'taxReturns' });
      User.hasMany(models.AdminLog, { foreignKey: 'userId', as: 'adminLogs' });
    }

    // Derive compliance status from most recent tax return
    async getComplianceStatus() {
      const latestReturn = await sequelize.models.TaxReturn.findOne({
        where: { userId: this.id },
        order: [['filingYear', 'DESC']],
        limit: 1,
      });
      
      if (!latestReturn) {
        return 'pending'; // No returns filed
      }
      
      return latestReturn.filingStatus === 'paid' ? 'compliant' : 'pending';
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
