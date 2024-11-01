const express = require("express");
const cors = require("cors");
const path = require("path");
const argon2 = require("argon2");
const app = express();

const Database = require("./components/Database");
const queries = require("./config/queries.json");
const db = new Database(queries);

const Session = require("./components/Session");
const session = new Session(app, db);

const Security = require("./components/Security");
const security = new Security();

const corsOptions = {
  origin: ["http://localhost:5173", "https://clinikos.pages.dev"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
  res.send("Server is running");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Invalid data");
  }

  if (!session.sessionExist(req)) {
    const result = await session.createSession(req);
    if (result.success) {
      return res.sendFile(path.join(__dirname, "public/home.html"));
    } else {
      return res.status(400).send(result.message);
    }
  } else {
    return res.status(400).send("La sesion ya existe");
  }
});

app.post("/logout", async (req, res) => {
  try {
    if (session.sessionExist(req)) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error al destruir la sesión:", err);
          return res.status(500).send("Error al cerrar la sesión");
        }
        res.sendFile(path.join(__dirname, "public/home.html"));
      });
    } else {
      res.status(400).send("No hay sesión activa");
    }
  } catch (error) {
    console.error("Error en el proceso de cierre de sesión:", error);
    res.status(500).send("Error interno del servidor");
  }
});

app.post("/toProcess", async (req, res) => {});

////////////////////////////////////////////////////////////////////////////

// TESTING /////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////

app.get("/test", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM public.profile");
    res.status(200).send(result.rows);
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    res.status(500).send("Error interno del servidor");
  }
});

app.post("/insert", async (req, res) => {
  const { text } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO public.profile (profile_na, profile_desc) VALUES ($1, $2);",
      [text, text]
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("Error al insertar los datos:", error);
    res.status(500).send("Error interno del servidor");
  }
});

///////////////////////////////////////////////////////////////////////////

app.post("/register", async (req, res) => {
  const {
    documentType,
    documentNu,
    personNa,
    personLna,
    personEml,
    personDir,
    username,
    password,
  } = req.body;

  try {
    const hashedPassword = await argon2.hash(password);
    await db.transaction(
      ["insertDocument", "insertPerson", "insertUser"],
      [
        [documentType, documentNu],
        [personNa, personLna, personEml, personDir, null],
        [username, hashedPassword, null],
      ]
    );

    res.status(200).send("User registered successfully");
  } catch (error) {
    console.error("Error registering user", error);
    res.status(500).send("Internal server error");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
