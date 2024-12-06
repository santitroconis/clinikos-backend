class Patients {
  constructor() {}

  async getDoctorPatients(params) {
    const Patients = await db.query("getDoctorPatients", [params.doctor_id]);
    return Patients.rows;
  }
}

module.exports = Menu;
