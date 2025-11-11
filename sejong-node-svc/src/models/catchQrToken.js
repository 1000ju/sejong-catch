module.exports = (sequelize, DataTypes) => {
  const CatchQrToken = sequelize.define(
    "CatchQrToken",
    {
      token: {
        type: DataTypes.CHAR(64),
        primaryKey: true,
        allowNull: false
      },
      queueEntryId: {
        field: "queue_entry_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      expiresAt: {
        field: "expires_at",
        type: DataTypes.DATE(3),
        allowNull: false
      },
      usedAt: {
        field: "used_at",
        type: DataTypes.DATE(3),
        allowNull: true
      }
    },
    {
      tableName: "catch_qr_tokens",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_qr_entry",
          fields: ["queue_entry_id"]
        },
        {
          name: "idx_qr_exp",
          fields: ["expires_at"]
        }
      ]
    }
  );

  CatchQrToken.associate = (models) => {
    CatchQrToken.belongsTo(models.CatchQueueEntry, {
      foreignKey: "queue_entry_id",
      as: "queueEntry",
      onDelete: "CASCADE"
    });
  };

  return CatchQrToken;
};
