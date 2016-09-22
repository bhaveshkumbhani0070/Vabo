var config = require('../config/config'); //For App configuration
var bcrypt = require('bcrypt-nodejs'); //For encryption
var jwt = require("jsonwebtoken");
var fs = require("fs");
var busboy = require('connect-busboy');
var logger = require('./log');
var URL = require('../../app.js');
var express = require('express')
var multer = require('multer')
var upload = multer({
    dest: 'uploads/'
})
var app = express();
var Errors = require('../constants/functions.js');
var path = require('path');
var fs = require('fs');
var validator = require('validator');
var date = require('date-and-time');
var sendGrid = require('sendgrid')('app53502334@heroku.com', 'mpzxi6n17956');
var constants = require('../constants/constants.json');
var data = require('../constants/functions.js');
var FCM = require('fcm-node');
var Tokens = require('./getFCMtokens.js');
var EmailFor=require('../config/email.js');
var pool = require('../config/db');



exports.CustomerDetails = function (req, res)
{
  pool.getConnection(function(err,connection){
      if(!err)
      {
          //select customer
          connection.query('select id,firstname,lastname,dob,gender,phone,email,is_social,is_professional,city,country,address,zip,img_path,Q1,Q2,Q3,Q4,Q5,Q6,is_available,province from users where is_professional=0',
          function(err,customer){
              if(!err)
              {
                  console.log('userdetail',customer);
                  res.json({'code':200,'status':'Success','message':'Customer Details Selected','userData':customer});
                  return;
              }
              else
              {
                  console.log('Error for selecting customer Detail',err);
                  res.json({'code':200,'status':'Error','message':'Error for selecting Customers'});
                  return;
              }
          });
          connection.release();
      }
      else
      {
          console.log('Error for connection',err);
          res.json({'code':200,'status':'Error','message':'Error for connection'});
          return;
      }
  });
}

exports.ProfessionalDetails = function (req, res)
{
  pool.getConnection(function(err,connection){
      if(!err)
      {
          //select customer
          connection.query('select id,firstname,lastname,dob,gender,phone,email,is_social,is_professional,city,country,address,zip,img_path,Q1,Q2,Q3,Q4,Q5,Q6,is_available,province from users where is_professional=1',
          function(err,professional){
              if(!err)
              {
                  console.log('userdetail',professional);
                  res.json({'code':200,'status':'Success','message':'Customer Details Selected','userData':professional});
                  return;
              }
              else
              {
                  console.log('Error for selecting customer Detail',err);
                  res.json({'code':200,'status':'Error','message':'Error for selecting Customers'});
                  return;
              }
          });
          connection.release();
      }
      else
      {
          console.log('Error for connection',err);
          res.json({'code':200,'status':'Error','message':'Error for connection'});
          return;
      }
  });
}

exports.logout = function (req, res)
{
    console.log("*** Staging Requested for Logout	***");
    logger.info('*** Staging Requested for Logout	***');

    pool.getConnection(function (err, connection) {
        if (!err)
        {
            email = req.user.email
            connection.query('delete from notification where user_id=(select id from users where email=?)', [email],
                function (err, noti_data){
                    if (!err)
                    {
                        deleted_device = noti_data.affectedRows
                        console.log('User Logout Successfully...');
                        res.json({'code': 200, 'status': 'Success', 'message': 'User Logout Successfully...'});
                        logger.info('URL=', URL.url, 'Responce=', 'User Logout Successfully...', 'Email id=', email);
                        return;
                    }
                    else
                    {
                        console.log('Error for deleting and selecing details..', err);
                        res.json({'code': 200,'status': 'Error','message': 'Error for deleting and selecing details..'});
                        logger.error('URL=',URL.url, 'Responce=','Error for deleting and selecing details..','Email id=', email);
                        return;
                    }
                });
                connection.release();
        }
        else
        {
            Errors.Connection_Error(res);
        }
    });
}

exports.available = function (req, res)
{
    console.log("*** Staging Requested for change availability of user ***");
    logger.info('*** Staging Requested for change availability of user ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        email = req.user.email
        is_available = req.body.is_available

        pool.getConnection(function (err, connection) {
            if (!err)
            {
                connection.query('select id from users where email=?', [email],
                    function (err, user_detail) {
                        if (!err)
                        {
                            connection.query('update users set is_available=? where id=?', [is_available, user_detail[0].id],
                                function (err, userupdate) {
                                    if (!err)
                                    {
                                        connection.query('select * from users where email=?', [email],
                                            function (err, userdetail) {
                                                if (!err)
                                                {
                                                    console.log('User detail update for available', userdetail);
                                                    res.json({'code': 200,'status': 'Success','message': 'User detail update for available','userData': userdetail});
                                                    logger.info('URL', URL.url, 'Responce=', 'User detail update for available', 'User Email=', email);
                                                    return;
                                                }
                                                else
                                                {
                                                    console.log('Error for selecting data', err);
                                                    res.json({'code': 200,'status': 'Error','message': 'Error for selecting data'});
                                                    logger.error('URL', URL.url,'Responce=', 'Error for selecting data', 'User Email=', email);
                                                    return;
                                                }
                                            });
                                    }
                                    else
                                    {
                                        console.log('Error for updating data', err);
                                        res.json({'code': 200,'status': 'Error','message': 'Error for updating data'});
                                        logger.error('URL', URL.url,'Responce=','Error for Updating data', 'Email=', email);
                                        return;
                                    }
                                });
                        }
                        else
                        {
                            Errors.SelectUserError(res,err);
                        }
                    });
                    connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
};

exports.RegisterDevice = function (req, res)
{
    console.log("*** Staging Requested for RegisterDevice ***");
    logger.info('*** Staging Requested for RegisterDevice ***');
    receivedValues = req.body //RESPONSE FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        pool.getConnection(function (err, connection) {
            if (!err)
            {
                token = req.body.api_token
                user_id = req.body.user_id
                type = req.body.type
                connection.query('update notification set token=?,type=? where user_id=? or token=?', [token, type, user_id,token],
                    function (err, updatedata) {
                        if (!err)
                        {
                            update = updatedata.affectedRows
                            //console.log('updatedata',updatedata);
                            //console.log('update',update);
                            if (update == 0)
                            {
                                token_data = [user_id, token, type]
                                connection.query('insert into notification(user_id,token,type) values(?)', [token_data],
                                    function (err, updatedata) {
                                        if (!err)
                                        {
                                            connection.query('select * from notification where user_id=?', [user_id],
                                                function (err, selectData) {
                                                    if (!err)
                                                    {
                                                        console.log('Device Registered Successfully...', selectData);
                                                        res.json({'code': 200,'status': 'Success','message': 'Device Registered Successfully...'});
                                                        logger.info('URL', URL.url, 'Responce=', 'Device Registered Successfully...', 'User id=', user_id);
                                                        return;
                                                    }
                                                    else
                                                    {
                                                        console.log('Error for Device Register');
                                                        res.json({'code': 200,'status': 'Success','Error': 'Error for Device Register'});
                                                        logger.error('URL', URL.url,'Responce=','Error for Device Register', 'User id=', user_id);
                                                        return;
                                                    }
                                                });
                                        }
                                        else
                                        {
                                            console.log('Error for inserting data for Device Register', err);
                                            res.json({'code': 200,'status': 'Error','message': 'Error for inserting data for Device Register'});
                                            logger.error('URL', URL.url,'Responce=','Error for inserting data for Device Register', 'User id=', user_id)
                                            return;
                                        }
                                    });
                            }
                            else
                            {
                                connection.query('select * from notification where user_id=?', [user_id],
                                    function (err, notificationdata) {
                                        if (!err)
                                        {
                                            console.log('Deice are Dublicate', notificationdata);
                                            res.json({'code': 200,'status': 'Success','message': 'Deice are Dublicate'});
                                            logger.info('URL', URL.url, 'Responce=', 'Deice are Dublicate', 'User id=', user_id);
                                            return;
                                        }
                                        else
                                        {
                                            console.log('Error for selecting notification data', err);
                                            res.json({'code': 200,'status': 'Error','message': 'Error for selecting notification data'});
                                            logger.error('URL', URL.url,'Responce=','Error for selecting notification data', 'User id=', user_id)
                                            return;
                                        }
                                    });
                            }
                        }
                        else
                        {
                            console.log('Error for updating data', err);
                            res.json({'code': 200, 'status': 'Error', 'message': 'Error for updating data'});
                            logger.error('URL', URL.url,'Responce=','Error for updating data', 'User id=', user_id)
                            return;
                        }
                    });
                  connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
};

//*** /api/appointment/viewMessage
exports.view_message = function (req, res)
{
    console.log("*** Staging Requesting for View Message ***");
    logger.info('*** Staging Requesting for View Message ***');
    receivedValues = req.body    //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        pool.getConnection(function (err, connection) {
            if (!err)
            {
                email = req.user.email
                connection.query('select * from users where email=?', [email],
                    function (err, user_detail) {
                        if (!err)
                        {
                            console.log('user detail selected', user_detail);
                            appointment_request_id = req.body.appointment_request_id
                            message = req.body.message
                            is_professional = user_detail[0].is_professional
                            if (is_professional == 1)
                            {
                                type = 1
                            }
                            else
                            {
                                type = 0
                            }
                            user_id = user_detail[0].id

                            connection.query('select u.firstname,u.lastname,u.img_path,m.* from users u, message m where m.appointment_request_id=? and u.id=m.user_id order by time', [appointment_request_id],
                                function (err, sender_messages) {
                                    if (!err)
                                    {
                                        console.log('All Messages', sender_messages);
                                        res.json({'code': 200,'status': 'Success','message': 'View All Messages','messageData': sender_messages});
                                        logger.info('URL', URL.url, 'Responce=', 'All Messages', 'Email=', email);
                                        return;
                                    }
                                    else
                                    {
                                        console.log('Error for selecting messages', err);
                                        res.json({'code': 200,'status': 'Error','message': 'Error for selecting messages'});
                                        logger.error('URL', URL.url,'Responce=','Error for selecting messages', 'Email=', email);
                                        return;
                                    }
                                });
                        }
                        else
                        {
                            Errors.SelectUserError(res,err);
                        }
                    });
                    connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
}

//*** /api/appointment/readMessage
exports.read_message = function (req, res)
{
    console.log("*** Staging Requested for Read Message ***");
    logger.info('*** Staging Requested for Read Message ***');
    receivedValues = req.body    //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        pool.getConnection(function (err, connection) {
            if (!err)
            {

                email = req.user.email
                connection.query('select * from users where email=?', [email],
                    function (err, user_detail) {
                        if (!err)
                        {
                            is_professional = user_detail[0].is_professional
                            appointment_request_id = req.body.appointment_request_id

                            if (is_professional == 1)
                            {
                                update(0);
                            }
                            else
                            {
                                update(1);
                            }

                            function update(type)
                            {
                                connection.query('update message set status=1 where appointment_request_id=? and type=?', [appointment_request_id, type],
                                    function (err, update_message_data) {
                                        if (!err)
                                        {
                                            console.log('Status updated for ' + type);
                                            connection.query('select * from message where appointment_request_id=? and type=?', [appointment_request_id, type],
                                                function (err, sender_messages) {
                                                    if (!err)
                                                    {
                                                        console.log('Sender Messages', sender_messages);
                                                        res.json({'code': 200,'status': 'Success','message': 'Read Messages','messageData': sender_messages});
                                                        logger.info('URL', URL.url, 'Responce=', 'Messages read', 'Reader Email=', email);
                                                        return;
                                                    }
                                                    else
                                                    {
                                                        console.log('Error for selecting messages', err);
                                                        res.json({'code': 200,'status': 'Error','message': 'Error for selecting messages'});
                                                        logger.error('URL', URL.url,'Responce=','Error for selecting messages');
                                                        return;
                                                    }
                                                });
                                        }
                                        else
                                        {
                                            console.log('Error for updating message for status', err);
                                            res.json({
                                                'code': 200,
                                                'status': 'Error',
                                                'message': 'Error for updating message for status'
                                            });
                                            logger.error('URL', URL.url,'Responce=','Error for updating message for status');
                                            return;
                                        }
                                    });
                            }
                        }
                        else
                        {
                            Errors.SelectUserError(res,err);
                        }
                    });
                  connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
}

exports.send_message = function (req, res)
{
    console.log("*** Staging Requested for Send Message ***");
    logger.info('*** Staging Requested for Send Message ***');
    receivedValues = req.body    //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else {
        messagecolumns = ['appointment_request_id', 'message'];
        var dbValues = [];
        for (var iter = 0; iter < messagecolumns.length; iter++)
        {
            columnName = messagecolumns[iter];
            var data = req.body
            if ((data == undefined || data == "") && (columnName == 'appointment_request_id' || columnName == 'message'))
            {
                console.log("*** Redirecting: ", columnName, " field is required")
                res.json({"code": 200, "status": "Error", "message": columnName + " field is undefined"});
                return;
            }
            if(req.body.message=="")
            {
                console.log('Message Require');
                res.json({'code':200,'status':'Error','message':'Message Field is Require'});
                return;
            }
            dbValues[iter] = receivedValues[columnName];
        }

        pool.getConnection(function (err, connection) {
            if (!err)
            {
                email = req.user.email
                connection.query('select * from users where email=?', [email],
                    function (err, user_detail) {
                        if (!err)
                        {
                            user_id = user_detail[0].id
                            appointment_request_id = req.body.appointment_request_id
                            message = req.body.message
                            var now = new Date();
                            var time = date.format(now, 'YYYY/MM/DD HH:mm:ss');
                            is_professional = user_detail[0].is_professional
                            if (is_professional == 1)
                            {
                                type = 1
                            }
                            else
                            {
                                type = 0
                            }
                            console.log('type=', type);
                            connection.query('insert into message(??,time,type,user_id) values(?,?,?,?)', [messagecolumns, dbValues, time, type, user_id],
                                function (err, message_inserted) {
                                    if (!err)
                                    {
                                        console.log('Message send', message_inserted.insertId);
                                        connection.query('select u.firstname,u.lastname,u.img_path,m.* from users u, message m where u.id=m.user_id and m.id=?', [message_inserted.insertId],
                                        function (err, message_detail) {
                                        if (!err)
                                        {
                                            connection.query('select	count(id) as message_count from message where appointment_request_id=?', [appointment_request_id],
                                            function (err, total_message) {
                                            if (!err)
                                            {
                                                    connection.query('update appointment_request set message_count=? where appointment_request_id=?', [total_message[0].message_count, appointment_request_id],
                                                    function (err, update_message_count) {
                                                      if (!err)
                                                      {
                                                          console.log('Last Message', message_detail);
                                                          res.json({'code': 200,'status': 'Success','message': 'message send Successfully...','messageData': message_detail});
                                                          logger.info('URL', URL.url, 'Responce=', 'Messages sended', 'Sender Email=', email);
                                                          connection.query('select * from appointment_request where appointment_request_id=?', [appointment_request_id],
                                                          function (err, user_data) {
                                                            if (!err)
                                                            {
                                                                console.log('total', total_message[0].message_count);
                                                                logger.info('URL', URL.url, 'Responce=', 'Messages Send Successfully...', 'Sender Email=', email);
                                                                if (type == 0)
                                                                {
                                                                      user_id_token = user_data[0].professional_id
                                                                }
                                                                else
                                                                {
                                                                      user_id_token = user_data[0].user_id
                                                                }
                                                                console.log('Sender', user_id);
                                                                console.log("Reciver", user_id_token);
                                                                id = user_data[0].appointment_request_id
                                                                msg = message
                                                                title = 'New Message'
                                                                Tokens.GetUserToken(connection, user_id_token, function (result) {
                                                                      Tokens.SendNotificationMessage(msg, title, 'NEW_MESSAGE', id, user_id_token, message_detail, result);
                                                                });
                                                                return;
                                                             }
                                                             else
                                                             {
                                                                  console.log('Error for updating appointment request', err);
                                                                  res.json({'code': 200,'status': 'Success','message': 'Error for updating appointment request','messageData': message_detail});
                                                                  logger.error('URL', URL.url,'Responce=','Error for updating appointment request','Sender Email=', email);
                                                                  return;
                                                             }
                                                          });
                                                      }
                                                      else
                                                      {
                                                          console.log('Error for selecting user detail');
                                                          res.json({'code': 200,'status': 'Error','message': 'Error for selecting user detail'});
                                                          logger.error('URL', URL.url,'Responce=','Error for selecting user detail','Sender Email=', email);
                                                          return;
                                                      }
                                                  });
                                                }
                                                else
                                                {
                                                    console.log('Error for count message', err);
                                                    res.json({'code': 200,'status': 'Success','message': 'Error for count message','messageData': message_detail});
                                                    logger.error('URL', URL.url,'Responce=','Error for count message','Sender Email=', email);
                                                    return;
                                                }

                                            });
                                          }
                                          else
                                          {
                                              console.log('Error for Selecting last message', err);
                                              res.json({'code': 200,'status': 'Error','message': 'Error for Selecting last message'});
                                              logger.error('URL', URL.url,'Responce=','Error for Selecting last message','Sender Email=', email);
                                              return;
                                          }
                                      });
                                    }
                                    else
                                    {
                                        console.log('Error for inserting message data', err);
                                        res.json({'code': 200,'status': 'Error','message': 'Error for inserting message data'});
                                        logger.error('URL', URL.url,'Responce=','Error for inserting message data','Sender Email=', email);
                                        return;
                                    }
                                });
                        }
                        else
                        {
                            Errors.SelectUserError(res,err);
                        }
                    });
                      connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
}

//**** /user/resetPassword
exports.resetPassword = function (req, res)
{
    console.log("*** Staging Requested for Reset Password... ***");
    logger.info('*** Staging Requested for Reset Password... ***');

    receivedValues = req.body //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        pool.getConnection(function (err, connection) {
            if (!err)
            {
                otp = req.body.otp
                connection.query('select count(otp_number) as otp from otp where otp_number=?', [otp],
                    function (err, otp_count) {
                        if (!err)
                        {
                            if (otp_count[0].otp == 1)
                            {
                                connection.query('select o.*,u.* from otp o,users u where o.otp_number=? and u.id=o.user_id', [otp],
                                    function (err, otp_data) {
                                        if (!err)
                                        {
                                            email = otp_data[0].email
                                            newpassword = req.body.newpassword
                                            var password = bcrypt.hashSync(newpassword, bcrypt.genSaltSync(8));
                                            user_id = otp_data[0].user_id
                                            connection.query('update users set password=? where id=?', [password, user_id],
                                                function (err, update_data) {
                                                    if (!err)
                                                    {
                                                        connection.query('delete from otp where otp_number=?', [otp],
                                                            function (err, otp_delete) {
                                                                if (!err)
                                                                {
                                                                    console.log('Password changed Successfully...');
                                                                    res.json({'code': 200,'status': 'Success','message': 'Password changed Successfully...'});
                                                                    logger.info('URL', URL.url, 'Responce=', 'Password changed Successfully...', 'Email=', email);
                                                                    return;
                                                                }
                                                                else
                                                                {
                                                                    console.log('Error for deleting OTP code', err);
                                                                    res.json({'code': 200,'status': 'Error','message': 'Error for deleting OTP code'});
                                                                    logger.error('URL', URL.url,'Responce=','Error for deleting OTP code');
                                                                    return;
                                                                }
                                                            });
                                                    }
                                                    else
                                                    {
                                                        console.log('Error for updating password', err);
                                                        res.json({'code': 200,'status': 'Error','message': 'Error for updating password'});
                                                        logger.error('URL', URL.url,'Responce=','Error for updating password');
                                                        return;
                                                    }
                                                });
                                        }
                                        else
                                        {
                                            console.log('Error for Selecting otp data', err);
                                            res.json({'code': 200,'status': 'Error','message': 'Error for Selecting otp data'});
                                            logger.error('URL', URL.url,'Responce=','Error for Selecting otp data');
                                            return;
                                        }
                                    });
                            }
                            else
                            {
                                console.log('OTP code not match');
                                res.json({'code': 200, 'status': 'Error', 'message': 'OTP code not match'});
                                logger.error('URL', URL.url,'Responce=','OTP code not match');
                                return;
                            }
                        }
                        else
                        {
                            console.log('Error for count otp number', err);
                            res.json({'code': 200, 'status': 'Error', 'message': 'Error for count otp number'});
                            logger.error('URL', URL.url,'Responce=','Error for count otp number');
                            return;
                        }
                    });
                    connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
}
//***** /user/forgotPassword
exports.ForgotPassword = function (req, res)
{
    console.log("*** Staging Requested for ForgotPassword... ***");
    logger.info('*** Staging Requested for ForgotPassword... ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        pool.getConnection(function (err, connection) {
            if (!err)
            {
                email = req.body.email
                connection.query('select count(email) as email from users where email=?', [email],
                    function (err, totaluser) {
                        if (!err)
                        {
                            if (totaluser[0].email == 1) {
                                console.log('User Found');
                                var otp = Math.floor(1000 + Math.random() * 9000);
                                connection.query("select * from users where email=?", [email],
                                    function (err, user_data) {
                                        if (!err)
                                        {
                                            password = user_data[0].password
                                            user_id = user_data[0].id
                                            var helper = require('sendgrid').mail
                                            from_email = new helper.Email('anshul@applabs.media')
                                            to_email = new helper.Email(email)
                                            subject = 'Reset your password'
                                            content = new helper.Content('text/plain', 'Your OTP code is ' + otp)
                                            mail = new helper.Mail(from_email, subject, to_email, content)

                                            var sg = require('sendgrid')('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');

                                            var request = sg.emptyRequest({
                                                method: 'POST',
                                                path: '/v3/mail/send',
                                                body: mail.toJSON()
                                            });

                                            sg.API(request, function (error, response) {
                                                if (!error) {

                                                    connection.query('select count(user_id) as user_id_count from otp where user_id=?', [user_id],
                                                        function (err, user_count) {
                                                            if (!err)
                                                            {
                                                                if (user_count[0].user_id_count == 1) {
                                                                    //update optData
                                                                    connection.query('update otp set otp_number=? where user_id=?', [otp, user_id],
                                                                        function (err, update_opt) {
                                                                            if (!err)
                                                                            {
                                                                                console.log('OTP Code update');
                                                                                connection.query('select * from otp where user_id=?', [user_id],
                                                                                    function (err, otp_data) {
                                                                                        if (!err)
                                                                                        {
                                                                                            console.log('Please check your email for the code and enter it on the next screen');
                                                                                            res.json({'code': '200','status': 'Success','message': 'Please check your email for the code and enter it on the next screen','optData': otp_data});
                                                                                            logger.info('URL', URL.url, 'Responce=', 'OTP send Successfully...', 'Email=', email);
                                                                                            return;
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            console.log('Error for Reseleting opt data', err);
                                                                                            res.json({'code': '200','status': 'Error','message': 'Error for Reseleting opt data'});
                                                                                            logger.error('URL', URL.url,'Responce=','Error for Reseleting opt data');
                                                                                            return;
                                                                                        }
                                                                                    });
                                                                            }
                                                                            else
                                                                            {
                                                                                console.log('Error for updating opt', err);
                                                                                res.json({'code': 200,'status': 'Error','message': 'Error for updating opt'});
                                                                                logger.error('URL', URL.url,'Responce=','Error for updating opt');
                                                                                return;
                                                                            }
                                                                        });
                                                                }
                                                                else
                                                                {
                                                                    var now = new Date();
                                                                    var dateTime = date.format(now, 'YYYY/MM/DD HH:mm:ss');
                                                                    opt_data = [user_id, otp, dateTime]
                                                                    connection.query('insert into otp(user_id,otp_number,time) values(?)', [opt_data],
                                                                        function (err, opt_inserted) {
                                                                            if (!err)
                                                                            {
                                                                                console.log('otp data inserted');
                                                                                connection.query('select * from otp where user_id=?', [user_id],
                                                                                    function (err, otp_data) {
                                                                                        if (!err)
                                                                                        {
                                                                                            console.log('Please check your email for the code and enter it on the next screen');
                                                                                            res.json({'code': '200','status': 'Success','message': 'Please check your email for the code and enter it on the next screen','optData': otp_data});
                                                                                            logger.info('URL', URL.url, 'Responce=', 'OTP send Successfully...', 'Email=', email);
                                                                                            return;
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            console.log('Error for seleting opt data', err);
                                                                                            res.json({'code': '200','status': 'Error','message': 'Error for seleting opt data'});
                                                                                            logger.error('URL', URL.url,'Responce=','Error for seleting opt data');
                                                                                            return;
                                                                                        }
                                                                                    });

                                                                            }
                                                                            else
                                                                            {
                                                                                console.log('Error for inserting otp data', err);
                                                                                res.json({'code': '200','status': 'Error','message': 'Error for inserting otp data'});
                                                                                logger.error('URL', URL.url,'Responce=','Error for inserting otp data');
                                                                                return;
                                                                            }
                                                                        });
                                                                }
                                                            }
                                                            else
                                                            {
                                                                console.log('Error for count user from otp table', err);
                                                                res.json({'code': '200','status': 'Error','message': 'Error for count user from otp table'});
                                                                logger.error('URL', URL.url,'Responce=','Error for count user from otp table');
                                                                return;
                                                            }
                                                        });
                                                }
                                                else
                                                {
                                                    console.log('Error for sending otp code to user email', error);
                                                    res.json({'code': 200,'status': 'Error','message': 'Error for sending otp code to user email'});
                                                    logger.error('URL', URL.url,'Responce=','Error for sending otp code to user email');
                                                    return;
                                                }

                                            })
                                        }
                                        else
                                        {
                                            Errors.SelectUserError(res,err);
                                        }
                                    });
                            }
                            else {
                                console.log('Email id not found for end opt code');
                                res.json({
                                    'code': 404,
                                    'status': 'not found',
                                    'message': 'Email id not found for send OTP code'
                                });
                                logger.error('URL', URL.url,'Responce=','Email id not found for end opt code');
                                return;
                            }

                        }
                        else {
                            console.log('Error for selecting email id', err);
                            res.json({'code': 200, 'status': 'Error', 'message': 'Error for selecting email id'});
                            logger.error('URL', URL.url,'Responce=','Error for selecting email id');
                            return;
                        }
                    });
                    connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
}

exports.changePassword = function (req, res)
{
    console.log("*** Staging Requested for changePassword... ***");
    logger.info('*** Staging Requested for changePassword... ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        var validpassword = req.checkBody('newpassword', 'Password length should be minimum 8 digit').len(8, 100).validationErrors.length;
        if (validpassword)
        {
            console.log("*** Redirecting: Password length should be minimum 8 digit");
            res.json({"code": 200, "status": "Error", "message": "Password length should be minimum 8 digit"});
            return;
        }
        else
        {
            pool.getConnection(function (err, connection) {
                if (!err)
                {
                    email = req.user.email
                    connection.query('select * from users where email=?', [email],
                        function (err, user_detail) {
                            if (!err)
                            {
                                user_id = user_detail[0].id
                                password = user_detail[0].password
                                oldpass = req.body.oldpassword
                                newpass = req.body.newpassword
                                if (bcrypt.compareSync(oldpass, user_detail[0].password))
                                {
                                    var newpassword = bcrypt.hashSync(newpass, bcrypt.genSaltSync(8));
                                    connection.query('update users set old_password=?,password=? where id=?', [user_detail[0].password, newpassword, user_id],
                                        function (err, update_password) {
                                            if (!err)
                                            {
                                                connection.query('select * from users where id=?', [user_id],
                                                    function (err, updated_user) {
                                                        if (!err)
                                                        {
                                                            console.log('Password Change Successfully...');
                                                            res.json({
                                                                'code': 200,
                                                                'status': 'Success',
                                                                'message': 'Password Change Successfully...',
                                                                'changepasswordData': updated_user
                                                            });
                                                            logger.info('URL', URL.url, 'Responce=', 'Password Change Successfully...', 'Email=', email);
                                                            return;
                                                        }
                                                        else
                                                        {
                                                            console.log('Error for selecing updated users', err);
                                                            res.json({
                                                                'code': 200,
                                                                'status': 'Error',
                                                                'message': 'Error for selecing updated users'
                                                            });
                                                            logger.error('URL', URL.url,'Responce=','Error for selecing updated users');
                                                            return;
                                                        }
                                                    });
                                            }
                                            else
                                            {
                                                console.log('Password Update Error', err);
                                                res.json({
                                                    'code': 200,
                                                    'status': 'Error',
                                                    'message': 'Password Update Error'
                                                });
                                                logger.error('URL', URL.url,'Responce=','Password Update Error');
                                                return;
                                            }
                                        });
                                }
                                else
                                {
                                    console.log('Unauthorize user,\n Password not match');
                                    res.json({
                                        'code': 200,
                                        'status': 'Error',
                                        'message': "Unauthorised user \nOld password does not match."
                                    });
                                    logger.error('URL', URL.url,'Responce=','Unauthorize user, Password not match');
                                    return;
                                }

                            }
                            else
                            {
                                Errors.SelectUserError(res,err);
                            }
                        });
                          connection.release();
                }
                else
                {
                    Errors.Connection_Error(res);
                }
            });
        }
    }
}

exports.signup = function (req, res)
{
    console.log("*** Staging Requested for Creating New User... ***");
    logger.info('*** Staging Requested for Creating New User... ***');
    receivedValues = req.body
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        console.log("*** Validating User Details... ");
        usercolumns = ["firstname", "lastname", "dob", "gender", "phone", "province","email", "password", "country", "city", "is_social", "is_professional", "address", "zip", "img_path", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];
        var dbValues = [];
        var checkProfessional = false;
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];
            if (columnName == 'email')
            {
                email1 = req.body.email;
                if (validator.isEmail(email1))
                {
                    console.log('Email is vaild');
                }
                else
                {
                    console.log('Email is not valid');
                    res.json({"code": 200, "status": "Error", "message": "Email is not Valid"});
                    logger.error('URL', URL.url,'Responce=','Email is not valid');
                    return;
                }
            }
            if ((receivedValues[columnName] == undefined || receivedValues[columnName] == "") && (columnName == 'email' || columnName == 'password'))
            {
                console.log("*** Redirecting: ", columnName, " field is required");
                res.json({"code": 200, "status": "Error", "message": columnName + " field is undefined"});
                logger.error('*** Redirecting: ', columnName, ' field is required');
                return;
            }
            else if (receivedValues[columnName] !== undefined && receivedValues[columnName] !== "" && columnName == 'password')
            {
                var validpassword = req.checkBody('password', 'Password length should be minimum 8 digit').len(8, 100).validationErrors.length
                if (validpassword)
                {
                    console.log("*** Redirecting: Password length should be minimum 8 digit");
                    res.json({"code": 200, "status": "Error", "message": "Password length should be minimum 8 digit"});
                    logger.error('URL', URL.url,'Responce=','Password length should be minimum 8 digit');
                    return;
                }
                else
                {
                    receivedValues.password = bcrypt.hashSync(receivedValues.password, bcrypt.genSaltSync(8))
                }
            }
            if (columnName == "is_professional")
            {
                if (receivedValues[columnName] == true)
                {
                    checkProfessional = true;
                }
            }
            if (receivedValues[columnName] == undefined || receivedValues[columnName] == "")
            {
                dbValues[iter] = '';
            }
            else
            {
                dbValues[iter] = receivedValues[columnName];
            }
        }
        //Check user is professional

        if (checkProfessional)
        {
            receivedValues.is_professional = true;
        }
        //CREATING CONNECTION

        pool.getConnection(function (err, connection) {
            if (err)
            {
                Errors.Connection_Error(res);
            }
            else
            {

                tableName = "users";
                connection.query('select count(id) as count from ?? where email=?', [tableName, req.body.email],
                    function (err, rows) {
                        if (err)
                        {
                            console.log('Error for select data', err);
                            res.json({'code': 200, 'status': 'Error', 'message': 'Error for select data'});
                            logger.error('URL', URL.url,'Responce=','Error for select data');
                            return;
                        }
                        else
                        {
                            if (rows[0].count > 0)
                            {
                                console.log('Email id alredy created	');
                                res.json({"code": 200, "status": "Error", "message": "Email id already registered"});
                                logger.error('URL', URL.url,'Responce=','Email id alredy created');
                                return;
                            }
                            else
                            {
                                connection.query('INSERT INTO users(??) VALUES (?)', [usercolumns, dbValues],
                                    function (err, rows) {
                                        if (!err)
                                        {
                                            console.log('*** Redirecting: User Created \n');
                                            tableName = "users";
                                            //CHECKING USERNAME EXISTENCE
                                            var email = req.body.email;
                                            connection.query('SELECT * FROM users WHERE email = ?', [email],
                                                function (err, rows) {
                                                    if (!err)
                                                    {
                                                        is_professional = rows[0].is_professional
                                                        if (rows.length == 1)
                                                        {
                                                            var token = jwt.sign(receivedValues, config.secret, {
                                                                expiresIn: 1440 * 60 * 30 // expires in 1440 minutes
                                                            });
                                                            res.json({
                                                                'code': 200,
                                                                'status': 'Success',
                                                                'token': token,
                                                                'userData': rows
                                                            });
                                                            logger.info('URL', URL.url, 'Responce=', 'User Account Created Successfully...', 'Email=', email);

                                                            return;
                                                        }
                                                        else
                                                        {
                                                            console.log("*** Redirecting: Your email and/or password is incorrect. Please try again", err);
                                                            res.json({"code": 200,"status": "Error","message": "Your email and/or password is incorrect. Please try again"});
                                                            logger.error('URL', URL.url,'Responce=','Your email and/or password is incorrect. Please try again');
                                                            return;
                                                        }
                                                    }
                                                    else
                                                    {
                                                        Errors.SelectUserError(res,err);
                                                    }
                                                });
                                        }
                                        else
                                        {
                                              console.log('Error for inserting data',err);
                                              res.json({'code':200,'status':'Error','message':'Error for inserting data'});
                                              logger.error('URL', URL.url,'Responce=','Error for inserting data');
                                              return;
                                        }
                                    });
                            }
                        }
                    });
                    connection.release();
            }
        });

    }

};


exports.signin = function (req, res)
{
    console.log("*** Staging Requested for staging Authenticating User... ***");
    logger.info('*** Staging Requested for staging Authenticating User... ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        usercolumns = ["email", "password"];
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];
            if (receivedValues[columnName] == undefined && (columnName == 'email' || columnName == 'password'))
            {
                console.log("*** Redirecting: ", columnName, " field is required")
                res.json({"code": 200, "status": "Error", "message": columnName + " field is undefined"});
                logger.error('*** Redirecting: ', columnName, ' field is required');
                return;
            }
            else if (receivedValues[columnName] !== undefined || receivedValues[columnName] !== "")
            {
                if (columnName == 'password')
                {
                    var validpassword = req.checkBody('password', 'Password length should be minimum 8 digit').len(8,100).validationErrors.length;
                    if (validpassword)
                    {
                        logger.error('url=', URL.url,'Responce=', 'Password length should be minimum 8 digit', 'Email id=', req.body.email);
                        console.error('Password length should be minimum 8 digit');
                        res.json({
                            "code": 200,
                            "status": "Error",
                            "message": "Password length should be minimum 8 digit"
                        });
                        return;
                    }
                }
            }
        }
        //connection
        pool.getConnection(function (err, connection) {
            if (!err)
            {
                console.log('*** Mysql Connection established with ', config.database, ' and connected as id ' + connection.threadId);
                //CHECKING USERNAME EXISTENCE
                email = receivedValues.email
                connection.query('SELECT * FROM users WHERE email = ?', [email],
                    function (err, rows) {
                        if (!err)
                        {
                            if (rows.length == 1)
                            {
                                if (bcrypt.compareSync(req.body.password, rows[0].password))
                                {
                                    var alldata = rows;
                                    var userid = rows[0].id;
                                    var tokendata = (receivedValues, userid);
                                    var token = jwt.sign(receivedValues, config.secret, {
                                        expiresIn: 1440 * 60 * 30 // expires in 1440 minutes
                                    });
                                    console.log("*** Authorised User");
                                    res.json({
                                        "code": 200,
                                        "status": "Success",
                                        "token": token,
                                        "userData": alldata,
                                        "message": "Authorised User!"
                                    });
                                    logger.info('url=', URL.url, 'Responce=', 'User Signin, username', req.body.email, 'User Id=', rows[0].id);
                                    return;
                                }
                                else
                                {
                                    console.log("*** Redirecting: Unauthorised User");
                                    res.json({"code": 200, "status": "Fail", "message": "Unauthorised User!"});
                                    logger.error('URL', URL.url,'Responce=','*** Redirecting: Unauthorised User');
                                    return;
                                }
                            }
                            else
                            {
                                console.error("*** Redirecting: No User found with provided name");
                                res.json({
                                    "code": 200,
                                    "status": "Error",
                                    "message": "No User found with provided name"
                                });
                                logger.error('url=', URL.url, 'Responce=','No User found with provided name');
                                return;
                            }
                        }
                        else
                        {
                            Errors.SelectUserError(res,err);
                        }
                    });
                connection.on('error', function (err) {
                    console.log('*** Redirecting: Error Creating User...');
                    res.json({"code": 200, "status": "Error", "message": "Error Checking Username Duplicate"});
                    return;
                });
                connection.release();
            }
            else
            {
                Errors.Connection_Error(res);
            }
        });
    }
}

//FOR EDITING/UPDATING USERS
exports.edit = function (req, res)
{
    console.log("*** Staging Requested for EDITING/UPDATING User... ***");
    logger.info('*** Staging Requested for EDITING/UPDATING User... ***');
    receivedValues = req.body //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        var updateString = "";
        console.log("*** Validating User Details... ");
        usercolumns = ["firstname", "lastname", "dob", "gender", "phone", "country", "city", "province","is_social", "is_professional", "address", "zip", "img_path", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];
        var dbValues = [];
        var tmpcolumnName = [];
        var is_update = false;
        //FOR VALIDATING VALUES BEFORE SUBMISSION
        for (var iter = 0; iter < usercolumns.length; iter++)
        {
            columnName = usercolumns[iter];

            if (receivedValues[columnName] != undefined)
            {
                dbValues[iter] = receivedValues[columnName];
                tmpcolumnName[iter] = usercolumns[iter];
                if (updateString == "")
                    updateString = columnName + "='" + receivedValues[columnName] + "'";
                else
                    updateString = updateString + "," + columnName + "='" + receivedValues[columnName] + "'";
            }


        }
        //CREATING POOL CONNECTION
        pool.getConnection(function (err, connection) {
            if (err)
            {
                Errors.Connection_Error(res);
            }
            else
            {
                console.log('*** Mysql POOL Connection established with ', config.database, ' and connected as id ' + connection.threadId);
                tableName = "users";
                var email = req.user.email;
                selectQuery = "SELECT count( id ) as count FROM ?? WHERE email = ?";
                connection.query(selectQuery, [tableName, [req.user.email]],
                    function (err, rows) {
                        if (!err)
                        {
                            if (rows[0].count == 1) {
                                connection.query('select * from users where email=?', [req.user.email],
                                function (err, rows) {
                                    if (err)
                                    {
                                          Errors.SelectUserError(res,err);
                                    }
                                    else
                                    {
                                        //INSERTING DATA
                                        console.log('updateString', updateString);
                                        console.log('db VALUES', dbValues);
                                        city=rows[0].city
                                        if(city=="")
                                        {
                                            //Send Mail first Time Edit(after signup)
                                          if(req.body.is_professional==1)
                                          {
                                              EmailFor.ProfessionalSignup(email);
                                              console.log('Mail Sened to professional',email);
                                          }
                                          else
                                          {
                                              EmailFor.CustmerSignup(email);
                                              console.log('Email send to customer',email);
                                          }
                                        }
                                        //updateQuery = "UPDATE ?? set " + updateString + " WHERE id=?",
                                        user_id=rows[0].id
                                            connection.query("UPDATE ?? set " + updateString + " WHERE id=?", [tableName, user_id],
                                            function (err, rowsdata) {
                                                if (!err)
                                                {
                                                    connection.query('select id,firstname,lastname,dob,gender,phone,country,city,province,is_available,is_social,is_professional,address,zip,img_path,Q1,Q2,Q3,Q4,Q5,Q6 from users where email=?', [req.user.email],
                                                    function (err, updata) {
                                                        if (err)
                                                        {
                                                            console.log('Error for seleting data', err);
                                                            res.json({'code': 200,'status': 'Error','message': 'Error for seleting data'});
                                                            logger.error('URL', URL.url,'Responce=','Error for seleting data');
                                                            return;
                                                        }
                                                        else
                                                        {
                                                            console.log('User Updated');
                                                            res.json({"code": 200,"status": "Success","userData": updata,"message": "User Updated"});
                                                            logger.info('url=', URL.url, 'Responce=', 'User Updated, Email', req.body.email);
                                                            //name = updata[0].firstname + " " + updata[0].lastname
                                                            //EmailFor.EditProfile(email,name);
                                                            return;
                                                        }
                                                    });
                                                }
                                                else
                                                {
                                                    console.log('*** Redirecting: Error Updating User...', err);
                                                    res.json({"code": 200,"status": "Error","message": "Error Updating User"});
                                                    logger.error('URL', URL.url,'Responce=','*** Redirecting: Error Updating User...');
                                                    return;
                                                }
                                            });
                                    }
                                });
                            }
                            else
                            {
                                console.log('*** Redirecting: Email not registered', err);
                                res.json({"code": 200, "status": "Error", "message": "Email not registered"});
                                logger.error('URL', URL.url,'Responce=','*** Redirecting: Email not registered');
                                return;
                            }
                        }
                        else
                        {
                            console.log('Error for Checking Dublicate user', err);
                            res.json({"code": 200, "status": "Error", "message": "Error Checking Email Duplicate"});
                            logger.error('URL', URL.url,'Responce=','Error for Checking Dublicate user');
                            return;
                        }
                    });

                connection.on('error', function (err) {
                    console.log('*** Redirecting: Error Creating User...');
                    res.json({"code": 200, "status": "Error", "message": "Error Checking Username Duplicate"});
                    logger.error('URL', URL.url,'Responce=','*** Redirecting: Error Creating User...');
                    return;
                });
                  connection.release();
            }
        });

    }
}

//alldetail of Current user

exports.alldetail = function (req, res)
{
    console.log("*** Staging Requested for Get User Details... ***");
    logger.info('*** Staging Requested for Get User Details... ***');
    pool.getConnection(function (err, connection) {
        if (err)
        {
            Errors.Connection_Error(res);
        }
        else
        {

            email = req.user.email;
            tableName = 'users'
            connection.query('select * from ?? where email=?', [tableName, email],
                function (err, rows) {
                    if (err)
                    {
                          Errors.SelectUserError(res,err);
                    }
                    else
                    {
                        id = rows[0].id;
                        console.log(id);
                        connection.query('select ar.* from users u,appointment_request ar where ar.user_id=?', [id],
                            function (err, data) {
                                if (err)
                                {
                                    console.log('Error for selecting data', err);
                                    res.json({'code': 200, 'status': 'Error', 'message': 'Error for selecting data'});
                                    logger.error('URL', URL.url,'Responce=','Error for selecting data');
                                    return;
                                }
                                else
                                {
                                    console.log('User detail with appointment payment', data);
                                    res.json({
                                        'code': 200,
                                        'status': 'Success',
                                        'message': 'User detail with appointment payment',
                                        'data': rows,
                                        'Appointment Requested': data
                                    });
                                    logger.info('url=', URL.url, 'Responce=', 'User detail Selected, Email', req.body.email);
                                    return;
                                }
                            });
                    }
                });
                  connection.release();
        }
    });

}
// exports.getimage = function (req, res)
// {
// 	// Show files
// 	file = req.params.file;
// 	var img = fs.readFileSync("./profile_img/" + file);
//
// 	res.end(img, 'binary');
// }
//
// exports.imageUpload = function (req, res)
// {
// 	console.log('tempPath =', req.files.image.path);
// 	console.log('ext =', path.extname(req.files.image.name).toLowerCase());
// 	console.log('targetPath =', path.resolve('./profile_img/' + '163' + '.jpg'));
//
// 	pool.getConnection(function (err, connection) {
// 		connection.release();
// 		if (!err)
// 		{
// 			email = req.user.email
// 				connection.query('select * from users where email=?', [email],
// 					function (err, user) {
// 					if (!err)
// 					{
// 						user_id = user[0].id
// 							var tempPath = req.files.image.path;
// 						var ext = path.extname(req.files.image.name).toLowerCase();
// 						var targetPath = path.resolve('./profile_img/' + user_id + ext);
// 						if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif')
// 						{
// 							var image_name = user_id + ext;
// 							/*encode=new Buffer(image_name).toString('base64')
// 							console.log(encode);
// 							decoded=new Buffer(encode, 'base64').toString('ascii');
// 							console.log(decoded);
// 							 */
// 							var inStr = fs.createReadStream(tempPath);
// 							var outStr = fs.createWriteStream(targetPath);
// 							inStr.pipe(outStr);
//
// 							//save profile image to database
// 							connection.query('update users set img_path=? where id=?', [image_name, user_id],
// 								function (err, imagesave) {
// 								if (!err)
// 								{
// 									console.log('Profile Picture Uploaded ..');
// 									res.json({
// 										'code' : 200,
// 										'status' : 'Success',
// 										'message' : 'Profile Picture Uploaded ..',
// 										'image_path' : targetPath
// 									});
// 									return;
// 								}
// 								else
// 								{
// 									console.log('can not update ..', err);
// 									res.json({
// 										'code' : 200,
// 										'status' : 'Success',
// 										'message' : err
// 									});
// 									return;
// 								}
// 							});
//
// 						}
// 						else
// 						{
// 							console.log('File type must be image', err);
// 							res.json(500, {
// 								error : 'Only image files are allowed.'
// 							});
//
// 						}
// 					}
// 					else
// 					{
// 						console.error('select user error', err);
// 						res.json({
// 							'code' : 200,
// 							'status' : 'Error'
// 						});
// 						return;
// 					}
// 				});
// 		}
// 		else
// 		{
// 			console.log('connection Error', err);
// 			res.json(constants.error.msg_connection_fail);
// 			return;
// 		}
// 	});
// };
