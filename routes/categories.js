var express = require("express");
const jwt = require("jsonwebtoken");
var router = express.Router();
const connection = require("../database/connection");
const { verifyToken } = require("../middlewere/jwtVarifyToken");
const { checkUserType } = require("../middlewere/checkUserType");
const { FileUpload } = require("../libraries/FileUpload");

const fileUploadObj = new FileUpload();

// Add category 
router.post("/add-category", verifyToken, checkUserType, async function (req, res, next) {
  try {

    // Validate required fields
    const requiredFields = ["name"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

        // Retrieve category from the database
        const selectQuery = "SELECT * FROM categories WHERE name = ?";
        connection.query(selectQuery, [req.body.name], async (error, results, fields) => {
          if (error) {
            return res.status(500).json({ error: "Internal Server Error" });
          }

          if (results.length > 0) {
            return res.status(400).json({ error: `Category exist` });
          }
        });

    if (!req.files.image) {
      return res.status(400).json({ error: `Please select image first` });
    }

    const catData = {
      name: req.body.name
    };

    let imageUploadingPath = "categories"
    // upload cover image
    let imgUploaded = await fileUploadObj.uploadFile(
      req.files.image,
      imageUploadingPath
    );

    // Insert data into the categories table
    const insertQuery =
      "INSERT INTO categories (name, image) VALUES (?, ?)";

    connection.query(
      insertQuery,
      [catData.name, imgUploaded.name],
      (error, results, fields) => {
        if (error) {
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
      
        const data = {
          name: req.body.name,
          image: `${process.env.ASSETS_URL_BASE}uploads/categories/${imgUploaded.name}`
        }

        res
          .status(201)
          .json({ message: "Category added successfully", data });
      }
    );
  } catch (err) {
    console.log(err)

    res.status(500).json({ error: "Internal Server Error" });
  }
});


/* GET categories listing. */
router.post("/category-list", verifyToken, checkUserType, function (req, res, next) {
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

    // Retrieve category from the database
    const selectQuery = `
    SELECT
      id,
      name,
      CASE
        WHEN image IS NULL THEN NULL
        ELSE CONCAT('${process.env.ASSETS_URL_BASE}uploads/categories/', image)
      END AS image,
      status
    FROM
    categories
    LIMIT ${limit}
    OFFSET ${offset}`;

    connection.query(selectQuery, async (error, results, fields) => {
      if (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length > 0) {
        res
          .status(200)
          .json({ message: "Category list successfully displayed", data: results });
      } else {
        return res.status(400).json({ error: "Data not found" });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update category
router.delete("/delete-category", verifyToken, function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["category_id"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let catId = 0;
    //Checking for the valid category id
    if (isNaN(parseInt(req.body.category_id))) {
      catId = 0;
    } else {
      catId = req.body.category_id;
    }

    const deleteQuery = "DELETE FROM categories WHERE id = ?";

    connection.query(deleteQuery, [catId], (error, results, fields) => {
      // Your callback logic here
      if (error) {
        console.error("Error deleting category:", error);
      }

      if (results.affectedRows == 1) {
        return res.status(200).json({ message: `Category deleted successfully` });
      } else {
        return res.status(400).json({ error: `Can't delete data` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Category Details
router.get("/category-details/:category_id", verifyToken, function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["category_id"];
    for (const field of requiredFields) {
      if (!req.params[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let catId = 0;
    //Checking for the valid category id
    if (isNaN(parseInt(req.params.category_id))) {
      catId = 0;
    } else {
      catId = req.params.category_id;
    }

    const detailQuery = `SELECT
      id,
      name,
      CASE
        WHEN image IS NULL THEN NULL
        ELSE CONCAT('${process.env.ASSETS_URL_BASE}uploads/categories/', image)
      END AS image,
      status
    FROM
      categories
    WHERE
      id = ?`;

    connection.query(detailQuery, [catId], (error, results, fields) => {
      // Your callback logic here
      if (error) {
        console.error("Error deleting category:", error);
      }

      if (results.length > 0) {
        return res.status(200).json({
          message: `Category details successfully displayed`,
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

// category status change
router.get("/category-status/:category_id", verifyToken, async function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["category_id"];
    for (const field of requiredFields) {
      if (!req.params[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let catId = 0;
    //Checking for the valid category id
    if (isNaN(parseInt(req.params.category_id))) {
      catId = 0;
    } else {
      catId = req.params.category_id;
    }
    // Retrieve category from the database
    const selectQuery = "SELECT * FROM categories WHERE id = ?";
    connection.query(selectQuery, [catId], async (error, results, fields) => {
      if (error) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const stautsNow = results[0].status;
   
 // Set the status what will be updated
    let newStatus = stautsNow == 0 ? 1 : 0;

    // Update the status in the database
    const updateQuery = `
      UPDATE categories
      SET status = ?
      WHERE id = ?
      `;

    connection.query(
      updateQuery,
      [newStatus, catId],
      (updateError, updateResults) => {
        if (updateError) {
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const data = { status: newStatus };
        if (updateResults.affectedRows == 1) {
          return res.status(200).json({
            message: `Category status changed successfully`,
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
