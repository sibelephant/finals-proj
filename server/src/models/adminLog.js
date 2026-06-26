import { DataTypes, Model } from 'sequelize';

export default function defineAdminLog(sequelize) {
  class AdminLog extends Model {
    static associate(models) {
      AdminLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  AdminLog.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    {
      sequelize,
      modelName: 'AdminLog',
      tableName: 'Admin_Logs',
      underscored: true,
    },
  );

  return AdminLog;
}
