class Security {
  constructor() {
    this.permissionMethod = new Map();
    this.loadPermissions();
  }

  async loadPermissions() {
    try {
      const res = await db.query("getPermissions");
      if (res.rows.length === 0) {
        console.log("No permissions found");
      }
      res.rows.forEach((element) => {
        let key =
          element.profile_id +
          "_" +
          element.method_name +
          "_" +
          element.object_name;

        this.permissionMethod.set(key, true);
      });
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
      let boInstance = new BO();
      let method = boInstance[data.methodName];

      if (typeof method === "function") {
        const res = await method.call(boInstance, data.params);
        return res;
      } else {
        throw new Error(
          `Method ${data.methodName} not found in ${data.objectName}`
        );
      }
    } catch (error) {
      console.error("Error executing method:", error);
      return { success: false, message: "Internal server error" };
    }
  }
}

module.exports = Security;
