class Appointment {
  constructor() {}

  async createAppointment(params) {
    try {
      const person = await db.query("getPersonByDocument", [
        params.document_number,
      ]);

      if (person.rows.length === 0) {
        return { success: false, message: "Person not found" };
      }

      const result = await db.query("createAppointment", [
        params.hour,
        params.date,
        person.rows[0].person_id,
        params.department,
      ]);

      if (result.rowCount > 0) {
        return { success: true, message: "Appointment created successfully" };
      } else {
        return { success: false, message: "Failed to create appointment" };
      }
    } catch (error) {
      console.error("Error:", error);
      return { success: false, message: "Internal server error" };
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
