module.exports = (sequelize, DataTypes) => {
  const CatchBoothMetric = sequelize.define(
    "CatchBoothMetric",
    {
      boothId: {
        field: "booth_id",
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      waitCount: {
        field: "wait_count",
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      avgServiceTimeMin: {
        field: "avg_service_time_min",
        type: DataTypes.INTEGER,
        allowNull: true
      },
      etaP50: {
        field: "eta_p50",
        type: DataTypes.INTEGER,
        allowNull: true
      },
      etaP75: {
        field: "eta_p75",
        type: DataTypes.INTEGER,
        allowNull: true
      },
      updatedAt: {
        field: "updated_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      }
    },
    {
      tableName: "catch_booth_metrics",
      timestamps: false,
      underscored: true
    }
  );

  CatchBoothMetric.associate = (models) => {
    CatchBoothMetric.belongsTo(models.CatchBooth, {
      foreignKey: "booth_id",
      as: "booth",
      onDelete: "CASCADE"
    });
  };

  return CatchBoothMetric;
};
