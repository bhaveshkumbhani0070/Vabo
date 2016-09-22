var mysql	=	require('mysql');
var config	=	require('../config/config');
var jwt		=	require('jsonwebtoken');
var fs		=	require('fs');
var busboy	=	require('connect-busboy');
var URL=require('../../app.js');
var logger = require('./log');
var date = require('date-and-time');
var FCM = require('fcm-node');
var constants = require('../constants/constants.json');
//var sendGrid = require('sendgrid')('app53502334@heroku.com', 'mpzxi6n17956');
var SendGridKey = require("../config/sendgrid.js");
var pool = require('../config/db');

var fs = require('fs');
var path = require('path');
var async=require('async');

exports.SendMailBooking=function(email,date,eventName,subject,bodycontent,from_email)
{

	var ics = require('ics');
	var options = {
		eventName: eventName,
		filename: 'event.ics',
		dtstart: date,
		//dtend:enddate,
		//location: 'Here and there',
		email: {
			//name: name,
			email: email
		}
	};
	ics.createEvent(options, null, function(err, calendar) {
		if (!err)
		{
				console.log('Event file',calendar);
				var filePath = path.join('vabo_email', 'email.html');
					fs.readFile(filePath, {encoding: 'utf-8'},
					function(err, data) {
							if ( ! err )
							{
									var helper = require('sendgrid').mail;
									//from_email = new helper.Email('booking@callvabo.com')
									from_email = new helper.Email(from_email)
									to_email = new helper.Email(email)
									subject = subject
									var tmp_data = data
									fs.readFile(calendar,{encoding:'utf-8'},
									function(err,cal_data){
											if(!err)
											{
													//Dynamic content
													//var data = tmp_data.replace("$content", bodycontent).replace("$calendar",cal_data)
													var data = tmp_data.replace("$content", bodycontent)
													content = new helper.Content('text/html', data)
													mail = new helper.Mail(from_email, subject, to_email, content);

													var base64Content = fs.readFileSync(calendar).toString('base64');
													mail.attachments = [{'filename': 'calendar.ics', 'content': base64Content, 'type': 'text/Calendar'}]
													//mail.attachments = [{'filename': 'calendar.ics', 'content': calendar, 'type': 'text/Calendar'}]

													var sg = require('sendgrid')(SendGridKey.SendGridKey);
													var requestBody = mail.toJSON();
													var request = sg.emptyRequest();
													request.method = 'POST';
													request.path = '/v3/mail/send';
													request.body = requestBody;

													sg.API(request, function (error, response) {
													if ( ! error )
													{
															console.log('mail Send Successfully to',email);
													}
													else
													{
															console.log('Error for SendGrid',error);
													}
												});
											}
											else
											{
													console.log('Error for encoding calendar data',err);
											}
									});

							}
							else
							{
									console.log('Error for selcting html templete',err);
							}
						});
		}
		else
		{
				console.log('Error for Creating Event',err);
		}

	});
}

exports.SendMail=function(email,subject,bodycontent)
{
	var filePath = path.join('vabo_email', 'email.html');

	fs.readFile(filePath, {encoding: 'utf-8'},
	function(err, data) {
			if ( ! err )
			{
					var helper = require('sendgrid').mail;

					from_email = new helper.Email('booking@callvabo.com')
					to_email = new helper.Email(email)
					subject = subject
					//Dynamic content
					var data = data.replace("$content", bodycontent)

					content = new helper.Content('text/html', data)

					mail = new helper.Mail(from_email, subject, to_email, content);

					var sg = require('sendgrid')(SendGridKey.SendGridKey);

					var requestBody = mail.toJSON();
					var request = sg.emptyRequest();
					request.method = 'POST';
					request.path = '/v3/mail/send';
					request.body = requestBody;

					sg.API(request, function (error, response) {
						if ( ! error )
						{
								console.log('mail send Successfully to ',email);
						}
						else
						{
								console.log('Error for Sendgrid',error);
						}
					});
			}
			else
			{
					console.log('Error with file path',err);
			}
	});
}

exports.HelpMail=function(email,subject,bodycontent)
{
	var filePath = path.join('vabo_email', 'email.html');

	fs.readFile(filePath, {encoding: 'utf-8'},
	function(err, data) {
			if ( ! err )
			{
					var helper = require('sendgrid').mail;

					from_email = new helper.Email('help@callvabo.com')
					to_email = new helper.Email(email)
					subject = subject
					//Dynamic content
					var data = data.replace("$content", bodycontent)

					content = new helper.Content('text/html', data)

					mail = new helper.Mail(from_email, subject, to_email, content);

					var sg = require('sendgrid')(SendGridKey.SendGridKey);

					var requestBody = mail.toJSON();
					var request = sg.emptyRequest();
					request.method = 'POST';
					request.path = '/v3/mail/send';
					request.body = requestBody;

					sg.API(request, function (error, response) {
						if ( ! error )
						{
								console.log('mail send Successfully to',email);
						}
						else
						{
								console.log('Error in SendGrid ',error);
						}
					});
			}
			else
			{
					console.log('Error for File path',err);
			}
	});
}

exports.InfoMail=function(email,subject,bodycontent)
{
	var filePath = path.join('vabo_email', 'email.html');

	fs.readFile(filePath, {encoding: 'utf-8'},
	function(err, data) {
			if ( ! err )
			{
					var helper = require('sendgrid').mail;

					from_email = new helper.Email('info@callvabo.com')
					to_email = new helper.Email(email)
					subject = subject
					//Dynamic content
					var data = data.replace("$content", bodycontent)

					content = new helper.Content('text/html', data)

					mail = new helper.Mail(from_email, subject, to_email, content);

					var sg = require('sendgrid')(SendGridKey.SendGridKey);

					var requestBody = mail.toJSON();
					var request = sg.emptyRequest();
					request.method = 'POST';
					request.path = '/v3/mail/send';
					request.body = requestBody;

					sg.API(request, function (error, response) {
						if ( ! error )
						{
								console.log('mail send Successfully to ',email);
						}
						else
						{
								console.log('Error for Sendgrid ',error);
						}
					});
			}
			else
			{
					console.log('Error for file path',err);
			}
	});
}

exports.NoreplyMail=function(email,subject,bodycontent)
{
	var filePath = path.join('vabo_email', 'email.html');

	fs.readFile(filePath, {encoding: 'utf-8'},
	function(err, data) {
			if ( ! err )
			{
					var helper = require('sendgrid').mail;

					from_email = new helper.Email('noreply@callvabo.com')
					to_email = new helper.Email(email)
					subject = subject
					//Dynamic content
					var data = data.replace("$content", bodycontent)

					content = new helper.Content('text/html', data)

					mail = new helper.Mail(from_email, subject, to_email, content);

					var sg = require('sendgrid')(SendGridKey.SendGridKey);

					var requestBody = mail.toJSON();
					var request = sg.emptyRequest();
					request.method = 'POST';
					request.path = '/v3/mail/send';
					request.body = requestBody;

					sg.API(request, function (error, response) {
						if ( ! error )
						{
								console.log('mail send Successfully to ',email);
						}
						else
						{
								console.log('error for sendgrid ',error);
						}
					});
			}
			else
			{
					console.log('Error for file path',err);
			}
	});
}
/*
exports.GetAllProfessionalToken = function(callback)
{
	pool.getConnection(function(err,connection){
			if(!err)
			{

				connection.query('select * from notification where type=1',
				function(err,DeviceDetail){
						if(!err)
						{
								var api_token=[];
								for(i=0;i<DeviceDetail.length;i++)
								{
									api_token.push(DeviceDetail[i].token);
								}
                callback(api_token);
            }
						else
						{
								console.log('Error for selecting user details',err);
                return;
						}
			});
			}
			else
			{
					console.log('Connection Error ...',err);
					return;
			}
	});
}
*/

exports.GetAllProfessionalToken = function(connection,callback)
{
				connection.query('select * from notification where type=1',
				function(err,DeviceDetail){
						if(!err)
						{
								var api_token=[];
								for(i=0;i<DeviceDetail.length;i++)
								{
									api_token.push(DeviceDetail[i].token);
								}
                callback(api_token);
            }
						else
						{
								console.log('Error for selecting user details',err);
                return;
						}
			});
}


exports.SendNotification = function(msg,title,type,id,user_id,api_token)
{

							var fcm = new FCM(constants.serverKey);

								var message = {
											registration_ids :	api_token,
										  notification: {
									        title: title,
									        body:msg
											},
									    data: {
									        type: type,
													id:id,
													user_id:user_id
									    }
									};

									fcm.send(message, function(err, response){
									    if (err)
											{
									        console.log("Error for Send Notification",err);
													return;
									    }
											else
											{
									        console.log("Successfully sent Notification", response);
													return;
											}
										});
}
/*
exports.GetUserToken=function(user_id_token,callback)
{
  pool.getConnection(function(err,connection){
			if(!err)
			{


				connection.query('select * from notification where user_id=?',[user_id_token],
				function(err,DeviceDetail){
						if(!err)
						{
								var api_token=[];
								for(i=0;i<DeviceDetail.length;i++)
								{
									api_token.push(DeviceDetail[i].token);
								}
                callback(api_token);
            }
						else
						{
								console.log('Error for selecting user details',err);
                return;
						}
			});
			}
			else
			{
					console.log('Connection Error ...',err);
					return;
			}
	});
}
*/

exports.GetUserToken=function(connection,user_id_token,callback)
{
				connection.query('select * from notification where user_id=?',[user_id_token],
				function(err,DeviceDetail){
						if(!err)
						{
								console.log('ok user token got');
								var api_token=[];
								for(i=0;i<DeviceDetail.length;i++)
								{
									api_token.push(DeviceDetail[i].token);
								}
                callback(api_token);
            }
						else
						{
								console.log('Error for selecting user details',err);
                return;
						}
			});
}

exports.SendNotificationMessage = function(msg,title,type,id,user_id,messagePayload,api_token)
{

							var fcm = new FCM(constants.serverKey);

								var message = {
											registration_ids :	api_token,
										  notification: {
									        title: title,
									        body:msg
											},
									    data: {
									        type: type,
													id:id,
													user_id:user_id,
													messagePayload:messagePayload
									    }
									};

									fcm.send(message, function(err, response){
									    if (err)
											{
									        console.log("Error for Send Notification",err);
													return;
									    }
											else
											{
									        console.log("Successfully sent Notification", response);
													return;
											}
										});
}


/*
exports.GetFullname=function(user_id,callback)
{
	pool.getConnection(function(err,connection){
		if(!err)
		{
				connection.query('select * from users where id=?',[user_id],
				function(err,rows){
						if(!err)
						{
								fullname=rows[0].firstname+" "+rows[0].lastname
								callback(fullname);
						}
						else
						{
								console.log('Error ',err);
						}
				});
		}
		else
		{
				console.log('Error for connection ',err);
		}
	})
}
*/
