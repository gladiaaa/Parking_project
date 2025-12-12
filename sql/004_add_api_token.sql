ALTER TABLE users ADD COLUMN api_token VARCHAR(64) NULL AFTER role;
ALTER TABLE users ADD INDEX idx_api_token (api_token);
