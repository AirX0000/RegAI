-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    document_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    extracted_data TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS ix_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS ix_documents_created_at ON documents(created_at);
