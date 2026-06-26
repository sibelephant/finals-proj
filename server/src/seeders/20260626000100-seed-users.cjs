'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Password123', 10);
    const now = new Date();
    await queryInterface.bulkInsert('Users', [
      {
        id: '11111111-1111-4111-8111-111111111111',
        full_name: 'Amina Yusuf',
        email: 'amina.yusuf@example.com',
        password_hash: passwordHash,
        phone: '08034567890',
        address: '14 Marina Road, Lagos',
        tin: 'TIN-2026-000001',
        role: 'taxpayer',
        compliance_status: 'pending',
        created_at: now,
        updated_at: now,
      },
      {
        id: '99999999-9999-4999-8999-999999999999',
        full_name: 'Compliance Officer',
        email: 'admin@etax.test',
        password_hash: passwordHash,
        phone: '08000000000',
        address: 'Revenue Service HQ',
        tin: 'TIN-2026-999999',
        role: 'admin',
        compliance_status: 'compliant',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {
      email: ['amina.yusuf@example.com', 'admin@etax.test'],
    });
  },
};
