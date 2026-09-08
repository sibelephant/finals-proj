import { DataTypes, Model } from 'sequelize';

export default function defineBankTransaction(sequelize) {
  class BankTransaction extends Model {
    static associate(models) {
      BankTransaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  BankTransaction.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      transactionDate: { type: DataTypes.DATEONLY, allowNull: false },
      narration: { type: DataTypes.TEXT, allowNull: false },
      debit: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      credit: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      category: { type: DataTypes.STRING, allowNull: true },
      sourceFile: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: 'BankTransaction',
      tableName: 'Bank_Transactions',
      underscored: true,
    },
  );

  return BankTransaction;
}
