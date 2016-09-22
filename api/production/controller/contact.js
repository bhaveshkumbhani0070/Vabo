var mysql = require('mysql'); //For mysql Connection
var express = require('express')
var config = require('../config/config'); //For App configuration
var app = express();
var logger = require('./log');
var pool = require('../config/db');
var URL = require('../../app.js');
var Errors = require('../constants/functions.js');
var Tokens = require('./getFCMtokens.js');
var EmailFor=require('../config/email.js');

exports.Create_contact=function(req,res)
{
  console.log("*** Requested for Appointment Help ");
	logger.info('*** Requested for Appointment Help ');
  receivedValues = req.body    //DATA FROM WEB
  if(JSON.stringify(receivedValues) === '{}')
  {
      	Errors.EmptyBody(res);
  }
  else
  {
      pool.getConnection(function(err,connection){
          if(!err)
          {
              email=req.user.email
              connection.query('select * from users where email=?',[email],
                    function(err,rows){
                        if(!err)
                        {
                              user_id=rows[0].id
                              fullname=rows[0].firstname+" "+rows[0].lastname
                              message=req.body.message
                              connection.query('insert into contact(email,message,fullname,user_id) values(?,?,?,?)',[email,message,fullname,user_id],
                              function(err,datainsert){
                                if(!err)
                                {
                                    connection.query('select * from contact where id=?',[datainsert.insertId],
                                    function(err,contactdetail){
                                        if(!err)
                                        {
                                            console.log('contact Successfully...',contactdetail);
                                            res.json({'code':200,'status':'Success','message':'contact Successfully...','contactData':contactdetail});
																						logger.info('URL=',URL.url,'Responce=','contact Successfully...','Email id=',email);

																						firstname=rows[0].firstname
                                            //EmailFor.ContactUsCreateEmail(email,firstname);
                                            return;
                                        }
                                        else
                                        {
                                            console.log('Error for selecting detail for contact',err);
                                            res.json({'code':200,'status':'Error','message':'Error for selecting detail for contact'});
																						logger.error('URL=',URL.url, 'Responce=','Error for selecting detail for contact');
																						return;
                                        }
                                    });
                                }
                                else
                                {
                                    console.log('Error for inserting  contact...',err);
                                    res.json({'code':200,'status':'Error','message':'Error for inserting contact...'});
																		logger.error('URL=',URL.url, 'Responce=','Error for inserting  contact...');
																		return;
                                }
                              });
                          }
                          else
                          {
                              console.log('Select data error',err);
															res.json({'code':200,'status':'Error','message':'Select data error'});
															logger.error('URL=',URL.url, 'Responce=','Select data error');
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
