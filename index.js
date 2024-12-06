const express = require("express");
const cors = require("cors");
const argon2 = require("argon2");

const app = express();
const corsConfig = require("./config/corsConfig");
const ht = require("./config/health.json");

const Database = require("./components/Database");
const queries = require("./config/queries.json");
global.db = new Database(queries);

const Session = require("./components/Session");
const session = new Session(app);

const Security = require("./components/Security");
const security = new Security();

app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
  res.send(ht.healthText);
});

app.post("/register", async (req, res) => {
  const {
    documentType,
    documentNumber,
    firstName,
    lastName,
    email,
    phone,
    address,
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
    const queryArray = ["insertPerson", "insertUser", "insertUserProfile"];
    const paramsArray = [
      [
        documentType,
        documentNumber,
        firstName,
        lastName,
        phone,
        email,
        address,
      ],
      [username, hashedPassword, null],
      [null, profileId],
    ];
    const dependencies = [
      { sourceIndex: 0, targetIndex: 1, targetParamIndex: 2 },
      { sourceIndex: 1, targetIndex: 2, targetParamIndex: 0 },
    ];

    await db.transaction(queryArray, paramsArray, dependencies);

    if (profileId === 2) {
      const doctor = await db.query("getPersonByDocument", [documentNumber]);
      await db.query("insertDoctor", [doctor.rows[0].person_id]);
    }

    await session.createSession(req);

    const menuData = {
      methodName: "getMenuItems",
      objectName: "Menu",
      params: { userProfile: req.session.profileId },
    };

    await security.exeMethod(menuData);

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
      return res.status(200).send(result.sessionData);
    } else {
      return res.status(400).send(result.message);
    }
  } else {
    return res.status(400).send("Session already exists");
  }
});

app.get("/getMenus", async (req, res) => {
  try {
    const menuData = {
      methodName: "getMenus",
      objectName: "Menu",
      params: { userProfile: req.session.profileId },
    };
    const menus = await security.exeMethod(menuData);
    return res.status(200).json({ menus });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/logout", async (req, res) => {
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
    try {
      const result = await security.exeMethod(data);
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error executing method:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else {
    return res
      .status(403)
      .json({ success: false, message: "No tiene permiso." });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
