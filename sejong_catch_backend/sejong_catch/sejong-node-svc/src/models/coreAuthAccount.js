module.exports = (sequelize, DataTypes) => {
  const CoreAuthAccount = sequelize.define(
    "CoreAuthAccount",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      userId: {
        field: "user_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      providerUserId: {
        field: "provider_user_id",
        type: DataTypes.STRING(255),
        allowNull: false
      },
      passwordHash: {
        field: "password_hash",
        type: DataTypes.STRING(255),
        allowNull: true
      },
      refreshToken: {
        field: "refresh_token",
        type: DataTypes.STRING(500),
        allowNull: true
      },
      lastLoginAt: {
        field: "last_login_at",
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
      tableName: "core_auth_accounts",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "uk_provider_user",
          unique: true,
          fields: ["provider", "provider_user_id"]
        },
        {
          name: "idx_auth_user",
          fields: ["user_id"]
        }
      ]
    }
  );

  CoreAuthAccount.associate = (models) => {
    CoreAuthAccount.belongsTo(models.CoreUser, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE"
    });
  };

  return CoreAuthAccount;
};
