const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "userData.db"),
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log(`Server running at "http://localhost:3000/"`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API 1 Registering a new user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const searchUserQuery = `SELECT username,password FROM user WHERE username = '${username}';`;
  const userExisting = await db.get(searchUserQuery);

  const hashedPassword = await bcrypt.hash(password, 10);

  if (userExisting !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length > 5) {
      const createUserQuery = `INSERT INTO 
            user(username,name,password,gender,location)
            VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      const createUser = await db.run(createUserQuery);

      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  }
});

// API 2 Login validation..

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const findUserQuery = `SELECT *
        FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(findUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordSame = await bcrypt.compare(password, dbUser.password);

    if (isPasswordSame) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 change password for authenticated user.

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const findUserQuery = `SELECT password FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(findUserQuery);

  const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordValid) {
    if (newPassword.length > 5) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatePasswordQuery = `UPDATE user 
        SET password = '${hashedPassword}' 
        WHERE username='${username}';`;

      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
