module.exports = (sequelize, DataTypes) => {
  const CrawlFeedImpression = sequelize.define(
    "CrawlFeedImpression",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      resultId: {
        field: "result_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      userId: {
        field: "user_id",
        type: DataTypes.CHAR(36),
        allowNull: false
      },
      seenAt: {
        field: "seen_at",
        type: DataTypes.DATE(3),
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP(3)")
      },
      context: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "crawl_feed_impressions",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_imp_result",
          fields: ["result_id", "seen_at"]
        },
        {
          name: "idx_imp_user",
          fields: ["user_id", "seen_at"]
        }
      ]
    }
  );

  CrawlFeedImpression.associate = (models) => {
    CrawlFeedImpression.belongsTo(models.CrawlResult, {
      foreignKey: "result_id",
      as: "result",
      onDelete: "CASCADE"
    });
    CrawlFeedImpression.belongsTo(models.CoreUser, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE"
    });
  };

  return CrawlFeedImpression;
};
