module.exports = (sequelize, DataTypes) => {
  const CrawlJob = sequelize.define(
    "CrawlJob",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      sourceId: {
        field: "source_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      category: {
        type: DataTypes.ENUM("news", "schedule", "contest", "career"),
        allowNull: false
      },
      keywords: {
        type: DataTypes.JSON,
        allowNull: true
      },
      frequency: {
        type: DataTypes.ENUM("realtime", "daily", "weekly"),
        allowNull: false,
        defaultValue: "daily"
      },
      lastRunAt: {
        field: "last_run_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      createdBy: {
        field: "created_by",
        type: DataTypes.CHAR(36),
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
      tableName: "crawl_crawl_jobs",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_job_source",
          fields: ["source_id"]
        }
      ]
    }
  );

  CrawlJob.associate = (models) => {
    CrawlJob.belongsTo(models.CrawlSource, {
      foreignKey: "source_id",
      as: "source",
      onDelete: "CASCADE"
    });
    CrawlJob.belongsTo(models.CoreUser, {
      foreignKey: "created_by",
      as: "creator",
      onDelete: "SET NULL"
    });
    CrawlJob.hasMany(models.CrawlRun, {
      foreignKey: "job_id",
      as: "runs"
    });
  };

  return CrawlJob;
};
