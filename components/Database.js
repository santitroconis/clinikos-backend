const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");

class Database {
  constructor(queries) {
    if (!Database.instance) {
      this.initializePool();
      this.queries = queries;
      Database.instance = this;
      Object.freeze(Database.instance);
    }
    return Database.instance;
  }

  initializePool() {
    this.pool = new Pool(dbConfig);
  }

  async query(queryName, params) {
    const client = await this.pool.connect();
    try {
      const query = this.queries[queryName] || queryName;
      res = await client.query(query, params);
      return res;
    } catch (err) {
      console.error(`Error executing query:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  async transaction(queryArray, paramsArray) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      let results = [];
      for (let i = 0; i < queryArray.length; i++) {
        const query = this.queries[queryArray[i]] || queryArray[i];
        const params = paramsArray[i];
        console.log(`Ejecutando consulta: ${query}`);
        console.log(`Con parámetros: ${JSON.stringify(params)}`);
        const res = await client.query(query, params);
        results.push(res);
      }
      await client.query("COMMIT");
      return results;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Error executing transaction:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = Database;
