const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const commonConstants = require('./../constants/commonConstants');
const sharp = require("sharp");

class FileUpload {
    /**
     * Upload File.
     *
     * @param  req request param
     * @param  folder upload file folder 
     * @returns {object} uploaded file name
     */


    async uploadFile(file, directory = "testing", name = "") {

        return new Promise((resolve, reject) => {
            if (file) {

                const absolutePath = path.join(commonConstants.commonConstants.STORAGE_PATH, directory);
                const fileName = `${uniqid()}.webp`;
                let qualityImg = commonConstants.IMAGE_COMPRESS_SIZE;

                // Check Directory
                if (!fs.existsSync(absolutePath)) {
                    fs.mkdirSync(absolutePath, { recursive: true });
                }

                const compressedFilePath = path.join(absolutePath, fileName);

                sharp(file.data)
                    .webp({ quality: qualityImg })
                    .toFile(compressedFilePath, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            const output = { name: fileName };
                            resolve(output);
                        }
                    });
            } else {
                const output = { name: "" };
                resolve(output);
            }
        });

    }



    /**
     * File unlink.
     *
     * @param  {String} fileName
     * @param  {String} folder
     * @returns {Boolean} return
     */
    unlinkFile(fileName, folder) {


        const directory = commonConstants.STORAGE_PATH + folder,
            path = `${directory}/${fileName}`;
        fs.unlink(path, (err) => {
            if (err) {

                return false;
            }

            return true;
            // file removed
        });
    }


    /**
     * File unlink using file path with name.
     *
     * @param  {String} filePath
     * @returns {Boolean}
     */
    unlinkFileUsingPath(filePath) {
        fs.unlink(filePath, (err) => {
            if (err) {
                return false;
            }

            return true;
            // file removed
        });
    }


}
module.exports = { FileUpload }