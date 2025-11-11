module.exports = (sequelize, DataTypes) => {
  const CatchNotification = sequelize.define(
    "CatchNotification",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM("call", "reminder", "seat", "general"),
        allowNull: false
      },
      userId: {
        field: "user_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      queueEntryId: {
        field: "queue_entry_id",
        type: DataTypes.CHAR(36),
        allowNull: true
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("queued", "sent", "failed", "seen"),
        allowNull: false,
        defaultValue: "queued"
      },
      failReason: {
        field: "fail_reason",
        type: DataTypes.STRING(200),
        allowNull: true
      },
      deliveredAt: {
        field: "delivered_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      seenAt: {
        field: "seen_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      }
    },
    {
      tableName: "catch_notifications",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_notif_user",
          fields: ["user_id", "created_at"]
        },
        {
          name: "idx_notif_queue",
          fields: ["queue_entry_id"]
        }
      ]
    }
  );

  CatchNotification.associate = (models) => {
    CatchNotification.belongsTo(models.CoreUser, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE"
    });
    CatchNotification.belongsTo(models.CatchQueueEntry, {
      foreignKey: "queue_entry_id",
      as: "queueEntry",
      onDelete: "SET NULL"
    });
  };

  return CatchNotification;
};
