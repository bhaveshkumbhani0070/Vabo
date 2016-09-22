var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var busboy = require('connect-busboy');
var router = express.Router();
var apiRoutes = express.Router();
var jwt = require("jsonwebtoken");
var fs = require("fs");
var winston = require('winston');
var chalk = require('chalk');
var apiurl = express.Router();
var multipart = require('connect-multiparty');

//Production Part
var config = require('./production/config/config');


var users = require('./production/controller/users.js');
var help=require('./production/controller/help.js');
var contact=require('./production/controller/contact.js');
var service = require('./production/controller/service.js');
var appointment_req = require('./production/controller/appointment_req.js');
var appointmentpayment = require('./production/controller/appointment_payment.js');
var professionalController = require('./production/controller/professionals');
var payment = require('./production/controller/payment.js');
var logger = require('./production/controller/log.js');
var professionalController = require('./production/controller/professionals');

//Staging Part
var staging_users = require('./staging/controller/users.js');
var staging_help=require('./staging/controller/help.js');
var staging_contact=require('./staging/controller/contact.js');
var staging_service = require('./staging/controller/service.js');
var staging_appointment_req = require('./staging/controller/appointment_req.js');
var staging_appointmentpayment = require('./staging/controller/appointment_payment.js');
var staging_professionalController = require('./staging/controller/professionals');
var staging_payment = require('./staging/controller/payment.js');
var staging_logger = require('./staging/controller/log.js');
var staging_professionalController = require('./staging/controller/professionals');

//var sqlinjection = require('sql-injection');
//app.use(sqlinjection);

//for validate creadit card at client side
/*<script type="text/javascript" src="https://js.stripe.com/v2/"></script>
 <script type="text/javascript">
 Stripe.setPublishableKey('pk_test_aUS7zJ7MxEOwoIqzJ9LDzbBJ');
 </script>*/


app.locals.stripePublishableKey = process.env.pk_test_aUS7zJ7MxEOwoIqzJ9LDzbBJ;

    if(!process.env.NODE_ENV)
    {
        process.env.NODE_ENV = 'development'
    }

app.set('port', process.env.PORT || 3306);
app.use(bodyParser.urlencoded({
    limit: '500mb',
    extended: true,
    parameterLimit: 50000
}));
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,token');
    //res.setHeader('*');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(expressValidator());
app.use(bodyParser.json());
app.use(busboy());
app.use(express.static(__dirname + '/public'));

router.post('/user/signup', users.signup);
router.post('/staging/user/signup', staging_users.signup);

router.post('/user/signin', users.signin);
router.post('/staging/user/signin', staging_users.signin);

router.post('/api/user/CustomerDetails', users.CustomerDetails);
router.post('/api/staging/user/CustomerDetails', staging_users.CustomerDetails);
router.post('/api/user/ProfessionalDetails', users.ProfessionalDetails);
router.post('/api/staging/user/ProfessionalDetails', staging_users.ProfessionalDetails);


apiurl.use(function (req, res, next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    exports.url = fullUrl;
    next();
});
app.use('/', apiurl);

var fs = require('fs');
router.get('/',function(req,res){
  //res.header("Access-Control-Allow-Origin", "*");
  res.sendFile("index.html", {"root": 'views'});
});

router.get('/admin',function(req,res){
  //res.header("Access-Control-Allow-Origin", "*");
  res.sendFile("login.html", {"root": '../admin/app/pages'});
});

var jobs = require('./production/config/worker')(app);

apiRoutes.use(function (req, res, next) {

    var token = req.body.token || req.query.token || req.headers['token'];

    if (token)
     {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                return res.json({"code": 200, "status": "Error", "message": "Failed to authenticate token"});
            }
            else {

                req.user = decoded;
                next();
            }
        });
    }
    else
    {
        return res.json({"code": 200, "status": "Error", "message": "No token provided"});
    }
});

app.use('/api', apiRoutes);
app.use('/staging/api', apiRoutes);

router.post('/api/user/edit',users.edit);
router.post('/staging/api/user/edit',staging_users.edit);
router.post('/api/user/changePassword',users.changePassword);
router.post('/staging/api/user/changePassword',staging_users.changePassword);
router.post('/user/forgotPassword',users.ForgotPassword);
router.post('/staging/user/forgotPassword',staging_users.ForgotPassword);
router.post('/user/resetPassword',users.resetPassword);
router.post('/staging/user/resetPassword',staging_users.resetPassword);
router.post('/api/user/available',users.available);
router.post('/staging/api/user/available',staging_users.available);
router.post('/api/user/logout',users.logout);
router.post('/staging/api/user/logout',staging_users.logout);


//router.post('/api/user/imageUpload',multipart(),users.imageUpload);

//router.get('/app/profile_img/:file',users.getimage);


//All Detail of Current User
router.post('/api/userdetail', users.alldetail);
router.post('/staging/api/userdetail', staging_users.alldetail);


//*****************************Services***********************************
router.post('/api/service/create', service.create);
router.post('/staging/api/service/create', staging_service.create);
router.post('/api/service/id', service.SelectId);
router.post('/staging/api/service/id', staging_service.SelectId);
router.post('/api/service/services', service.services);
router.post('/staging/api/service/services', staging_service.services);
router.post('/api/service/edit', service.edit);
router.post('/staging/api/service/edit', staging_service.edit);
router.post('/api/service/deleteservices', service.deleteServices);
router.post('/staging/api/service/deleteservices', staging_service.deleteServices);

//*****************************End_Services********************************


//*****************************Appointment*********************************
router.post('/api/appointment/start',appointment_req.start);
router.post('/staging/api/appointment/start',staging_appointment_req.start);
//*****************************Customer************************************
router.post('/api/customer/appointment/create', appointment_req.create);
router.post('/staging/api/customer/appointment/create', staging_appointment_req.create);
router.post('/api/customer/appointment/edit', appointment_req.edit);
router.post('/staging/api/customer/appointment/edit', staging_appointment_req.edit);
router.post('/api/customer/appointments', appointment_req.appointments);
router.post('/staging/api/customer/appointments', staging_appointment_req.appointments);
//For Admin panel
router.post('/api/appointments', appointment_req.AdminAppointments);
router.post('/api/helpquetion', help.helpquetion);

//router.post('/api/customer/appointment/cancel', appointment_req.cust_cancel);      this situation can be handled during in prof_cancel
//Rate by cust and Rate by prof
router.post('/api/customer/appointment/rate', appointment_req.rate_by_cust);
router.post('/staging/api/customer/appointment/rate', staging_appointment_req.rate_by_cust);
router.post('/api/professional/appointment/rate', appointment_req.rate_by_prof);
router.post('/staging/api/professional/appointment/rate', staging_appointment_req.rate_by_prof);
//*****************************End_Customer*********************************

//*****************************Professional*********************************
router.post('/api/professional/appointment/accept', appointment_req.accept);
router.post('/staging/api/professional/appointment/accept', staging_appointment_req.accept);
router.post('/api/professional/appointment/reject', appointment_req.reject);
router.post('/staging/api/professional/appointment/reject', staging_appointment_req.reject);
router.post('/api/professional/appointment', appointment_req.acceptbyuser);
router.post('/staging/api/professional/appointment', staging_appointment_req.acceptbyuser);
router.post('/api/appointment/new', appointment_req.appointment);
router.post('/staging/api/appointment/new', staging_appointment_req.appointment);
router.post('/api/professional/appointment/cancel', appointment_req.prof_cancel);
router.post('/staging/api/professional/appointment/cancel', staging_appointment_req.prof_cancel);
router.post('/api/professional/appointment/complete', appointment_req.complete_appo);
router.post('/staging/api/professional/appointment/complete', staging_appointment_req.complete_appo);

//*****************************End_Professional******************************

//*****************************End_Appointment*******************************

//router.post('/api/sendMessage', appointment_req.send_message);
//router.post('/api/readMessage', appointment_req.read_message);

//*****************************Message***************************************

router.post('/api/appointment/sendMessage',users.send_message);
router.post('/staging/api/appointment/sendMessage',staging_users.send_message);
router.post('/api/appointment/readMessage',users.read_message);
router.post('/staging/api/appointment/readMessage',staging_users.read_message);
router.post('/api/appointment/viewMessage',users.view_message);
router.post('/staging/api/appointment/viewMessage',staging_users.view_message);

//*****************************End_Message***********************************


//*****************************Notification***********************************

router.post('/api/RegisterDevice',users.RegisterDevice);
router.post('/staging/api/RegisterDevice',staging_users.RegisterDevice);
//*****************************End_Notification*******************************


//*****************************payment***************************************
//*******payment card
router.post('/api/card/create', payment.card_create);
router.post('/staging/api/card/create', staging_payment.card_create);

router.post('/api/card/edit', payment.card_edit);
router.post('/staging/api/card/edit', staging_payment.card_edit);

router.post('/api/card/delete', payment.delete_card);
router.post('/staging/api/card/delete', staging_payment.delete_card);

router.post('/api/customer/payment/details', payment.card_detail);
router.post('/staging/api/customer/payment/details', staging_payment.card_detail);
//*******payment charge
router.get('/api/payment/charge', payment.payment_charge);
router.get('/staging/api/payment/charge', staging_payment.payment_charge);

router.post('/api/card/defaultChange', payment.defaultChange);
router.post('/staging/api/card/defaultChange', staging_payment.defaultChange);

//******create customer
//router.post('/api/cutomer/create',payment.customer_create);
//*****************************End_Payment************************************

//*****************************Help***************************************
router.post('/api/appointment/help',help.Create_help);
router.post('/staging/api/appointment/help',staging_help.Create_help);

router.post('/api/appointment/questions',help.GetQuestions);
router.post('/staging/api/appointment/questions',staging_help.GetQuestions);
//*****************************End_Help***********************************

//*****************************Contact***************************************
router.post('/api/appointment/contact',contact.Create_contact);
router.post('/staging/api/appointment/contact',staging_contact.Create_contact);
//*****************************End_Contact***********************************



router.post('/api/appointmentpayment/appointments',appointmentpayment.appointments);
router.post('/staging/api/appointmentpayment/appointments',staging_appointmentpayment.appointments);
//Post User Request for get somthing
// router.post('/api/users/appointmentpayment', appointmentpayment.appointment);


// ********************************************create stripe profiles if not exist
router.post('/api/professionals/stripeAccountCreate',professionalController.createProfessionalStripeAccount);
router.post('/staging/api/professionals/stripeAccountCreate',staging_professionalController.createProfessionalStripeAccount);

router.post('/api/professionals/updateManageAccount',professionalController.updateManageAccount);
router.post('/staging/api/professionals/updateManageAccount',staging_professionalController.updateManageAccount);



// *********************************************** transferFunds to professionals
// router.post('/api/professionals/transferFunds',professionalController.transferFunds);

// ********************************************************* retrieve transaction history for current
router.post('/api/professionals/retrieveTransactionHistory',professionalController.retrieveTransactionHistory);
router.post('/staging/api/professionals/retrieveTransactionHistory',staging_professionalController.retrieveTransactionHistory);

router.post('/api/professionals/accountDetail',professionalController.Account_Detail);
router.post('/staging/api/professionals/accountDetail',staging_professionalController.Account_Detail);

//Charge To Professional
router.post('/api/professionals/Charge',professionalController.ProfessionalCharge);
router.post('/staging/api/professionals/Charge',staging_professionalController.ProfessionalCharge);
// refund to client
// router.post('/api/professionals/refund',professionalController.refund);


app.use('/', router);

app.listen(app.get('port'));
winston.info(chalk.green("VaboApi Started on Port No. ", app.get('port')));
