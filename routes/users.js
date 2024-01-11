var express = require("express");
const jwt = require("jsonwebtoken");
var router = express.Router();
const connection = require("./../database/connection");
const { verifyToken } = require("../middlewere/jwtVarifyToken");
const { checkUserType } = require("../middlewere/checkUserType");

/* GET users listing. */
router.post("/user-list", verifyToken, checkUserType,  function (req, res, next) {
  try {
    let page_no = "";

    if (isNaN(parseInt(req.body.page_no))) {
      page_no = 1;
    } else if (req.body.page_no <= 0) {
      page_no = 1;
    } else {
      page_no = parseInt(req.body.page_no);
    }

    const limit = 10;
    const offset = page_no * 10 - 10;

    // Retrieve user from the database
    const selectQuery = `
    SELECT
      id,
      name,
      email,
      phone,
      user_type,
      CASE
        WHEN image IS NULL THEN NULL
        ELSE CONCAT('${process.env.ASSETS_URL_BASE}uploads/users/', image)
      END AS image,
      status
    FROM
      users
    WHERE
      user_type = 2
    LIMIT ${limit}
    OFFSET ${offset}`;

    connection.query(selectQuery, async (error, results, fields) => {
      if (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length > 0) {
        res
          .status(200)
          .json({ message: "User list successfully displayed", data: results });
      } else {
        return res.status(400).json({ error: "Data not found" });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user
router.put("/update-user", verifyToken, checkUserType, function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["user_id", "name", "phone", "email"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let userId = 0;
    //Checking for the valid user id
    if (isNaN(parseInt(req.body.user_id))) {
      userId = 0;
    } else {
      userId = req.body.user_id;
    }

    // Make an update query
    const updateQuery =
      "UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ? and user_type = 2";

    connection.query(
      updateQuery,
      [req.body.name, req.body.phone, req.body.email, userId],
      (error, results, fields) => {
        if (error) {
          return res.status(500).json({ error: "Internal Server Error" });
        }

        if (results.affectedRows == 1) {
          return res.status(200).json({ message: `User updated successfully` });
        } else {
          return res.status(400).json({ error: `Can't update data` });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update user
router.delete("/delete-user", verifyToken, checkUserType, function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["user_id"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let userId = 0;
    //Checking for the valid user id
    if (isNaN(parseInt(req.body.user_id))) {
      userId = 0;
    } else {
      userId = req.body.user_id;
    }

    const deleteQuery = "DELETE FROM users WHERE id = ? and user_type = 2";

    connection.query(deleteQuery, [userId], (error, results, fields) => {
      // Your callback logic here
      if (error) {
        console.error("Error deleting user:", error);
      }

      if (results.affectedRows == 1) {
        return res.status(200).json({ message: `User deleted successfully` });
      } else {
        return res.status(400).json({ error: `Can't delete data` });
      }``
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Details
router.get("/user-details/:user_id", verifyToken, checkUserType, function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["user_id"];
    for (const field of requiredFields) {
      if (!req.params[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let userId = 0;
    //Checking for the valid user id
    if (isNaN(parseInt(req.params.user_id))) {
      userId = 0;
    } else {
      userId = req.params.user_id;
    }

    const detailQuery = `SELECT
      id,
      name,
      email,
      phone,
      user_type,
      CASE
        WHEN image IS NULL THEN NULL
        ELSE CONCAT('${process.env.ASSETS_URL_BASE}uploads/users/', image)
      END AS image,
      status
    FROM
      users
    WHERE
      id = ?`;

    connection.query(detailQuery, [userId], (error, results, fields) => {
      // Your callback logic here
      if (error) {
        console.error("Error deleting user:", error);
      }

      if (results.length > 0) {
        return res.status(200).json({
          message: `User details successfully displayed`,
          data: results[0],
        });
      } else {
        return res.status(400).json({ error: `Record not found` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User status change
router.get("/user-status/:user_id", verifyToken, checkUserType, async function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["user_id"];
    for (const field of requiredFields) {
      if (!req.params[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let userId = 0;
    //Checking for the valid user id
    if (isNaN(parseInt(req.params.user_id))) {
      userId = 0;
    } else {
      userId = req.params.user_id;
    }
    // Retrieve user from the database
    const selectQuery = "SELECT * FROM users WHERE id = ?";
    connection.query(selectQuery, [userId], async (error, results, fields) => {
      if (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const stautsNow = results[0].status;
   
 // Set the status what will be updated
    let newStatus = stautsNow == 0 ? 1 : 0;

    // Update the status in the database
    const updateQuery = `
      UPDATE users
      SET status = ?
      WHERE id = ?
      `;

    connection.query(
      updateQuery,
      [newStatus, userId],
      (updateError, updateResults) => {
        if (updateError) {
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const data = { status: newStatus };
        if (updateResults.affectedRows == 1) {
          return res.status(200).json({
            message: `User status changed successfully`,
            data: data,
          });
        } else {
          return res.status(400).json({
            error: `User status updation falied`,
          });
        }
      }
    );
  });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
