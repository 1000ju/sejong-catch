module.exports = (sequelize, DataTypes) => {
  const CrawlSource = sequelize.define(
    "CrawlSource",
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
      baseUrl: {
        field: "base_url",
        type: DataTypes.STRING(500),
        allowNull: true
      },
      active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      }
    },
    {
      tableName: "crawl_sources",
      timestamps: false,
      underscored: true
    }
  );

  CrawlSource.associate = (models) => {
    CrawlSource.hasMany(models.CrawlResult, {
      foreignKey: "source_id",
      as: "results"
    });
    CrawlSource.hasMany(models.CrawlJob, {
      foreignKey: "source_id",
      as: "jobs"
    });
  };

  return CrawlSource;
};
