'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bank_Transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      transaction_date: { type: Sequelize.DATEONLY, allowNull: false },
      narration: { type: Sequelize.TEXT, allowNull: false },
      debit: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      credit: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      balance: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      category: { type: Sequelize.STRING, allowNull: true },
      source_file: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Bank_Transactions');
  },
};
