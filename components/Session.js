const argon2 = require("argon2");
const session = require("express-session");
const jwt = require("jsonwebtoken");
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
          maxAge: 1800000,
          secure: false,
          sameSite: true,
        },
      })
    );

    console.log(process.env.SESSION_SECRET);
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

  async createSession(req) {
    const user = await this.verifyUser(req);
    // console.log(user);
    try {
      const token = jwt.sign(
        {
          userId: user.rows[0].user_id,
          username: user.rows[0].username,
          profileId: user.rows[0].profile,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      req.session.token = token;
      req.session.userId = user.rows[0].user_id;

      return { success: true, sessionData: req.session };
    } catch (error) {
      console.error("Login error", error.stack);
      return { success: false, message: error.message };
    } finally {
      console.log(this.sessionExist(req));
    }
  }
}

module.exports = Session;
