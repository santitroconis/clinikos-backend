class Security {
  constructor(db) {
    this.db = db;
    this.permissionMethod = new Map();
    this.loadPermissions();
  }

  async loadPermissions() {
    try {
      const res = await this.db.query("getPermissions");
      if (res.rows.length === 0) {
        console.log("No permissions found");
      }
      res.rows.forEach((element) => {
        let key =
          element.profile_id +
          "_" +
          element.method_na +
          "_" +
          element.object_na;
        console.log("Loading permission for key:", key);

        this.permissionMethod.set(key, true);
      });
      console.log(this.permissionMethod);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  hasPermission(req) {
    let key = `${req.userProfile}_${req.methodName}_${req.objectName}`;
    if (this.permissionMethod.has(key)) {
      return this.permissionMethod.get(key);
    } else {
      return false;
    }
  }

  async exeMethod(data) {
    try {
      let BO = require(`../Business/${data.objectName}`);
      let boInstance = new BO(this.db);
      let method = boInstance[data.methodName];

      if (typeof method === "function") {
        return await method.call(boInstance, data.params);
      } else {
        throw new Error(
          `Method ${data.methodName} not found in ${data.objectName}`
        );
      }
    } catch (error) {
      console.error("Error executing method:", error);
      throw error;
    }
  }
}

module.exports = Security;
