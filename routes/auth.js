var express = require("express");
const jwt = require("jsonwebtoken");
var router = express.Router();
const connection = require("../database/connection");
const { hashPassword, comparePassword } = require("../helper/hashPassword");
const { FileUpload } = require("../libraries/FileUpload");

const fileUploadObj = new FileUpload();

// Sign up 
router.post("/signup", async function (req, res, next) {
  try {

    // Validate required fields
    const requiredFields = ["name", "phone", "email", "password", "user_type"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }


    if (req.body.user_type != "1" && req.body.user_type != "2") {
      return res.status(400).json({ message: `User type should be 1 or 2` });
    }

        // Retrieve user from the database
        const selectQuery = "SELECT * FROM users WHERE email = ?";
        connection.query(selectQuery, [req.body.email], async (error, results, fields) => {
          if (error) {
            return res.status(500).json({ error: "Internal Server Error" });
          }

          if (results.length > 0) {
            return res.status(400).json({ error: `Email exist` });
          }
        });

    if (!req.files.image) {
      return res.status(400).json({ error: `Please select image first` });
    }

    const userData = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      user_type: req.body.user_type,
      password: await hashPassword(req.body.password),
    };

    let imageUploadingPath = "users"
    // upload cover image
    let imgUploaded = await fileUploadObj.uploadFile(
      req.files.image,
      imageUploadingPath
    );

    // Insert data into the users table
    const insertQuery =
      "INSERT INTO users (name, phone, email, user_type, image, password) VALUES (?, ?, ?, ?, ?, ?)";

    connection.query(
      insertQuery,
      [userData.name, userData.phone, userData.email, userData.user_type, imgUploaded.name, userData.password],
      (error, results, fields) => {
        if (error) {
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }

        const token = jwt.sign(
          {
            data: { id: results.insertId, email: req.body.email, user_type: req.body.user_type },
          },
          "aaaabbbbcccc",
          { expiresIn: "1h" }
        );

        const data = {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          image: `${process.env.ASSETS_URL_BASE}uploads/users/${imgUploaded.name}`,
          token: token
        }

        res
          .status(201)
          .json({ message: "User registered successfully", data });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Login route
router.post("/login", async function (req, res, next) {
  try {
    // Validate required fields
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Retrieve user from the database
    const selectQuery = "SELECT id, name, email, phone, user_type, image, password FROM users WHERE email = ?";
    connection.query(selectQuery, [email], async (error, results, fields) => {
      if (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];

      // Compare passwords
      const passwordMatch = await comparePassword(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          data: { id: user.id, email: user.email, user_type: results[0].user_type },
        },
        "aaaabbbbcccc",
        { expiresIn: "1h" }
      );

      const data = {
        name: results[0].name,
        email: results[0].email,
        phone: results[0].phone,
        image: `${process.env.ASSETS_URL_BASE}uploads/users/${results[0].image}`,
        token: token
      }

      res.status(200).json({ message: "Login successful", data });
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
