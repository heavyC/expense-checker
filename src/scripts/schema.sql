-- Prompt templates; editable via admin UI.
-- Only one row per name may have is_active = TRUE.
CREATE TABLE prompts (
    id          SERIAL      PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    body        TEXT         NOT NULL,
    description TEXT,
    version     INTEGER      NOT NULL DEFAULT 1,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- Raw expense submissions (from manual entry or parse_receipt()).
CREATE TABLE expenses (
    id               SERIAL         PRIMARY KEY,
    amount           NUMERIC(10, 2) NOT NULL,
    category         VARCHAR(50)    NOT NULL,
    vendor           VARCHAR(255)   NOT NULL,
    description      TEXT,
    charge_to_client BOOLEAN        NOT NULL DEFAULT FALSE,
    receipt_accuracy NUMERIC(4, 3),   -- NULL when expense is entered manually
    submitted_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- Compliance analysis output produced by analyzeExpense() in compliance.py.
CREATE TABLE expense_analyses (
    id               SERIAL        PRIMARY KEY,
    expense_id       INTEGER       NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    verdict          VARCHAR(20)   NOT NULL CHECK (verdict IN ('APPROVED', 'FLAGGED', 'MANUAL_REVIEW')),
    reasoning        TEXT          NOT NULL,
    policy_citations JSONB         NOT NULL DEFAULT '[]',
    confidence       NUMERIC(4, 3) NOT NULL,
    policy_excerpts  JSONB         NOT NULL DEFAULT '[]',
    prompt_id        INTEGER       REFERENCES prompts(id),
    model            VARCHAR(100)  NOT NULL,
    analyzed_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
