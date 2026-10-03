-- Referans şema: uygulama açılışında IF NOT EXISTS ile oluşturulur.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS polls(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),question TEXT,open INTEGER DEFAULT 1);
 CREATE TABLE IF NOT EXISTS options(id TEXT PRIMARY KEY,poll TEXT REFERENCES polls(id),label TEXT);
 CREATE TABLE IF NOT EXISTS votes(poll TEXT REFERENCES polls(id),voter TEXT REFERENCES users(id),option TEXT REFERENCES options(id),PRIMARY KEY(poll,voter));
