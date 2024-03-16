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
  const searchUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userExisting = await db.get(searchUserQuery);

  const hashedPassword = await bcrypt.hash(password, 10);

  if (userExisting === undefined) {
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
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

module.exports = app;
