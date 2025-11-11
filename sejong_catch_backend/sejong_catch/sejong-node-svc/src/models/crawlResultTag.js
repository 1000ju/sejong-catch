module.exports = (sequelize, DataTypes) => {
  const CrawlResultTag = sequelize.define(
    "CrawlResultTag",
    {
      resultId: {
        field: "result_id",
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      tagId: {
        field: "tag_id",
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      }
    },
    {
      tableName: "crawl_result_tags",
      timestamps: false,
      underscored: true
    }
  );

  CrawlResultTag.associate = (models) => {
    CrawlResultTag.belongsTo(models.CrawlResult, {
      foreignKey: "result_id",
      as: "result",
      onDelete: "CASCADE"
    });
    CrawlResultTag.belongsTo(models.CrawlTag, {
      foreignKey: "tag_id",
      as: "tag",
      onDelete: "CASCADE"
    });
  };

  return CrawlResultTag;
};
