-- Vendor-to-category mappings used during automatic categorization.
CREATE TABLE vendor_category_rules (
    id BIGSERIAL PRIMARY KEY,
    normalized_vendor_name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Financial transactions created manually or imported from a CSV file.
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('INCOME', 'EXPENSE')),
    account_name VARCHAR(255),
    vendor_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Uncategorized',
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Query indexes supporting date/category summaries, vendor rankings, and anomaly lists.
CREATE INDEX idx_expenses_occurred_at ON expenses (occurred_at);
CREATE INDEX idx_expenses_category_occurred_at ON expenses (category, occurred_at);
CREATE INDEX idx_expenses_vendor_name ON expenses (vendor_name);
CREATE INDEX idx_expenses_anomalies ON expenses (is_anomaly) WHERE is_anomaly = TRUE;

-- Default categorization rules available immediately after the first migration.
INSERT INTO vendor_category_rules (normalized_vendor_name, category) VALUES
    ('swiggy', 'Food'),
    ('zomato', 'Food'),
    ('uber', 'Transport'),
    ('ola', 'Transport'),
    ('amazon', 'Shopping'),
    ('netflix', 'Entertainment'),
    ('apollo pharmacy', 'Health');
