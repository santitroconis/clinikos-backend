/*eslint-disable*/
import express from "express";
import path from "path";
import argon2 from "argon2";
import { fileURLToPath } from "url";
const app = express();

import Database from "./components/Database";
import queries from "./config/queries.json";
const db = new Database(queries);

import Session from "./components/Session";
const session = new Session(app, db);

import Security from "./components/Security";
const security = new Security();

//

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
  res.send("Server is running");
});
//

app.get("/signup", (req, res) => {
  res.send(response);
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

app.post("/register", async (req, res) => {
  const {
    documentType,
    documentNumber,
    name,
    lastname,
    email,
    address,
    username,
    password,
  } = req.body;

  if (
    !username ||
    !password ||
    !documentType ||
    !documentNumber ||
    !name ||
    !lastname ||
    !email
  ) {
    return res.status(400).send("Invalid data");
  }

  try {
    const checkUser = await db.query("checkUser", [username]);

    if (checkUser.rows.length) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await argon2.hash(password);
    await db.query("register", [
      documentType,
      documentNumber,
      name,
      lastname,
      email,
      address,
      username,
      hashedPassword,
    ]);

    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Error registering user", error.stack);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
