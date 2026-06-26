import { DataTypes, Model } from 'sequelize';

export default function definePayment(sequelize) {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.TaxReturn, { foreignKey: 'taxReturnId', as: 'taxReturn' });
    }
  }

  Payment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      taxReturnId: { type: DataTypes.UUID, allowNull: false, unique: true },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      paymentReference: { type: DataTypes.STRING, allowNull: false, unique: true },
      paymentStatus: { type: DataTypes.ENUM('successful', 'failed'), allowNull: false, defaultValue: 'successful' },
      paidAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'Payments',
      underscored: true,
    },
  );

  return Payment;
}
