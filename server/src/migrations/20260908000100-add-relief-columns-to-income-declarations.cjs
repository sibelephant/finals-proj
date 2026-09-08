'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Income_Declarations', 'rent_paid_annual', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Income_Declarations', 'nhis_contribution', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Income_Declarations', 'housing_loan_interest', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Income_Declarations', 'housing_loan_interest');
    await queryInterface.removeColumn('Income_Declarations', 'nhis_contribution');
    await queryInterface.removeColumn('Income_Declarations', 'rent_paid_annual');
  },
};