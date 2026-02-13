const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Repository = sequelize.define('Repository', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  githubId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  stars: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  forks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  timestamps: true,
});

module.exports = Repository;
