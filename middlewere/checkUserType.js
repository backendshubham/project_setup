// Only admin can access this
function checkUserType(req, res, next) {
    if (req.user.user_type == 2 ) {
      return res.status(401).json({ error: 'You do not have permission to access this' });
    } 
  next()
}
  
module.exports = {
  checkUserType
};
