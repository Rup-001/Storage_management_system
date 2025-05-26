const passport = require('passport');

const isUnauthorized = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access. You cannot access this resource without proper authentication.',
        });
      }
  
      req.user = user; // Attach the user to the request object
      next(); // Proceed to the next middleware/route handler
    })(req, res, next);
  };

  module.exports = isUnauthorized;