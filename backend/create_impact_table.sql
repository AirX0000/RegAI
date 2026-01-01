-- Create regulation_impacts table manually
CREATE TABLE IF NOT EXISTS regulation_impacts (
    id TEXT PRIMARY KEY,
    regulation_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    impact_score INTEGER,
    summary TEXT,
    action_items TEXT,  -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (regulation_id) REFERENCES regulations(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS ix_regulation_impacts_regulation_id ON regulation_impacts(regulation_id);
CREATE INDEX IF NOT EXISTS ix_regulation_impacts_company_id ON regulation_impacts(company_id);
