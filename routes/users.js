var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Include User Model
var User = require('../models/user');
// Include Student Model
var Student = require('../models/student');
// Include Instructor Model
var Instructor= require('../models/instructor');

router.get('/signup', function(req, res, next) {
  res.render('users/signup');
});

router.post('/signup', function(req, res, next){
	// Get Form Values
	var first_name     	= req.body.first_name;
	var last_name     	= req.body.last_name;
	var street_address  = req.body.street_address;
	var city     		= req.body.city;
	var state    		= req.body.state;
	var zip     		= req.body.zip;
	var email    		= req.body.email;
	var username 		= req.body.username;
	var password 		= req.body.password;
	var password2 		= req.body.password2;
	var type            = req.body.type;

	// Form Field Validation
	req.checkBody('first_name', 'First name field is required').notEmpty();
	req.checkBody('last_name', 'Last name field is required').notEmpty();
	req.checkBody('email', 'Email field is required').notEmpty();
	req.checkBody('email', 'Email must be a valid email address').isEmail();
	req.checkBody('username', 'Username field is required').notEmpty();
	req.checkBody('password', 'Password field is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		res.render('users/signup', {
    		errors: errors,
    		first_name: first_name,
    		last_name: last_name,
    		street_address: street_address,
    		city: city,
    		state: state,
    		zip: zip,
    		email: email,
    		username: username,
    		password: password,
    		password2: password2
    	});
	} else {
		var newUser = new User({
			email: email,
			username:username,
			password: password,
			type: type
		});

		var newStudent = new Student({
			first_name: first_name,
			last_name: last_name,
			address: [{
				street_address: street_address,
				city: city,
				state: state,
				zip: zip
			}],
			email: email,
			username:username
		});

		var newInstructor= new Instructor({
			first_name: first_name,
			last_name: last_name,
			address: [{
				street_address: street_address,
				city: city,
				state: state,
				zip: zip
			}],
			email: email,
			username:username
		});
		
		if(type == 'student'){
			User.saveStudent(newUser, newStudent, function(err, user){
				console.log('Student created');
			});
		} else {
			User.saveInstructor(newUser, newInstructor, function(err, user){
				console.log('Instructor created');
			});
		}

		req.flash('success','User added');
		res.redirect('/');
	}
});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});


passport.deserializeUser(function(id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});


router.post('/login',passport.authenticate('local',{failureRedirect:'/', failureFlash:'Wrong Username or Password'}), function(req, res){
	req.flash('success','You are now logged in');
	var usertype = req.user.type;
	res.redirect('/'+usertype+'s/classes');
});


passport.use(new LocalStrategy(
  function(username, password, done) {
  	User.getUserByUsername(username, function(err, user){
    	if (err) throw err;
    	if(!user){
    		return done(null, false, { message: 'Unknown user ' + username }); 
    	}

    	User.comparePassword(password, user.password, function(err, isMatch) {
      		if (err) return done(err);
      		if(isMatch) {
        		return done(null, user);
      		} else {
      			console.log('Invalid Password');
      			// Success Message
        		return done(null, false, { message: 'Invalid password' });
      		}
   	 	});
    });
  }
));

// Log User Out
router.get('/logout', function(req, res){
	req.logout();
 	// Success Message
	req.flash('success', "You have logged out");
  	res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
      return next(); 
    }
  res.redirect('/')
}

module.exports = router;
