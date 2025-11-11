"use strict";

const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const adminUserId =
  process.env.SEED_ADMIN_USER_ID || "00000000-0000-0000-0000-000000000001";
const adminAccountId =
  process.env.SEED_ADMIN_ACCOUNT_ID || "00000000-0000-0000-0000-000000000002";
const sampleBoothId =
  process.env.SEED_SAMPLE_BOOTH_ID || "00000000-0000-0000-0000-000000000101";
const sampleSourceId =
  process.env.SEED_SAMPLE_SOURCE_ID || "00000000-0000-0000-0000-000000000201";
const sampleResultId =
  process.env.SEED_SAMPLE_RESULT_ID || "00000000-0000-0000-0000-000000000301";
const sampleTagId =
  process.env.SEED_SAMPLE_TAG_ID || "00000000-0000-0000-0000-000000000401";
const sampleJobId =
  process.env.SEED_SAMPLE_JOB_ID || "00000000-0000-0000-0000-000000000501";

const seededEmail = process.env.SEED_ADMIN_EMAIL || "admin@sejong.test";
const seededStudentId = process.env.SEED_ADMIN_USERNAME || "admin";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const password = process.env.SEED_ADMIN_PASSWORD || "changeMe123!";
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await queryInterface.bulkInsert("core_users", [
      {
        id: adminUserId,
        email: seededEmail,
        name: "Administrator",
        role: "admin",
        major: null,
        year: null,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert("core_auth_accounts", [
      {
        id: adminAccountId,
        user_id: adminUserId,
        provider: "local",
        provider_user_id: seededStudentId,
        password_hash: passwordHash,
        refresh_token: null,
        created_at: now
      }
    ]);

    await queryInterface.bulkInsert("catch_booths", [
      {
        id: sampleBoothId,
        name: "Sample Booth",
        event_title: "Welcome Week",
        starts_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        ends_at: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        venue: "Main Hall",
        area_geom: queryInterface.sequelize.literal(
          "ST_GeomFromText('POLYGON((127.0000 37.0000,127.0005 37.0000,127.0005 37.0005,127.0000 37.0005,127.0000 37.0000))', 4326)"
        ),
        capacity: 50,
        merge_table: 0,
        extra_chair_limit: 5,
        split_ok: 1,
        status: "active",
        created_at: now
      }
    ]);

    await queryInterface.bulkInsert("catch_booth_metrics", [
      {
        booth_id: sampleBoothId,
        wait_count: 0,
        avg_service_time_min: null,
        eta_p50: null,
        eta_p75: null,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert("crawl_sources", [
      {
        id: sampleSourceId,
        name: "University Website",
        base_url: "https://www.sejong.ac.kr",
        active: 1,
        created_at: now
      }
    ]);

    await queryInterface.bulkInsert("crawl_tags", [
      {
        id: sampleTagId,
        name: "공지"
      }
    ]);

    await queryInterface.bulkInsert("crawl_results", [
      {
        id: sampleResultId,
        source_id: sampleSourceId,
        title: "Welcome Event Announcement",
        url: "https://www.sejong.ac.kr/event/welcome-week",
        summary: "Welcome event schedule and booth information.",
        category: "news",
        published_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        crawled_at: now,
        archived: 0,
        meta: { author: "student-affairs" }
      }
    ]);

    await queryInterface.bulkInsert("crawl_result_tags", [
      {
        result_id: sampleResultId,
        tag_id: sampleTagId
      }
    ]);

    await queryInterface.bulkInsert("crawl_crawl_jobs", [
      {
        id: sampleJobId,
        source_id: sampleSourceId,
        category: "news",
        keywords: ["welcome", "행사"],
        frequency: "daily",
        last_run_at: null,
        created_by: adminUserId,
        created_at: now
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("crawl_crawl_jobs", { id: sampleJobId });
    await queryInterface.bulkDelete("crawl_result_tags", { result_id: sampleResultId });
    await queryInterface.bulkDelete("crawl_results", { id: sampleResultId });
    await queryInterface.bulkDelete("crawl_tags", { id: sampleTagId });
    await queryInterface.bulkDelete("crawl_sources", { id: sampleSourceId });
    await queryInterface.bulkDelete("catch_booth_metrics", { booth_id: sampleBoothId });
    await queryInterface.bulkDelete("catch_booths", { id: sampleBoothId });
    await queryInterface.bulkDelete("core_auth_accounts", {
      provider: "local",
      provider_user_id: seededStudentId
    });
    await queryInterface.bulkDelete("core_users", { email: seededEmail });
  }
};
