import { DataTypes, Model } from 'sequelize';

export default function defineTaxReturn(sequelize) {
  class TaxReturn extends Model {
    static associate(models) {
      TaxReturn.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      TaxReturn.hasOne(models.IncomeDeclaration, { foreignKey: 'taxReturnId', as: 'incomeDeclaration' });
      TaxReturn.hasOne(models.Payment, { foreignKey: 'taxReturnId', as: 'payment' });
    }
  }

  TaxReturn.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      filingYear: { type: DataTypes.INTEGER, allowNull: false },
      filingStatus: { type: DataTypes.ENUM('draft', 'submitted', 'paid'), allowNull: false, defaultValue: 'submitted' },
      grossIncome: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      reliefAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      reliefBasis: { type: DataTypes.ENUM('CRA', 'RENT_RELIEF'), allowNull: false, defaultValue: 'CRA' },
      totalDeductions: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      taxableIncome: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      bandBreakdown: { type: DataTypes.JSONB, allowNull: false },
      taxPayable: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      effectiveRate: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
      submittedAt: { type: DataTypes.DATE, allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'TaxReturn',
      tableName: 'Tax_Returns',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'filing_year'],
          name: 'tax_returns_user_id_filing_year_unique',
        },
      ],
    },
  );

  return TaxReturn;
}
