module.exports = (sequelize, DataTypes) => {
  const CorePaymentRecord = sequelize.define(
    "CorePaymentRecord",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      studentNo: {
        field: "student_no",
        type: DataTypes.STRING(50),
        allowNull: false
      },
      userId: {
        field: "user_id",
        type: DataTypes.CHAR(36),
        allowNull: true
      },
      paidAt: {
        field: "paid_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      verifiedAt: {
        field: "verified_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      source: {
        type: DataTypes.STRING(100),
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
      tableName: "core_payment_records",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_payment_student",
          fields: ["student_no"]
        },
        {
          name: "idx_payment_user",
          fields: ["user_id"]
        }
      ]
    }
  );

  CorePaymentRecord.associate = (models) => {
    CorePaymentRecord.belongsTo(models.CoreUser, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "SET NULL"
    });
  };

  return CorePaymentRecord;
};
