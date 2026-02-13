const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  telegramId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  githubUsername: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  plan: {
    type: DataTypes.ENUM('free', 'pro', 'enterprise'),
    defaultValue: 'free',
  },
  apiKey: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'canceled', 'past_due'),
    defaultValue: 'inactive',
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usageStats: {
    type: DataTypes.JSONB,
    defaultValue: {
      reposCreated: 0,
      reposDeleted: 0,
      filesUploaded: 0,
      apiCalls: 0,
    },
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.canPerformAction = function(action) {
  const config = require('../../config');
  const planLimits = config.plans[this.plan];
  
  switch (action) {
    case 'createRepo':
      return planLimits.maxRepos === -1 || this.usageStats.reposCreated < planLimits.maxRepos;
    case 'apiCall':
      return planLimits.maxApiCalls === -1 || this.usageStats.apiCalls < planLimits.maxApiCalls;
    default:
      return true;
  }
};

module.exports = User;
