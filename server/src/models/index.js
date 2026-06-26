import sequelize from '../config/sequelize.js';
import defineAdminLog from './adminLog.js';
import defineIncomeDeclaration from './incomeDeclaration.js';
import definePayment from './payment.js';
import defineTaxReturn from './taxReturn.js';
import defineUser from './user.js';

const models = {
  User: defineUser(sequelize),
  TaxReturn: defineTaxReturn(sequelize),
  IncomeDeclaration: defineIncomeDeclaration(sequelize),
  Payment: definePayment(sequelize),
  AdminLog: defineAdminLog(sequelize),
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export { sequelize };
export default models;
