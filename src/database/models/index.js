const User = require('./User');
const Repository = require('./Repository');
const ActivityLog = require('./ActivityLog');

// Define relationships
User.hasMany(Repository, {
  foreignKey: 'userId',
  as: 'repositories',
});

Repository.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(ActivityLog, {
  foreignKey: 'userId',
  as: 'activities',
});

ActivityLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = {
  User,
  Repository,
  ActivityLog,
};
