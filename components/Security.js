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
    let key = `${req.session.profile_id}_${req.body.objectName}_${req.body.methodName}`;
    if (this.permissionMethod.has(key)) {
      return this.permissionMethod.get(key);
    } else {
      return false;
    }
  }

  // exeMethod(jsonData) {}
}

module.exports = Security;
