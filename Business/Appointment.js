class Appointment {
  constructor(db) {
    this.db = db;
  }

  async createAppointment(params) {
    console.log("Creating appointment with params:", params);
  }
}

module.exports = Appointment;
