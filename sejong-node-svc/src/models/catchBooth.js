module.exports = (sequelize, DataTypes) => {
  const CatchBooth = sequelize.define(
    "CatchBooth",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      eventTitle: {
        field: "event_title",
        type: DataTypes.STRING(100),
        allowNull: true
      },
      startsAt: {
        field: "starts_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      endsAt: {
        field: "ends_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      venue: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      areaGeom: {
        field: "area_geom",
        type: DataTypes.GEOMETRY("POLYGON", 4326),
        allowNull: false
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      mergeTable: {
        field: "merge_table",
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      extraChairLimit: {
        field: "extra_chair_limit",
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      splitOk: {
        field: "split_ok",
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active"
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      }
    },
    {
      tableName: "catch_booths",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "spx_booth_geom",
          type: "SPATIAL",
          fields: ["area_geom"]
        }
      ]
    }
  );

  CatchBooth.associate = (models) => {
    CatchBooth.hasMany(models.CatchQueueEntry, {
      foreignKey: "booth_id",
      as: "queueEntries"
    });
    CatchBooth.hasOne(models.CatchBoothMetric, {
      foreignKey: "booth_id",
      as: "metrics"
    });
  };

  return CatchBooth;
};
