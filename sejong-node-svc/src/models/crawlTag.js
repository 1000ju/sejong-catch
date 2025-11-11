module.exports = (sequelize, DataTypes) => {
  const CrawlTag = sequelize.define(
    "CrawlTag",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      }
    },
    {
      tableName: "crawl_tags",
      timestamps: false,
      underscored: true
    }
  );

  CrawlTag.associate = (models) => {
    CrawlTag.belongsToMany(models.CrawlResult, {
      through: models.CrawlResultTag,
      foreignKey: "tag_id",
      otherKey: "result_id",
      as: "results"
    });
  };

  return CrawlTag;
};
