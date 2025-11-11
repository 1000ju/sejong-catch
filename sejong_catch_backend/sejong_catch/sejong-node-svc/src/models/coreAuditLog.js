module.exports = (sequelize, DataTypes) => {
  const CoreAuditLog = sequelize.define(
    "CoreAuditLog",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      actorUserId: {
        field: "actor_user_id",
        type: DataTypes.CHAR(36),
        allowNull: true
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      entity: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      entityId: {
        field: "entity_id",
        type: DataTypes.STRING(64),
        allowNull: false
      },
      meta: {
        type: DataTypes.JSON,
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
      tableName: "core_audit_logs",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_audit_time",
          fields: ["created_at"]
        },
        {
          name: "idx_audit_actor",
          fields: ["actor_user_id"]
        }
      ]
    }
  );

  CoreAuditLog.associate = (models) => {
    CoreAuditLog.belongsTo(models.CoreUser, {
      foreignKey: "actor_user_id",
      as: "actor",
      onDelete: "SET NULL"
    });
  };

  return CoreAuditLog;
};
