import { DataTypes, Model } from 'sequelize';

export default function defineIncomeDeclaration(sequelize) {
  class IncomeDeclaration extends Model {
    static associate(models) {
      IncomeDeclaration.belongsTo(models.TaxReturn, { foreignKey: 'taxReturnId', as: 'taxReturn' });
    }
  }

  IncomeDeclaration.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      taxReturnId: { type: DataTypes.UUID, allowNull: false, unique: true },
      grossIncome: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      employmentIncome: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      businessIncome: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      pensionContribution: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      lifeAssurance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      nhfContribution: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      rentPaidAnnual: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
      nhisContribution: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
      housingLoanInterest: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'IncomeDeclaration',
      tableName: 'Income_Declarations',
      underscored: true,
    },
  );

  return IncomeDeclaration;
}
