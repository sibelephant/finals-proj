'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add composite unique index on Tax_Returns(user_id, filing_year)
    await queryInterface.addIndex('Tax_Returns', ['user_id', 'filing_year'], {
      unique: true,
      name: 'tax_returns_user_id_filing_year_unique',
    });

    // Rename cra column to relief_amount
    await queryInterface.renameColumn('Tax_Returns', 'cra', 'relief_amount');

    // Add relief_basis column
    await queryInterface.addColumn('Tax_Returns', 'relief_basis', {
      type: Sequelize.ENUM('CRA', 'RENT_RELIEF'),
      allowNull: true,
      defaultValue: 'CRA', // Default for existing records
    });

    // Update existing records to set relief_basis to 'CRA'
    await queryInterface.sequelize.query(
      "UPDATE \"Tax_Returns\" SET relief_basis = 'CRA' WHERE relief_basis IS NULL"
    );

    // Make relief_basis NOT NULL after updating existing records
    await queryInterface.changeColumn('Tax_Returns', 'relief_basis', {
      type: Sequelize.ENUM('CRA', 'RENT_RELIEF'),
      allowNull: false,
      defaultValue: 'CRA',
    });
  },

  async down(queryInterface) {
    // Remove relief_basis column
    await queryInterface.removeColumn('Tax_Returns', 'relief_basis');

    // Rename relief_amount back to cra
    await queryInterface.renameColumn('Tax_Returns', 'relief_amount', 'cra');

    // Remove the unique index
    await queryInterface.removeIndex('Tax_Returns', 'tax_returns_user_id_filing_year_unique');

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Tax_Returns_relief_basis";');
  },
};