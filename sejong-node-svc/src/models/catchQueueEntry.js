module.exports = (sequelize, DataTypes) => {
  const CatchQueueEntry = sequelize.define(
    "CatchQueueEntry",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      boothId: {
        field: "booth_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      userId: {
        field: "user_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      partySize: {
        field: "party_size",
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("waiting", "called", "seated", "no_show", "cancelled"),
        allowNull: false,
        defaultValue: "waiting"
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      },
      calledAt: {
        field: "called_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      seatedAt: {
        field: "seated_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      cancelledAt: {
        field: "cancelled_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      priorityFlags: {
        field: "priority_flags",
        type: DataTypes.JSON,
        allowNull: true
      },
      lastEtaMin: {
        field: "last_eta_min",
        type: DataTypes.INTEGER,
        allowNull: true
      },
      isActive: {
        field: "is_active",
        type: DataTypes.TINYINT,
        allowNull: true,
        get() {
          const raw = this.getDataValue("isActive");
          return raw == null ? null : raw === 1;
        }
      }
    },
    {
      tableName: "catch_queue_entries",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "uq_active_queue",
          unique: true,
          fields: ["user_id", "booth_id", "is_active"]
        },
        {
          name: "idx_queue_booth_status_time",
          fields: ["booth_id", "status", "created_at"]
        },
        {
          name: "idx_queue_user",
          fields: ["user_id"]
        }
      ]
    }
  );

  CatchQueueEntry.associate = (models) => {
    CatchQueueEntry.belongsTo(models.CatchBooth, {
      foreignKey: "booth_id",
      as: "booth",
      onDelete: "CASCADE"
    });
    CatchQueueEntry.belongsTo(models.CoreUser, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "RESTRICT"
    });
    CatchQueueEntry.hasMany(models.CatchCheckinEvent, {
      foreignKey: "queue_entry_id",
      as: "checkinEvents"
    });
    CatchQueueEntry.hasMany(models.CatchNotification, {
      foreignKey: "queue_entry_id",
      as: "notifications"
    });
    CatchQueueEntry.hasMany(models.CatchQrToken, {
      foreignKey: "queue_entry_id",
      as: "qrTokens"
    });
  };

  return CatchQueueEntry;
};
