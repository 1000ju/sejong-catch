module.exports = (sequelize, DataTypes) => {
  const CrawlResult = sequelize.define(
    "CrawlResult",
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
      title: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      url: {
        type: DataTypes.STRING(1000),
        allowNull: false
      },
      urlHash: {
        field: "url_hash",
        type: DataTypes.BLOB("tiny"),
        allowNull: false
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM("news", "schedule", "contest", "career"),
        allowNull: false
      },
      publishedAt: {
        field: "published_at",
        type: DataTypes.DATE(3),
        allowNull: true
      },
      crawledAt: {
        field: "crawled_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      },
      archived: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      meta: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "crawl_results",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "uk_result_url_hash",
          unique: true,
          fields: ["url_hash"]
        },
        {
          name: "idx_result_url_prefix",
          fields: [
            {
              attribute: "url",
              length: 191
            }
          ]
        },
        {
          name: "idx_result_cat_time",
          fields: ["category", "published_at"]
        },
        {
          name: "idx_result_source",
          fields: ["source_id"]
        }
      ]
    }
  );

  CrawlResult.associate = (models) => {
    CrawlResult.belongsTo(models.CrawlSource, {
      foreignKey: "source_id",
      as: "source",
      onDelete: "CASCADE"
    });
    CrawlResult.hasMany(models.CrawlResultTag, {
      foreignKey: "result_id",
      as: "resultTags"
    });
    CrawlResult.hasMany(models.CrawlFeedImpression, {
      foreignKey: "result_id",
      as: "feedImpressions"
    });
  };

  return CrawlResult;
};
