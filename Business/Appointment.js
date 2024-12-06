class Appointment {
  constructor() {}

  async createAppointment(params) {
    try {
      const person = await db.query("getPersonByDocument", [
        params.document_number,
      ]);

      const result = await db.query("createAppointment", [
        params.hour,
        params.date,
        person.rows[0].person_id,
        params.department,
      ]);

      console.log(result);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async getAppointment(params) {
    console.log("Getting appointment with params:", params);
  }

  async updateAppointment(params) {
    console.log("Updating appointment with params:", params);
  }

  async deleteAppointment(params) {
    console.log("Deleting appointment with params:", params);
  }
}

module.exports = Appointment;
