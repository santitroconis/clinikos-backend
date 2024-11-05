class Security {
  constructor() {
    this.permissionMethod = new Map();
    // this.loadPermissions(); //esto va a dar error hasta que se termine el componente
  }

  loadPermissions() {
    db.query(/*QUERY PARA TRAER LOS PERMISOS */)
      .then((res) => {
        if (res.rows.length === 0) {
          console.log("No se encontraron permisos.");
        }
        res.rows.forEach((element) => {
          let key =
            element.profile_id +
            "_" +
            element.method_na +
            "_" +
            element.object_na;
          console.log("Cargando permiso para la clave:", key);

          // Guardando el permiso en el Map
          this.permission.set(key, true);
        });
        console.log(this.permission);
      })
      .catch((error) => {
        console.error("Error cargando permisos:", error);
      });
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
