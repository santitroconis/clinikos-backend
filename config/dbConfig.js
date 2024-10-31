module.exports = {
  dbConfig: {
    user: "postgres",
    host: "localhost",
    password: "postgres",
    database: "test",
    port: 5432,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500,
  },
};
