class Doctors {
  constructor() {}

  async getDoctors(params) {
    const Doctors = await db.query("getDoctors", [params.user_id]);
    return Doctors.rows;
  }
}

module.exports = Menu;
