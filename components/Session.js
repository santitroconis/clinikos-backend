const argon2 = require("argon2");
const session = require("express-session");
require("dotenv").config();

class Session {
  constructor(app) {
    this.argon2 = argon2;
    this.session = session;
    app.use(
      this.session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
          httpOnly: true,
          maxAge: 1800000,
          secure: false,
          sameSite: true,
        },
      })
    );
  }

  sessionExist(req) {
    return req.session && req.session.userId ? true : false;
  }

  async verifyUser(req) {
    const { username, password } = req.body;
    try {
      const user = await db.query("login", [username]);

      if (!user.rows.length) {
        return { success: false, message: "Invalid Data" };
      }

      const validPassword = await this.argon2.verify(
        user.rows[0].password,
        password
      );
      if (!validPassword) {
        return { success: false, message: "Invalid Data" };
      }
      return user;
    } catch (error) {
      console.error("Login error", error.stack);
      return { success: false, message: "Internal Server Error" };
    }
  }

  async createSession(req, res) {
    const user = await this.verifyUser(req);
    try {
      req.session.userId = user.rows[0].user_id;
      req.session.username = user.rows[0].username;
      req.session.profileId = user.rows[0].profile_id;

      return {
        success: true,
        sessionData: req.session,
      };
    } catch (error) {
      console.error("Login error", error.stack);
      return { success: false, message: error.message };
    }
  }
}

module.exports = Session;
