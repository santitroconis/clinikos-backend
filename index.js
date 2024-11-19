const express = require("express");
const cors = require("cors");
const argon2 = require("argon2");

const app = express();
const corsConfig = require("./config/corsConfig");
const path = require("path");
const ht = require("./config/health.json");

const Database = require("./components/Database");
const queries = require("./config/queries.json");
const db = new Database(queries);

const Session = require("./components/Session");
const session = new Session(app, db);

const Security = require("./components/Security");
const security = new Security(db);

app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
  res.send(ht.healthText);
});

app.post("/register", async (req, res) => {
  const {
    documentType,
    documentNu,
    personNa,
    personLna,
    personPho,
    personEml,
    personDir,
    username,
    password,
    profileId,
  } = req.body;

  try {
    const checkUser = await db.query("checkUser", [username]);

    if (checkUser.rows.length) {
      return res.status(400).send("User already exists");
    }
    const hashedPassword = await argon2.hash(password);
    await db.transaction(
      ["insertDocument", "insertPerson", "insertUser", "insertUserProfile"],
      [
        [documentType, documentNu],
        [personNa, personLna, personPho, personEml, personDir, null],
        [username, hashedPassword, null],
        [null, profileId],
      ],
      [
        { sourceIndex: 0, targetIndex: 1, targetParamIndex: 5 },
        { sourceIndex: 1, targetIndex: 2, targetParamIndex: 2 },
        { sourceIndex: 2, targetIndex: 3, targetParamIndex: 0 },
      ]
    );

    await session.createSession(req);
    await session.sessionExist(req);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error registering user", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Invalid data");
  }

  if (!session.sessionExist(req)) {
    const result = await session.createSession(req);
    if (result.success) {
      return res.sendStatus(200);
    } else {
      return res.status(400).send(result.message);
    }
  } else {
    return res.status(400).send("Session already exists");
  }
});

app.post("/logout", async (req, res) => {
  console.log("Log out request");
  console.log(req.session);
  console.log("");

  console.log("session exists", session.sessionExist(req));
  try {
    if (session.sessionExist(req)) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).send("Log out error");
        }
        res.sendStatus(200);
      });
    } else {
      res.status(400).send("No active session");
    }
  } catch (error) {
    console.error("Log out error:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/toProcess", async (req, res) => {
  if (!session.sessionExist(req)) {
    return res.status(401).send("Sign in required");
  }

  const data = {
    userProfile: req.session.profileId,
    methodName: req.body.methodName,
    objectName: req.body.objectName,
    params: req.body.params,
  };

  if (security.hasPermission(data)) {
    security.exeMethod(data);
  } else {
    return res.status(403).send({ msg: "No tiene permiso." });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
