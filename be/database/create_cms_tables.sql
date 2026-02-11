-- CMS Tables for Landing Pages
-- Each page gets its own table: tbl_cms_{pagename}

-- Main CMS Images table (stores all images as BLOB)
CREATE TABLE
IF
  NOT EXISTS tbl_cms_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY
    , page_name VARCHAR(100) NOT NULL
    , field_name VARCHAR(100) NOT NULL
    , image_blob LONGBLOB NOT NULL
    , mime_type VARCHAR(50) DEFAULT 'image/jpeg'
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
      , INDEX idx_page_field (page_name, field_name)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

  -- Header CMS Table
  CREATE TABLE
  IF
    NOT EXISTS tbl_cms_header (
      id INT AUTO_INCREMENT PRIMARY KEY
      , page_name VARCHAR(50) DEFAULT 'header' UNIQUE
      , content_json JSON
      , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON
      UPDATE
        CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

    -- Home CMS Table
    CREATE TABLE
    IF
      NOT EXISTS tbl_cms_home (
        id INT AUTO_INCREMENT PRIMARY KEY
        , page_name VARCHAR(50) DEFAULT 'home' UNIQUE
        , content_json JSON
        , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON
        UPDATE
          CURRENT_TIMESTAMP
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

      -- About CMS Table
      CREATE TABLE
      IF
        NOT EXISTS tbl_cms_about (
          id INT AUTO_INCREMENT PRIMARY KEY
          , page_name VARCHAR(50) DEFAULT 'about' UNIQUE
          , content_json JSON
          , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON
          UPDATE
            CURRENT_TIMESTAMP
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

        -- ImNew CMS Table
        CREATE TABLE
        IF
          NOT EXISTS tbl_cms_imnew (
            id INT AUTO_INCREMENT PRIMARY KEY
            , page_name VARCHAR(50) DEFAULT 'imnew' UNIQUE
            , content_json JSON
            , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON
            UPDATE
              CURRENT_TIMESTAMP
          ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

          -- Services CMS Table
          CREATE TABLE
          IF
            NOT EXISTS tbl_cms_services (
              id INT AUTO_INCREMENT PRIMARY KEY
              , page_name VARCHAR(50) DEFAULT 'services' UNIQUE
              , content_json JSON
              , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ON
              UPDATE
                CURRENT_TIMESTAMP
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

            -- Events CMS Table
            CREATE TABLE
            IF
              NOT EXISTS tbl_cms_events (
                id INT AUTO_INCREMENT PRIMARY KEY
                , page_name VARCHAR(50) DEFAULT 'events' UNIQUE
                , content_json JSON
                , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON
                UPDATE
                  CURRENT_TIMESTAMP
              ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

              -- Past Events CMS Table
              CREATE TABLE
              IF
                NOT EXISTS tbl_cms_pastevents (
                  id INT AUTO_INCREMENT PRIMARY KEY
                  , page_name VARCHAR(50) DEFAULT 'pastevents' UNIQUE
                  , content_json JSON
                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  ON
                  UPDATE
                    CURRENT_TIMESTAMP
                ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                -- Give CMS Table
                CREATE TABLE
                IF
                  NOT EXISTS tbl_cms_give (
                    id INT AUTO_INCREMENT PRIMARY KEY
                    , page_name VARCHAR(50) DEFAULT 'give' UNIQUE
                    , content_json JSON
                    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON
                    UPDATE
                      CURRENT_TIMESTAMP
                  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                  -- Footer CMS Table
                  CREATE TABLE
                  IF
                    NOT EXISTS tbl_cms_footer (
                      id INT AUTO_INCREMENT PRIMARY KEY
                      , page_name VARCHAR(50) DEFAULT 'footer' UNIQUE
                      , content_json JSON
                      , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON
                      UPDATE
                        CURRENT_TIMESTAMP
                    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                    -- PlanVisit CMS Table
                    CREATE TABLE
                    IF
                      NOT EXISTS tbl_cms_planvisit (
                        id INT AUTO_INCREMENT PRIMARY KEY
                        , page_name VARCHAR(50) DEFAULT 'planvisit' UNIQUE
                        , content_json JSON
                        , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        ON
                        UPDATE
                          CURRENT_TIMESTAMP
                      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                      -- WaterBaptism CMS Table
                      CREATE TABLE
                      IF
                        NOT EXISTS tbl_cms_waterbaptism (
                          id INT AUTO_INCREMENT PRIMARY KEY
                          , page_name VARCHAR(50) DEFAULT 'waterbaptism' UNIQUE
                          , content_json JSON
                          , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                          , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                          ON
                          UPDATE
                            CURRENT_TIMESTAMP
                        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                        -- BurialService CMS Table
                        CREATE TABLE
                        IF
                          NOT EXISTS tbl_cms_burialservice (
                            id INT AUTO_INCREMENT PRIMARY KEY
                            , page_name VARCHAR(50) DEFAULT 'burialservice' UNIQUE
                            , content_json JSON
                            , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            ON
                            UPDATE
                              CURRENT_TIMESTAMP
                          ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                          -- MarriageService CMS Table
                          CREATE TABLE
                          IF
                            NOT EXISTS tbl_cms_marriageservice (
                              id INT AUTO_INCREMENT PRIMARY KEY
                              , page_name VARCHAR(50) DEFAULT 'marriageservice' UNIQUE
                              , content_json JSON
                              , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                              , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                              ON
                              UPDATE
                                CURRENT_TIMESTAMP
                            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                            -- ChildDedication CMS Table
                            CREATE TABLE
                            IF
                              NOT EXISTS tbl_cms_childdedication (
                                id INT AUTO_INCREMENT PRIMARY KEY
                                , page_name VARCHAR(50) DEFAULT 'childdedication' UNIQUE
                                , content_json JSON
                                , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                ON
                                UPDATE
                                  CURRENT_TIMESTAMP
                              ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                              -- Sermons CMS Table
                              CREATE TABLE
                              IF
                                NOT EXISTS tbl_cms_sermons (
                                  id INT AUTO_INCREMENT PRIMARY KEY
                                  , page_name VARCHAR(50) DEFAULT 'sermons' UNIQUE
                                  , content_json JSON
                                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                  ON
                                  UPDATE
                                    CURRENT_TIMESTAMP
                                ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                -- YoungPeople CMS Table
                                CREATE TABLE
                                IF
                                  NOT EXISTS tbl_cms_youngpeople (
                                    id INT AUTO_INCREMENT PRIMARY KEY
                                    , page_name VARCHAR(50) DEFAULT 'youngpeople' UNIQUE
                                    , content_json JSON
                                    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                    ON
                                    UPDATE
                                      CURRENT_TIMESTAMP
                                  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                  -- Ministries CMS Table (missing in some deployments)
                                  CREATE TABLE
                                  IF
                                    NOT EXISTS tbl_cms_ministries (
                                      id INT AUTO_INCREMENT PRIMARY KEY
                                      , page_name VARCHAR(50) DEFAULT 'ministries' UNIQUE
                                      , content_json JSON
                                      , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                      , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                      ON
                                      UPDATE
                                        CURRENT_TIMESTAMP
                                    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                    -- AdultMen CMS Table
                                    CREATE TABLE
                                    IF
                                      NOT EXISTS tbl_cms_adultmen (
                                        id INT AUTO_INCREMENT PRIMARY KEY
                                        , page_name VARCHAR(50) DEFAULT 'adultmen' UNIQUE
                                        , content_json JSON
                                        , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                        , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                        ON
                                        UPDATE
                                          CURRENT_TIMESTAMP
                                      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                      -- AdultLadies CMS Table
                                      CREATE TABLE
                                      IF
                                        NOT EXISTS tbl_cms_adultladies (
                                          id INT AUTO_INCREMENT PRIMARY KEY
                                          , page_name VARCHAR(50) DEFAULT 'adultladies' UNIQUE
                                          , content_json JSON
                                          , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                          , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                          ON
                                          UPDATE
                                            CURRENT_TIMESTAMP
                                        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                        -- LearnMoreMinistry CMS Table
                                        CREATE TABLE
                                        IF
                                          NOT EXISTS tbl_cms_learnmoreministry (
                                            id INT AUTO_INCREMENT PRIMARY KEY
                                            , page_name VARCHAR(50) DEFAULT 'learnmoreministry' UNIQUE
                                            , content_json JSON
                                            , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                            , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                            ON
                                            UPDATE
                                              CURRENT_TIMESTAMP
                                          ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                          -- LearnMoreEvents CMS Table
                                          CREATE TABLE
                                          IF
                                            NOT EXISTS tbl_cms_learnmoreevents (
                                              id INT AUTO_INCREMENT PRIMARY KEY
                                              , page_name VARCHAR(50) DEFAULT 'learnmoreevents' UNIQUE
                                              , content_json JSON
                                              , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                              , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                              ON
                                              UPDATE
                                                CURRENT_TIMESTAMP
                                            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                            -- AcceptJesus CMS Table
                                            CREATE TABLE
                                            IF
                                              NOT EXISTS tbl_cms_acceptjesus (
                                                id INT AUTO_INCREMENT PRIMARY KEY
                                                , page_name VARCHAR(50) DEFAULT 'acceptjesus' UNIQUE
                                                , content_json JSON
                                                , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                ON
                                                UPDATE
                                                  CURRENT_TIMESTAMP
                                              ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                              -- Belief CMS Table
                                              CREATE TABLE
                                              IF
                                                NOT EXISTS tbl_cms_belief (
                                                  id INT AUTO_INCREMENT PRIMARY KEY
                                                  , page_name VARCHAR(50) DEFAULT 'belief' UNIQUE
                                                  , content_json JSON
                                                  , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                  , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                  ON
                                                  UPDATE
                                                    CURRENT_TIMESTAMP
                                                ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                                -- ChurchLeader CMS Table
                                                CREATE TABLE
                                                IF
                                                  NOT EXISTS tbl_cms_churchleader (
                                                    id INT AUTO_INCREMENT PRIMARY KEY
                                                    , page_name VARCHAR(50) DEFAULT 'churchleader' UNIQUE
                                                    , content_json JSON
                                                    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                    ON
                                                    UPDATE
                                                      CURRENT_TIMESTAMP
                                                  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                                  -- DepartmentOfficer CMS Table
                                                  CREATE TABLE
                                                  IF
                                                    NOT EXISTS tbl_cms_departmentofficer (
                                                      id INT AUTO_INCREMENT PRIMARY KEY
                                                      , page_name VARCHAR(50) DEFAULT 'departmentofficer' UNIQUE
                                                      , content_json JSON
                                                      , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                      , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                      ON
                                                      UPDATE
                                                        CURRENT_TIMESTAMP
                                                    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

                                                    -- OurStory CMS Table
                                                    CREATE TABLE
                                                    IF
                                                      NOT EXISTS tbl_cms_ourstory (
                                                        id INT AUTO_INCREMENT PRIMARY KEY
                                                        , page_name VARCHAR(50) DEFAULT 'ourstory' UNIQUE
                                                        , content_json JSON
                                                        , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                        , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                                        ON
                                                        UPDATE
                                                          CURRENT_TIMESTAMP
                                                      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;