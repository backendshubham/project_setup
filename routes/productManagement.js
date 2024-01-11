var express = require("express");
const jwt = require("jsonwebtoken");
var router = express.Router();
const connection = require("../database/connection");
const { verifyToken } = require("../middlewere/jwtVarifyToken");
const { checkUserType } = require("../middlewere/checkUserType");
const { FileUpload } = require("../libraries/FileUpload");

const fileUploadObj = new FileUpload();
// Add product
router.post(
  "/add-product",
  verifyToken,
  checkUserType,
  async function (req, res, next) {
    try {
      // Validate required fields
      const requiredFields = ["name", "category"];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res
            .status(400)
            .json({ message: `Missing required field: ${field}` });
        }
      }

      let catId = 0;
      //Checking for the valid category id
      if (isNaN(parseInt(req.body.category))) {
        catId = 0;
      } else {
        catId = req.body.category;
      }

      if (!req.files.image) {
        return res
          .status(400)
          .json({ error: `Please select atleast one image first` });
      }

      const productData = {
        name: req.body.name,
        category: req.body.category,
      };

      // Insert data into the category table
      const insertQuery = "INSERT INTO products (name, category) VALUES (?, ?)";

      connection.query(
        insertQuery,
        [productData.name, productData.category],
        (error, results, fields) => {
          if (error) {
            res.status(500).json({ error: "Internal Server Error" });
            return;
          }

          req.files.image.forEach(async (value) => {
            const imageUploadingPath = "products";
            // upload cover image
            const imgUploaded = await fileUploadObj.uploadFile(
              value,
              imageUploadingPath
            );

            // Insert data into the images table
            const insertQuery =
              "INSERT INTO product_images (image, product_id) VALUES (? ,?)";

            connection.query(
              insertQuery,
              [imgUploaded.name, results.insertId],
              (errorImg, resultsImg, fieldsImg) => {
                if (errorImg) {
                  res.status(500).json({ error: "Internal Server Error" });
                  return;
                }
              }
            );
          });

          res.status(201).json({ message: "product uploaded successfully" });
        }
      );
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

/* GET products listing. */
router.post(
  "/product-list",
  verifyToken,
  checkUserType,
  function (req, res, next) {
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
        p.id,
        p.name,
        p.status,
        ct.name as category,
        GROUP_CONCAT(pi.image) AS images
      FROM
        products p
      LEFT JOIN
        product_images pi ON p.id = pi.product_id
      LEFT JOIN
        categories ct ON ct.id = p.category
      GROUP BY
        p.id, p.name, p.status
      LIMIT ${limit}
      OFFSET ${offset};
    `;

      connection.query(selectQuery, async (error, results, fields) => {
        if (error) {
          return res.status(500).json({ error: "Internal Server Error" });
        }

        if (results.length > 0) {
          results.forEach((result) => {
            result.images = result.images
              ? result.images.split(",").map((image) => image.trim())
              : [];
          });
          res.status(200).json({
            message: "Product details displayed successfully",
            data: results,
          });
        } else {
          return res.status(400).json({ error: "Data not found" });
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Update product
router.delete("/delete-product", verifyToken, function (req, res, next) {
  try {
    // Validate required fields
    const requiredFields = ["product_id"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${field}` });
      }
    }

    let productId = 0;
    //Checking for the valid category id
    if (isNaN(parseInt(req.body.product_id))) {
      productId = 0;
    } else {
      productId = req.body.product_id;
    }

    const deleteQuery = "DELETE FROM products WHERE id = ?";

    connection.query(deleteQuery, [productId], (error, results, fields) => {
      // Your callback logic here
      if (error) {
        console.error("Error deleting category:", error);
      }

      if (results.affectedRows == 1) {
        return res
          .status(200)
          .json({ message: `Product deleted successfully` });
      } else {
        return res.status(400).json({ error: `Can't delete data` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// product Details
router.get(
  "/product-details/:product_id",
  verifyToken,
  function (req, res, next) {
    try {
      // Validate required fields
      const requiredFields = ["product_id"];
      for (const field of requiredFields) {
        if (!req.params[field]) {
          return res
            .status(400)
            .json({ message: `Missing required field: ${field}` });
        }
      }

      let productId = 0;
      //Checking for the valid category id
      if (isNaN(parseInt(req.params.product_id))) {
        productId = 0;
      } else {
        productId = req.params.product_id;
      }

      const detailQuery = `
      SELECT
    p.id,
    p.name,
    p.status,
    ct.name AS category,
    GROUP_CONCAT(pi.image) AS images
FROM
    products p
LEFT JOIN
    product_images pi ON p.id = pi.product_id
LEFT JOIN
    categories ct ON ct.id = p.category
WHERE
    p.id = ?
GROUP BY
    p.id, p.name, p.status;
`;
      connection.query(detailQuery, [productId], (error, results, fields) => {
        // Your callback logic here
        if (error) {
          console.error("Error deleting category:", error);
        }

        if (results.length > 0) {
          results.forEach((result) => {
            result.images = result.images
              ? result.images.split(",").map((image) => image.trim())
              : [];
          });
          return res.status(200).json({
            message: `product details successfully displayed`,
            data: results[0],
          });
        } else {
          return res.status(400).json({ error: `Record not found` });
        }
      });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Product status change
router.get(
  "/product-status/:product_id",
  verifyToken,
  async function (req, res, next) {
    try {
      // Validate required fields
      const requiredFields = ["product_id"];
      for (const field of requiredFields) {
        if (!req.params[field]) {
          return res
            .status(400)
            .json({ message: `Missing required field: ${field}` });
        }
      }

      let productId = 0;
      //Checking for the valid category id
      if (isNaN(parseInt(req.params.product_id))) {
        productId = 0;
      } else {
        productId = req.params.product_id;
      }
      // Retrieve category from the database
      const selectQuery = "SELECT * FROM products WHERE id = ?";
      connection.query(
        selectQuery,
        [productId],
        async (error, results, fields) => {
          if (error) {
            return res.status(500).json({ error: "Internal Server Error" });
          }

          const stautsNow = results[0].status;

          // Set the status what will be updated
          let newStatus = stautsNow == 0 ? 1 : 0;

          // Update the status in the database
          const updateQuery = `
            UPDATE products
            SET status = ?
            WHERE id = ?
            `;

          connection.query(
            updateQuery,
            [newStatus, productId],
            (updateError, updateResults) => {
              if (updateError) {
                return res.status(500).json({ error: "Internal Server Error" });
              }

              const data = { status: newStatus };
              if (updateResults.affectedRows == 1) {
                return res.status(200).json({
                  message: `Product status changed successfully`,
                  data: data,
                });
              } else {
                return res.status(400).json({
                  error: `Product status updation falied`,
                });
              }
            }
          );
        }
      );
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
