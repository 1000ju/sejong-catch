"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE core_users (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100),
        role ENUM('student','admin') NOT NULL DEFAULT 'student',
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE core_auth_accounts (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        last_login_at DATETIME(3),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uk_provider_user (provider, provider_user_id),
        KEY idx_auth_user (user_id),
        CONSTRAINT fk_auth_user FOREIGN KEY (user_id)
          REFERENCES core_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE core_payment_records (
        id CHAR(36) PRIMARY KEY,
        student_no VARCHAR(50) NOT NULL,
        user_id CHAR(36),
        paid_at DATETIME(3),
        verified_at DATETIME(3),
        source VARCHAR(100),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        KEY idx_payment_student (student_no),
        KEY idx_payment_user (user_id),
        CONSTRAINT fk_payment_user FOREIGN KEY (user_id)
          REFERENCES core_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE core_audit_logs (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        actor_user_id CHAR(36),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        meta JSON,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        KEY idx_audit_time (created_at),
        KEY idx_audit_actor (actor_user_id),
        CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id)
          REFERENCES core_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE catch_booths (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        event_title VARCHAR(100),
        starts_at DATETIME(3),
        ends_at DATETIME(3),
        venue VARCHAR(200),
        area_geom GEOMETRY NOT NULL SRID 4326,
        SPATIAL INDEX spx_booth_geom (area_geom),
        capacity INT DEFAULT 0,
        merge_table TINYINT NOT NULL DEFAULT 0,
        extra_chair_limit INT NOT NULL DEFAULT 0,
        split_ok TINYINT NOT NULL DEFAULT 0,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active',
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE catch_queue_entries (
        id CHAR(36) PRIMARY KEY,
        booth_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        party_size INT NOT NULL,
        status ENUM('waiting','called','seated','no_show','cancelled') NOT NULL DEFAULT 'waiting',
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        called_at DATETIME(3),
        seated_at DATETIME(3),
        cancelled_at DATETIME(3),
        priority_flags JSON,
        last_eta_min INT,
        is_active TINYINT AS (status IN ('waiting','called')) VIRTUAL,
        UNIQUE KEY uq_active_queue (user_id, booth_id, is_active),
        KEY idx_queue_booth_status_time (booth_id, status, created_at),
        KEY idx_queue_user (user_id),
        CONSTRAINT fk_queue_booth FOREIGN KEY (booth_id)
          REFERENCES catch_booths(id) ON DELETE CASCADE,
        CONSTRAINT fk_queue_user FOREIGN KEY (user_id)
          REFERENCES core_users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE catch_checkin_events (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        queue_entry_id CHAR(36) NOT NULL,
        method ENUM('qr','button') NOT NULL,
        lat DECIMAL(9,6),
        lng DECIMAL(9,6),
        verified TINYINT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        KEY idx_checkin_queue (queue_entry_id, created_at),
        CONSTRAINT fk_checkin_queue FOREIGN KEY (queue_entry_id)
          REFERENCES catch_queue_entries(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE catch_qr_tokens (
        token CHAR(64) PRIMARY KEY,
        queue_entry_id CHAR(36) NOT NULL,
        expires_at DATETIME(3) NOT NULL,
        used_at DATETIME(3),
        KEY idx_qr_entry (queue_entry_id),
        KEY idx_qr_exp (expires_at),
        CONSTRAINT fk_qr_queue FOREIGN KEY (queue_entry_id)
          REFERENCES catch_queue_entries(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE catch_notifications (
        id CHAR(36) PRIMARY KEY,
        type ENUM('call','reminder','seat','general') NOT NULL,
        user_id CHAR(36) NOT NULL,
        queue_entry_id CHAR(36),
        payload JSON,
        status ENUM('queued','sent','failed','seen') NOT NULL DEFAULT 'queued',
        fail_reason VARCHAR(200),
        delivered_at DATETIME(3),
        seen_at DATETIME(3),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        KEY idx_notif_user (user_id, created_at),
        KEY idx_notif_queue (queue_entry_id),
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
          REFERENCES core_users(id) ON DELETE CASCADE,
        CONSTRAINT fk_notif_queue FOREIGN KEY (queue_entry_id)
          REFERENCES catch_queue_entries(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE catch_booth_metrics (
        booth_id CHAR(36) PRIMARY KEY,
        wait_count INT NOT NULL DEFAULT 0,
        avg_service_time_min INT,
        eta_p50 INT,
        eta_p75 INT,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_metrics_booth FOREIGN KEY (booth_id)
          REFERENCES catch_booths(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_sources (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        base_url VARCHAR(500),
        active TINYINT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_results (
        id CHAR(36) PRIMARY KEY,
        source_id CHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        url VARCHAR(1000) NOT NULL,
        url_hash BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(url,256))) STORED,
        summary TEXT,
        category ENUM('news','schedule','contest','career') NOT NULL,
        published_at DATETIME(3),
        crawled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        archived TINYINT NOT NULL DEFAULT 0,
        meta JSON,
        UNIQUE KEY uk_result_url_hash (url_hash),
        KEY idx_result_url_prefix (url(191)),
        KEY idx_result_cat_time (category, published_at),
        KEY idx_result_source (source_id),
        CONSTRAINT fk_result_source FOREIGN KEY (source_id)
          REFERENCES crawl_sources(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_tags (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_result_tags (
        result_id CHAR(36) NOT NULL,
        tag_id CHAR(36) NOT NULL,
        PRIMARY KEY (result_id, tag_id),
        CONSTRAINT fk_rt_result FOREIGN KEY (result_id)
          REFERENCES crawl_results(id) ON DELETE CASCADE,
        CONSTRAINT fk_rt_tag FOREIGN KEY (tag_id)
          REFERENCES crawl_tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_crawl_jobs (
        id CHAR(36) PRIMARY KEY,
        source_id CHAR(36) NOT NULL,
        category ENUM('news','schedule','contest','career') NOT NULL,
        keywords JSON,
        frequency ENUM('realtime','daily','weekly') NOT NULL DEFAULT 'daily',
        last_run_at DATETIME(3),
        created_by CHAR(36),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        KEY idx_job_source (source_id),
        CONSTRAINT fk_job_source FOREIGN KEY (source_id)
          REFERENCES crawl_sources(id) ON DELETE CASCADE,
        CONSTRAINT fk_job_creator FOREIGN KEY (created_by)
          REFERENCES core_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_crawl_runs (
        id CHAR(36) PRIMARY KEY,
        job_id CHAR(36) NOT NULL,
        status ENUM('running','success','failed') NOT NULL,
        stats JSON,
        started_at DATETIME(3),
        finished_at DATETIME(3),
        error TEXT,
        KEY idx_run_job (job_id, started_at),
        CONSTRAINT fk_run_job FOREIGN KEY (job_id)
          REFERENCES crawl_crawl_jobs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE crawl_feed_impressions (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        result_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        context JSON,
        KEY idx_imp_result (result_id, seen_at),
        KEY idx_imp_user (user_id, seen_at),
        CONSTRAINT fk_imp_result FOREIGN KEY (result_id)
          REFERENCES crawl_results(id) ON DELETE CASCADE,
        CONSTRAINT fk_imp_user FOREIGN KEY (user_id)
          REFERENCES core_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_feed_impressions;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_crawl_runs;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_crawl_jobs;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_result_tags;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_tags;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_results;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS crawl_sources;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS catch_booth_metrics;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS catch_notifications;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS catch_qr_tokens;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS catch_checkin_events;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS catch_queue_entries;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS catch_booths;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS core_audit_logs;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS core_payment_records;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS core_auth_accounts;");
    await queryInterface.sequelize.query("DROP TABLE IF EXISTS core_users;");
  }
};
