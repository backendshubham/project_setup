/**
 * Common Constants
 *
 * @package                
 * @subpackage             Common Constants
 * @category               Constants
 * @ShortDescription       This is responsible for common constants
 */
const commonConstants = {
    "STORAGE_PATH": "./uploads/",
    "DB_DATE_FORMAT": "YYYY-MM-DD HH:mm:ss", //used in dateTime library
    "EMAIL_TEMPLATE_URL": "./src/emails/", //used in email config file
    "PASSWORD_SALT_ROUNDS": 10,
    "SIGNUP_TYPE_NORMAL": 1,
    "SIGNUP_TYPE_SOCIAL": 2,
    "INACTIVE_STATUS": 0,
    "ACTIVE_STATUS": 1,
    "DEVICE_TYPE_ANDROID": 1,
    "DEVICE_TYPE_IOS": 2,
    "DEVICE_TYPE_WEBSITE": 3,
    "USER_TYPE_CUSTOMER": 1,
    "USER_TYPE_ORGANIZER": 2,
    "USER_TYPE_STAFF": 3,
    "NOT_DELETED_STATUS": 0,
    "DELETED_STATUS": 1,
    'MAX_IMAGE_SIZE': 10485760, //10MB
    "IMAGE_EXTENTIONS": [".jpg", ".jpeg", ".gif", ".png", ".eps", ".raw", ".bmp", ".tiff", ".webp"],
    "IMAGE_COMPRESS_SIZE": 75,
    "MAX_UPLOAD_LIMIT": 5,
    "LIMIT": 10,
};
module.exports = { commonConstants };
