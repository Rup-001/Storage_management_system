const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user.model'); 
const passport = require('passport');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY; 

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Find the user by ID from the token payload
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, user); // Attach the user to the request object
      } else {
        console.log("first")
        return done(null, false); // No user found
      }
    } catch (err) {
        console.log("first")
      return done(err, false); // Error occurred
    }
  })
);

module.exports = passport;
