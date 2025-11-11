module.exports = (sequelize, DataTypes) => {
  const CrawlRun = sequelize.define(
    "CrawlRun",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      jobId: {
        field: "job_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("running", "success", "failed"),
        allowNull: false
      },
      stats: {
        type: DataTypes.JSON,
        allowNull: true
      },
      startedAt: {
        field: "started_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      finishedAt: {
        field: "finished_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: "crawl_crawl_runs",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_run_job",
          fields: ["job_id", "started_at"]
        }
      ]
    }
  );

  CrawlRun.associate = (models) => {
    CrawlRun.belongsTo(models.CrawlJob, {
      foreignKey: "job_id",
      as: "job",
      onDelete: "CASCADE"
    });
  };

  return CrawlRun;
};
