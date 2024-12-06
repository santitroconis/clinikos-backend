const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
require("dotenv").config();

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
      const res = await client.query(query, params);
      return res;
    } catch (err) {
      console.error(`Error executing query:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  async transaction(queryArray, paramsArray, dependencies = []) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      let results = [];
      for (let i = 0; i < queryArray.length; i++) {
        const query = this.queries[queryArray[i]] || queryArray[i];
        const params = paramsArray[i];
        const res = await client.query(query, params);
        results.push(res);

        if (res.rows[0]) {
          let id = Object.values(res.rows[0])[0];
          dependencies.forEach((dep) => {
            if (dep.sourceIndex === i) {
              const targetParams = paramsArray[dep.targetIndex];
              targetParams[dep.targetParamIndex] = id;
            }
          });
        }
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
