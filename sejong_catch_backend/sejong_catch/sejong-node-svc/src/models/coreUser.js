module.exports = (sequelize, DataTypes) => {
  const CoreUser = sequelize.define(
    "CoreUser",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      major: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM("student", "admin"),
        allowNull: false,
        defaultValue: "student"
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      },
      updatedAt: {
        field: "updated_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      }
    },
    {
      tableName: "core_users",
      timestamps: false,
      underscored: true
    }
  );

  CoreUser.associate = (models) => {
    CoreUser.hasMany(models.CoreAuthAccount, {
      foreignKey: "user_id",
      as: "authAccounts"
    });
    CoreUser.hasMany(models.CorePaymentRecord, {
      foreignKey: "user_id",
      as: "paymentRecords"
    });
    CoreUser.hasMany(models.CoreAuditLog, {
      foreignKey: "actor_user_id",
      as: "auditLogs"
    });
    CoreUser.hasMany(models.CatchQueueEntry, {
      foreignKey: "user_id",
      as: "queueEntries"
    });
    CoreUser.hasMany(models.CatchNotification, {
      foreignKey: "user_id",
      as: "notifications"
    });
    CoreUser.hasMany(models.CrawlFeedImpression, {
      foreignKey: "user_id",
      as: "feedImpressions"
    });
    CoreUser.hasMany(models.CrawlJob, {
      foreignKey: "created_by",
      as: "crawlJobs"
    });
  };

  return CoreUser;
};
