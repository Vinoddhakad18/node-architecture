require('dotenv').config();

const environments = {
  local: {
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'node_art_local',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    dialect: 'mysql',
    logging: console.log
  },
  dev: {
    username: process.env.MYSQL_USERNAME || 'dev_user',
    password: process.env.MYSQL_PASSWORD || 'dev_password',
    database: process.env.MYSQL_DATABASE || 'node_art_dev',
    host: process.env.MYSQL_HOST || 'mysql-dev',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  },
  ppd: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'node_art_ppd',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'node_art_prod',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  }
};

module.exports = environments;
