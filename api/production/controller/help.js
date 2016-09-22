var mysql = require('mysql'); //For mysql Connection
var express = require('express')
var config = require('../config/config'); //For App configuration
var app = express();
var logger = require('./log');
var URL = require('../../app.js');
var pool = require('../config/db');
var Errors = require('../constants/functions.js');


exports.helpquetion=function(req,res)
{
	pool.getConnection(function(err,connection){
			if(!err)
			{
				connection.query('select * from help_question',
				function(err,helpquetion){
						if(!err)
						{
								console.log('help quetion',helpquetion);
								res.json({'code':200,'status':'Success','message':'help quetion get','helpquetion':helpquetion});
								return;
						}
						else
						{
								console.log('Error for selecting help quetion',err);
								res.json({'code':200,'status':'Error','message':'Error for selecting help quetion','helpquetion':helpquetion});
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


exports.GetQuestions=function(req,res)
{
	console.log('*** Requested for Get Quetions and Answer ***');
	logger.info('*** Requested for Get Quetions and Answer ***');

	pool.getConnection(function(err,connection){
			if(!err)
			{
					email=req.user.email
					connection.query('select * from users where email=?',[email],
					function(err,rows){
							if(!err)
							{
									is_professional=rows[0].is_professional
									connection.query('select * from help_question where help_isProfessional=?',[is_professional],
									function(err,helpData){
											if(!err)
											{
													console.log('Help quetion and ans selected',helpData);
													res.json({'code':200,'status':'Success','message':'Help quetions and Answer selected','helpData':helpData});
													logger.info('URL=', URL.url, 'Responce=', 'Help quetion and ans selected', 'Email id=', email);
	                        return;
											}
											else
											{
													console.log('Error for selecting help_quetion',err);
													res.json({'code':200,'status':'Error','message':'Error for selecting Help_quetion data'});
													logger.error('URL=',URL.url, 'Responce=','Error for selecting help_quetion','Email id=', email);
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

exports.Create_help=function(req,res)
{
		console.log("*** Requested for Appointment Help ***");
		logger.info('*** Requested for Appointment Help	***');
		receivedValues = req.body    //DATA FROM WEB
		if(JSON.stringify(receivedValues) === '{}')
		{
					Errors.EmptyBody(res);
		}
		else
		{
			helpcolumn=['appointment_request_id','message'];
			var dbValues = [];
			for(var iter=0;iter<helpcolumn.length;iter++)
			{
					columnName = helpcolumn[iter];
					var data=req.body
					if((data == undefined || data == "")&& (columnName=="appointment_request_id" || columnName=="message"))
					{
							console.log("*** Redirecting: ",columnName," field is required")
							res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
							return;
					}
					dbValues[iter] = receivedValues[columnName];
			}
					pool.getConnection(function(err,connection){
					if(!err)
					{

							email=req.user.email
							connection.query('select * from users where email=?',[email],
							function(err,rows){
									if(!err)
									{
											message=req.body.message
											appointment_request_id=req.body.appointment_request_id
											user_id=rows[0].id
											is_professional=rows[0].is_professional
											if(is_professional==0)
											{
													//client
													user_type=0
											}
											else
											{
													//professional
													user_type=1
											}
											connection.query('insert into help(??,user_id,user_type) values(?,?,?)',[helpcolumn,dbValues,user_id,user_type],
											function(err,inserted){
													if(!err)
													{
																connection.query('select * from help where id=?',[inserted.insertId],
																function(err,lasthelp){
																		if(!err)
																		{
																					console.log('Help request sended Successfully...',lasthelp);
																					res.json({'code':200,'status':'Success','message':'Help request sended Successfully...','helpData':lasthelp});
																					logger.info('URL=',URL.url,'Responce=','Help request sended Successfully...','Email id=',email);
																					return;
																		}
																		else
																		{
																				console.log('Error for select data from help',err);
																				res.json({'code':200,'status':'Error','message':'Error for select data from help'});
																				logger.error('URL=',URL.url, 'Responce=','Error for select data from help');
																				return;
																		}
																});
													}
													else
													{
															console.log('Error for send help',err);
															res.json({'code':200,'status':'Error','message':'Error for send help'});
															logger.error('URL=',URL.url, 'Responce=','Error for send help');
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
