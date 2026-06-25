'use strict';

/**
 * File Metadata Table
 * Stores file upload metadata for tracking uploaded files.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('file_metadata', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Original filename as uploaded by user'
      },

      storage_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
        comment: 'Storage key/path in the storage provider'
      },

      bucket: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Storage bucket name'
      },

      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME type of the file'
      },

      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'File size in bytes'
      },

      url: {
        type: Sequelize.STRING(1000),
        allowNull: false,
        comment: 'Public URL or path to access the file'
      },

      etag: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ETag from storage provider for cache validation'
      },

      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'File category (e.g., images, documents, videos)'
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description of the file'
      },

      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata as JSON'
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('file_metadata', ['category']);
    await queryInterface.addIndex('file_metadata', ['status']);
    await queryInterface.addIndex('file_metadata', ['created_by']);
    await queryInterface.addIndex('file_metadata', ['mime_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('file_metadata');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_file_metadata_status";');
  }
};
