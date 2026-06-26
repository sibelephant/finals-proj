'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Income_Declarations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      tax_return_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'Tax_Returns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      gross_income: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      employment_income: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      business_income: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      pension_contribution: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      life_assurance: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      nhf_contribution: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Income_Declarations');
  },
};
