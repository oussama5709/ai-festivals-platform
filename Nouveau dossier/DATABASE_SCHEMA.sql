-- AI Events Research Infrastructure
-- PostgreSQL Database Schema v1.0.0

CREATE SCHEMA IF NOT EXISTS ai_events;

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- Raw events (as scraped)
CREATE TABLE ai_events.raw_events (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    raw_data JSONB NOT NULL,
    hash_md5 VARCHAR(32) UNIQUE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT processing_status_enum CHECK (
        processing_status IN ('pending', 'processing', 'processed', 'failed', 'archived')
    )
);
CREATE INDEX idx_raw_events_source ON ai_events.raw_events(source);
CREATE INDEX idx_raw_events_status ON ai_events.raw_events(processing_status);
CREATE INDEX idx_raw_events_scraped_at ON ai_events.raw_events(scraped_at);

-- Processed events (cleaned & normalized)
CREATE TABLE ai_events.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    location_city VARCHAR(100),
    location_country_iso CHAR(3),
    location_raw VARCHAR(500),
    url VARCHAR(2048) UNIQUE,
    source_name VARCHAR(50) NOT NULL,
    source_url VARCHAR(2048),
    event_type VARCHAR(50),
    
    -- Cost information
    is_free BOOLEAN DEFAULT TRUE,
    price_usd DECIMAL(10, 2),
    currency VARCHAR(3),
    
    -- Format
    is_online BOOLEAN DEFAULT FALSE,
    is_hybrid BOOLEAN DEFAULT FALSE,
    
    -- Submission information
    has_cfp BOOLEAN DEFAULT FALSE,
    cfp_status VARCHAR(20),
    submission_deadline DATE,
    submission_fee DECIMAL(10, 2),
    
    -- AI tagging
    ai_relevance_score DECIMAL(3, 2),
    ai_score_components JSONB,
    taxonomy_tags TEXT[],
    
    -- Metadata
    data_quality_score DECIMAL(3, 2),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES ai_events.events(id),
    
    dataset_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT cfp_status_enum CHECK (
        cfp_status IS NULL OR cfp_status IN ('open', 'closed', 'unknown')
    )
);

CREATE INDEX idx_events_country ON ai_events.events(location_country_iso);
CREATE INDEX idx_events_start_date ON ai_events.events(start_date);
CREATE INDEX idx_events_ai_score ON ai_events.events(ai_relevance_score);
CREATE INDEX idx_events_taxonomy ON ai_events.events USING GIN(taxonomy_tags);
CREATE INDEX idx_events_source ON ai_events.events(source_name);
CREATE INDEX idx_events_created ON ai_events.events(created_at);
CREATE INDEX idx_events_url ON ai_events.events(url);

-- ============================================================================
-- 2. DEDUPLICATION & MATCHING
-- ============================================================================

CREATE TABLE ai_events.dedup_candidates (
    id SERIAL PRIMARY KEY,
    event_id_1 UUID NOT NULL REFERENCES ai_events.events(id),
    event_id_2 UUID NOT NULL REFERENCES ai_events.events(id),
    similarity_score DECIMAL(3, 2),
    match_type VARCHAR(50),
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_match CHECK (event_id_1 != event_id_2)
);

CREATE INDEX idx_dedup_event_1 ON ai_events.dedup_candidates(event_id_1);
CREATE INDEX idx_dedup_event_2 ON ai_events.dedup_candidates(event_id_2);
CREATE INDEX idx_dedup_score ON ai_events.dedup_candidates(similarity_score);

-- ============================================================================
-- 3. TAXONOMY & CLASSIFICATION
-- ============================================================================

CREATE TABLE ai_events.taxonomy_terms (
    id SERIAL PRIMARY KEY,
    term VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_events.taxonomy_terms (term, category, description) VALUES
    ('AI', 'field', 'Artificial Intelligence'),
    ('Machine Learning', 'field', 'Machine Learning'),
    ('Deep Learning', 'field', 'Deep Learning'),
    ('Robotics', 'field', 'Robotics & Autonomous Systems'),
    ('GenAI', 'field', 'Generative AI'),
    ('LLM', 'field', 'Large Language Models'),
    ('Computer Vision', 'field', 'Computer Vision'),
    ('NLP', 'field', 'Natural Language Processing'),
    ('Ethics', 'focus', 'AI Ethics & Safety'),
    ('Film', 'domain', 'Film & AI'),
    ('Healthcare', 'domain', 'Healthcare AI'),
    ('Finance', 'domain', 'Finance & AI'),
    ('Education', 'domain', 'Education'),
    ('Data Science', 'field', 'Data Science'),
    ('Research', 'type', 'Research-oriented'),
    ('Industry', 'type', 'Industry-focused'),
    ('Academic', 'type', 'Academic');

-- ============================================================================
-- 4. SNAPSHOTS & VERSIONING
-- ============================================================================

CREATE TABLE ai_events.dataset_snapshots (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_count INT NOT NULL,
    metadata JSONB,
    file_size_bytes BIGINT,
    s3_path VARCHAR(500),
    is_latest BOOLEAN DEFAULT FALSE,
    description TEXT
);

CREATE INDEX idx_snapshots_version ON ai_events.dataset_snapshots(version);
CREATE INDEX idx_snapshots_created ON ai_events.dataset_snapshots(created_at);

-- ============================================================================
-- 5. USER SUBMISSIONS & MODERATION
-- ============================================================================

CREATE TABLE ai_events.user_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_data JSONB NOT NULL,
    submitter_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    moderation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT status_enum CHECK (
        status IN ('pending', 'approved', 'rejected', 'under_review')
    )
);

CREATE INDEX idx_submissions_status ON ai_events.user_submissions(status);
CREATE INDEX idx_submissions_created ON ai_events.user_submissions(created_at);

-- ============================================================================
-- 6. HISTORICAL ARCHIVE
-- ============================================================================

CREATE TABLE ai_events.event_history (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES ai_events.events(id),
    change_type VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT change_type_enum CHECK (
        change_type IN ('created', 'updated', 'deleted', 'merged', 'deduplicated')
    )
);

CREATE INDEX idx_history_event ON ai_events.event_history(event_id);
CREATE INDEX idx_history_date ON ai_events.event_history(changed_at);

-- ============================================================================
-- 7. MONITORING & METRICS
-- ============================================================================

CREATE TABLE ai_events.scrape_runs (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL,
    events_found INT,
    events_processed INT,
    errors_count INT,
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT status_enum CHECK (status IN ('pending', 'running', 'success', 'failed'))
);

CREATE INDEX idx_scrape_runs_source ON ai_events.scrape_runs(source_name);
CREATE INDEX idx_scrape_runs_status ON ai_events.scrape_runs(status);
CREATE INDEX idx_scrape_runs_date ON ai_events.scrape_runs(created_at);

CREATE TABLE ai_events.api_metrics (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT,
    response_time_ms INT,
    request_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_endpoint ON ai_events.api_metrics(endpoint);
CREATE INDEX idx_metrics_date ON ai_events.api_metrics(created_at);

-- ============================================================================
-- 8. ADMIN & CONFIGURATION
-- ============================================================================

CREATE TABLE ai_events.system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    data_type VARCHAR(20),
    description TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_events.system_config (config_key, config_value, data_type, description) VALUES
    ('dataset_version', '1.0.0', 'string', 'Current dataset version'),
    ('ai_score_threshold', '0.5', 'float', 'Minimum AI relevance score'),
    ('dedup_similarity_threshold', '0.85', 'float', 'Deduplication similarity threshold'),
    ('max_events_per_run', '10000', 'integer', 'Max events per crawler run'),
    ('data_retention_days', '730', 'integer', 'How long to keep raw data');

-- ============================================================================
-- 9. VIEWS FOR PUBLIC API
-- ============================================================================

CREATE VIEW ai_events.events_public AS
SELECT
    id,
    title,
    description,
    start_date,
    end_date,
    location_city,
    location_country_iso,
    url,
    source_name,
    event_type,
    is_free,
    is_online,
    has_cfp,
    cfp_status,
    submission_deadline,
    ai_relevance_score,
    taxonomy_tags,
    created_at
FROM ai_events.events
WHERE is_duplicate = FALSE
ORDER BY start_date DESC;

CREATE VIEW ai_events.upcoming_events AS
SELECT *
FROM ai_events.events_public
WHERE start_date >= CURRENT_DATE
AND start_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY start_date ASC;

CREATE VIEW ai_events.open_cfp_events AS
SELECT *
FROM ai_events.events_public
WHERE has_cfp = TRUE
AND cfp_status = 'open'
AND submission_deadline >= CURRENT_DATE
ORDER BY submission_deadline ASC;

-- ============================================================================
-- 10. UTILITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION ai_events.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON ai_events.events
FOR EACH ROW
EXECUTE FUNCTION ai_events.update_updated_at();

CREATE OR REPLACE FUNCTION ai_events.count_events_by_country()
RETURNS TABLE(country_iso CHAR(3), event_count BIGINT) AS $$
SELECT location_country_iso, COUNT(*) as event_count
FROM ai_events.events
WHERE is_duplicate = FALSE
GROUP BY location_country_iso
ORDER BY event_count DESC;
$$ LANGUAGE SQL;

-- ============================================================================
-- 11. GRANTS (for security)
-- ============================================================================

-- Create application role
DO $$
BEGIN
    CREATE ROLE ai_events_app LOGIN PASSWORD 'CHANGEME';
EXCEPTION WHEN OTHERS THEN
    NULL;
END
$$;

GRANT USAGE ON SCHEMA ai_events TO ai_events_app;
GRANT SELECT ON ALL TABLES IN SCHEMA ai_events TO ai_events_app;
GRANT INSERT, UPDATE ON ai_events.events TO ai_events_app;
GRANT INSERT ON ai_events.raw_events TO ai_events_app;
GRANT INSERT ON ai_events.user_submissions TO ai_events_app;
GRANT INSERT ON ai_events.scrape_runs TO ai_events_app;

-- ============================================================================
-- MIGRATION VERSION
-- ============================================================================

CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY,
    dirty BOOLEAN NOT NULL
);

INSERT INTO schema_migrations (version, dirty) VALUES (1, FALSE);

-- EOF: schema.sql v1.0.0
