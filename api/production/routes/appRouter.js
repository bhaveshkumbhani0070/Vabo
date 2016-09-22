//node_module dependent
var express = require('express');
var router 	= express.Router();
var jwt 	= require("jsonwebtoken");
//var app 	= express();
var apiRoutes = express.Router();

//controller dependent
var users = require('../controller/users');

module.exports=function(app) {
    apiRoutes.use(function(req, res, next) {
        var token = req.body.token || req.query.token || req.headers['token'];
        if (token) {
            jwt.verify(token, config.secret, function(err, decoded) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Failed to authenticate token.',
                        data: null
                    });
                } else {
                    req.user = decoded._doc;
                    next();
                }
            });
        } else {       
            return res.status(403).send({
                success: false,
                message: 'No token provided.',
                data: null
            });
        }
    });

    //FOR USER REGISTRATION
    app.post('/user/create',users.create);
    app.post('/user/login' ,users.login);

    //FOR USER LOGIN
    // router.post('/user/login ', users.login );

    // FOR API VALIDATION(after login functions)
    //app.use('/api', apiRoutes);


    //app.route('/api/user/signup').post(control.create);
}
//module.exports = router;
