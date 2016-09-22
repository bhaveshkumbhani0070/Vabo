var mysql	=	require('mysql');
var config	=	require('../config/config');
var jwt		=	require('jsonwebtoken');
var fs		=	require('fs');
var busboy	=	require('connect-busboy');
var URL=require('../../app.js');
var logger = require('./log');
var pool = require('../config/db');


var selectQuery = "";
var insertQuery = "";
var deleteQuery = "";
var updateQuery = "";
var tableName = "";
var usercolumns = [];
var receivedValues = {};
var dbValues = [];


exports.create=function(req,res)
{
		console.log("*** Staging Requested for Creating New Appointment request... ");
    receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        console.log("*** Redirecting: No appropriate data available for Creating Appointment payment!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Creating Appointment payment"});
        return;
    }
    else
		{
        console.log("*** Validating Appointment payment Details... ");
        appocolumns=['appointment_request_id','payment_type','transaction_id','payment_amount'];
			for(var iter=0;iter<appocolumns.length;iter++)
			{
	            columnName = appocolumns[iter];
							var data=req.body

            if((data == undefined || data == "")&& (columnName=='appointment_request_id' || columnName=='payment_type' || columnName=='transaction_id' || columnName=='payment_amount'))
						{
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                return;
            }
            dbValues[iter] = receivedValues[columnName];

      }
        // creating appointment
			pool.getConnection(function(err,connection){
			if(err)
			{
					console.log('Connection Error for creating appointment',err);
					res.json({'code':200,'status':'Error','message':'Connection Error for creating appointment'});
					return ;
			}
			else
			{

				//email from token
				var email=req.user.email;
				connection.query('select * from users where email =?',[email],function(err,rows){
				if(err)
				{
						console.log("cannot select data from users data",err);
						res.json({'code':200,'status':'Error','message':''})
						return;
				}
				else
				{
					var user_id=rows[0].id;
					var tableName='appointment';
					connection.query('INSERT INTO appointment_payment(??) VALUES(?)',[appocolumns,dbValues],function(err,rows){
					if(err)
					{
								console.log('Error for inserting data in appointment payment',err);
								res.json({'code':200,'status':'Error','message':'Error for inserting data in appointment payment'});
								return;
					}
					else
					{
						connection.query('SELECT * FROM appointment_payment WHERE id = ?',[rows.insertId],function(err,data){
						if(!err)
						{
								console.log('Appointment payment create Successfully..',data);
								res.json({'code':200,'status':'Success','message':'Appointment payment create Successfully..','apporeqData':data});
								return;
						}
						});
					}
				});
				}
			});
				connection.release();
			}

		});
	}
};

exports.edit=function(req,res)
{
	console.log("*** Staging Requested for Edditing New Appointment request... ");
    receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        console.log("*** Redirecting: No appropriate data available for Edditing Appointment payment!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Edditing Appointment payment"});
        return;
    }
    else
		{
       appocolumns=['appointment_request_id','payment_type','transaction_id','payment_amount'];
			 for(var iter=0;iter<appocolumns.length;iter++)
			 {
            columnName = appocolumns[iter];
						var data=req.body

            if((data == undefined || data == "")&& (columnName=='appointment_request_id' || columnName=='payment_type' || columnName=='transaction_id' || columnName=="payment_amount" ))
						{
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                return;
            }

			dbValues[iter] = receivedValues[columnName];
			if(iter==0)
			{
                updateString = columnName+"='"+receivedValues[columnName]+"'";
            }
			else
			{
                updateString = updateString+","+columnName+"='"+receivedValues[columnName]+"'";
			}
      }
        // creating appointment
			pool.getConnection(function(err,connection){
			if(err)
			{
					console.log('Connection Error for creating appointment',err);
					res.json({'code':200,'status':'Error','message':'Connection Error for creating appointment'});
					return ;
			}
			else
			{

				var email=req.user.email;
				var tableName='users';
				connection.query('select * from ?? where email =?',[tableName,email],function(err,rows){
				if(err)
				{
						console.log("cannot select data from users data",err);
						res.json({'code':200,'status':'Error','message':'Cannot select data from users table','Error':err});
						return;
				}
				else
				{
					var user_id=rows[0].id;
					var id=req.body.id;

					console.log('Update string=',updateString);
					console.log('id=',id);
					tableName='appointment_payment';
					connection.query('UPDATE ?? set '+updateString+' WHERE id=?',[tableName,id],function(err,rowsdata){
					if(!err)
					{
						var tableName='appointment_payment';
						connection.query('select * from ?? where id =?',[tableName,id],function(err,updata){
						if(err)
						{
									console.log('Error for selecting appointment payment',err);
									res.json({'code':200,'status':'Error','message':'Error for selecting appointment payment','Error':err});
									return;
						}
						else
						{
								console.log('*** Redirecting: Appointment Updated');
								res.json({"code" : 200,"status" : "Success","appointment_paymentData":updata,"message" : "Appointment Updated"});
								return;
						}
						});
					}
					else
					{
							console.log('*** Redirecting: Error Updating appointment payment...',err);
							res.json({"code" : 200, "status" : "Error", "message" : "appointment payment"});
							return;
					}
					});
				}
			});
			connection.release();
			}

		});
	}
}

// Select Appointment DONE IT
//Login user's appointment
exports.appointment=function(req,res)
{
	console.log('*** Staging Geting User Appointments ***');
	recevedvalue=req.body

	pool.getConnection(function(err,connection){
		if(err)
		{
				console.log('Connection Error',err);
				res.json({'code':500,'status':'Error','message':'Connection Error'});
				return;
		}
		else
		{

			tableName='users'
			connection.query('select id from ?? where email =?',[tableName,req.user.email],function(err,rows){
				if(err)
				{
						console.log("cannot select data from users data",err);
						res.json({'code':200,'message':'cannot select data from users data'});
						return;
				}
				else
				{
					var user_id=rows[0].id;
					var selectAppo ='select * from appointment_payment where user_id=?';
					connection.query(selectAppo,user_id,
						function(err,appodata){
						if(err)
						{
								console.log('cannot select data from appointment payment',err);
								res.json({'code':'200','status':'Error','message':'cannot select data from appointment payment'});
								return;
						}
						else
						{
								console.log('Appointme payment data ',appodata);
								res.json({'code':'200','status':'Success','message':'data selected ','appointment_paymentData':appodata});
								return;
						}
					});
				}
			});
			connection.release();
		}
	});
}

//Select All Appointment
exports.appointments=function(req,res)
{
	console.log('*** Staging Geting User Appointments ***');
	recevedvalue=req.body

	pool.getConnection(function(err,connection){
		if(err)
		{
				console.log('Code 500 Server connection Error',err);
				res.json({'code':500,'status':'Error','message':'Connection Error '});
				return;
		}
		else
		{

			tableName='appointment_payment'
			connection.query('select * from ?? ',[tableName],function(err,appodata){
				if(err)
				{
						console.log('can not get data',err);
						res.json({'code':'200','status':'Error','message':'can not get data'});
						return;
				}
				else
				{
						console.log('Appointment Payment data selected ',appodata);
						res.json({'code':'200','status':'Success','message':'Appointment Payment data selected ','data':appodata});
						return;
				}
			});
			connection.release();
		}
	});
}

exports.delete=function(req,res)
{
	console.log("*** Staging Requesting for Deleting Service ***");
	receivedValues=req.body

	if(JSON.stringify(receivedValues)=== '{}')
	{
			console.log("*** Redirecting: No appropriate data available for Deleting service ***");
			res.json({"code":200,"status":"Error","message":"No appropriate data available for Deleting service"});
			return;
	}
	else
	{
		var data=req.body ;
		if(data.id== undefined || data.id=="" )
		{
				console.log("*** Redirecting: NO appropriate data available for Deleting data  ***");
				res.json({"code":200,"status":"Error","messsage":"NO appropriate data available for Deleting data from "});
				return;
		}
		else
		{
      var value;
      if(data.id !== undefined && data.id !== 0)
			{
            deleteQuery = "DELETE FROM ?? WHERE id = ?";
            value = req.body.id;
      }
      else
			{
            console.log("*** Redirecting: No appropriate data available for Deleting user!")
            res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Deleting user"});
            return;
      }
			pool.getConnection(function(err,connection){
				if(err)
				{
						console.log("Connection Error",err);
						res.json({"code":200,"status":"Error","message":"cannot connect with database"});
						return;
				}
				else
				{

					var tableName="appointment_payment";
					connection.query(deleteQuery,[tableName,value],function(err,rows){
						if(err)
						{
								console.log("can not Removed Appointment ",err);
								res.json({"code":200,"status":"Error","message":"can not Removed appointment payment "});
								return;
						}
						else
						{
								console.log("Appointment Removed Successfully..",rows);
								res.json({"code":200,"status":"Success","message":"appointment payment Removed Successfully.."});
								return;
						}
					});
						connection.release();
				}
			});
		}
	}
}
