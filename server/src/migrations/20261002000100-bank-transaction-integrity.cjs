'use strict';

// A statement without a running balance column is legitimate, so balance
// becomes nullable. source_row makes (user_id, source_file, source_row) the
// natural key that stops a re-upload duplicating every transaction.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Bank_Transactions', 'balance', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Bank_Transactions', 'source_row', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex('Bank_Transactions', ['user_id'], {
      name: 'bank_transactions_user_id_idx',
    });

    await queryInterface.addIndex('Bank_Transactions', ['user_id', 'source_file', 'source_row'], {
      unique: true,
      name: 'bank_transactions_user_source_row_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Bank_Transactions', 'bank_transactions_user_source_row_unique');
    await queryInterface.removeIndex('Bank_Transactions', 'bank_transactions_user_id_idx');
    await queryInterface.removeColumn('Bank_Transactions', 'source_row');

    // Existing rows must not block the NOT NULL constraint.
    await queryInterface.sequelize.query(
      'UPDATE "Bank_Transactions" SET balance = 0 WHERE balance IS NULL'
    );
    await queryInterface.changeColumn('Bank_Transactions', 'balance', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },
};