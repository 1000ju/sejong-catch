module.exports = (sequelize, DataTypes) => {
  const CatchCheckinEvent = sequelize.define(
    "CatchCheckinEvent",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      queueEntryId: {
        field: "queue_entry_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      method: {
        type: DataTypes.ENUM("qr", "button"),
        allowNull: false
      },
      lat: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true
      },
      lng: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true
      },
      verified: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      }
    },
    {
      tableName: "catch_checkin_events",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_checkin_queue",
          fields: ["queue_entry_id", "created_at"]
        }
      ]
    }
  );

  CatchCheckinEvent.associate = (models) => {
    CatchCheckinEvent.belongsTo(models.CatchQueueEntry, {
      foreignKey: "queue_entry_id",
      as: "queueEntry",
      onDelete: "CASCADE"
    });
  };

  return CatchCheckinEvent;
};
