'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('Users', 'compliance_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_compliance_status";');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'compliance_status', {
      type: Sequelize.ENUM('pending', 'compliant'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
