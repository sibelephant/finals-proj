'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tax_Returns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      filing_year: { type: Sequelize.INTEGER, allowNull: false },
      filing_status: { type: Sequelize.ENUM('draft', 'submitted', 'paid'), allowNull: false, defaultValue: 'submitted' },
      gross_income: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      cra: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      total_deductions: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      taxable_income: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      band_breakdown: { type: Sequelize.JSONB, allowNull: false },
      tax_payable: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      effective_rate: { type: Sequelize.DECIMAL(7, 2), allowNull: false },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Tax_Returns');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Tax_Returns_filing_status";');
  },
};
