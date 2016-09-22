var mysql = require('mysql');
var Tokens = require('./getFCMtokens.js');
var config = require('../config/config');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var busboy = require('connect-busboy');
var URL = require('../../app.js');
var logger = require('./log');
var moment=require('moment');
var constants = require('../constants/constants.json');
var Errors = require('../constants/functions.js');
var payment = require('../config/payment');
var payment_charge = require('./payment.js');
var Professionalscharge=require('./professionals.js');
var stripeKeys = require('../config/stripe');
var stripe = require("stripe")(stripeKeys.stripeSecretKey);
var pool = require('../config/db');
var winston = require('winston');
var chalk = require('chalk');
var EmailFor=require('../config/email');



exports.AdminAppointments=function(req,res)
{
  pool.getConnection(function(err,connection){
    if(!err)
    {
        connection.query('select * from appointment_request where status="accept"',
        function(err,appointment){
            if(!err)
            {
                console.log('appointment',appointment);
                res.json({'code':200,'status':'Success','message':'selected appointment_req','appointment':appointment});
                return;
            }
            else
            {
                console.log('Error for selecting appointment_req',err);
                res.json({'code':200,'status':'Error','message':'Error for selecting appointment_req'});
                return;
            }
        });

        connection.release();
    }
    else
    {
        res.json({'code':200,'status':'Error','message':'Connection Error'});
        return;
    }
  });
}

function getdateFormat(date, callback)
{
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var d = date.getDate();
    var hours = date.getHours();
    var m = date.getMinutes();
    var second=date.getSeconds();
    var ms=date.getMilliseconds();

    newdate=year+" "+month+" "+d+" "+hours+" "+m+" "+second+" "+ms
    callback(newdate)
}
exports.Reminder = function()
{
  winston.info(chalk.green("*** Cron Job Running For Booking Start Reminder ***"));
  pool.getConnection(function(err,connection){
    if(!err)
    {
        connection.query('select * from appointment_request where status="accept"',
        function(err,allAppo){
            if(!err)
            {
                totalAppo=allAppo.length
                ChargeAppoId=[];
                DiffHours=[];
                for(i=0;i<totalAppo;i++)
                {
                    //console.log('Appointment',allAppo[i].schedule_date);
                    appohourse=new Date(allAppo[i].schedule_date);
                    var now = moment(new Date()); //todays date
                    var end = moment(appohourse); // another date
                    var duration = moment.duration(now.diff(end));
                    var hours = duration.asHours();
                    var hour=Math.round(Math.abs(hours));
                    DiffHours=DiffHours+" "+hour
                    ChargeAppoId=ChargeAppoId+" "+allAppo[i].appointment_request_id
                    if(hour<=24)
                    {
                        //send mail to customer with 24
                        appointment_request_id=allAppo[i].appointment_request_id
                        connection.query('select a.*,u.email,s.*,sc.name as sname from appointment_request a ,users u,service s ,service_category sc where appointment_request_id=? and a.user_id=u.id and a.service_id=s.id and sc.id=s.service_category_id',[appointment_request_id],
                        function(err,UserEmail){
                            if(!err)
                            {
                                email=UserEmail[0].email
                                date=UserEmail[0].schedule_date
                                time =new Date(date.getHours());
                                service_name=UserEmail[0].sname+"-"+UserEmail[0].sname+"-"+UserEmail[0].sname+" "+UserEmail[0].name+" "+UserEmail[0].description
                                console.log('Time='+time+" service_name="+service_name);
                                EmailFor.BookingReminderToCustomer_24(email,time,service_name);
                                winston.info(chalk.green("*** Booking Start Reminder Mail send Successfully ***"));
                            }
                            else
                            {
                                console.log('Error for selecting user details',err);
                                return;
                            }
                        });
                    }
                    if(hour<=48)
                    {
                        //send mail to customer
                        appointment_request_id=allAppo[i].appointment_request_id
                        connection.query('select a.*,u.email,s.*,sc.name as sname from appointment_request a ,users u,service s ,service_category sc where appointment_request_id=? and a.user_id=u.id and a.service_id=s.id and sc.id=s.service_category_id',[appointment_request_id],
                        function(err,UserEmail){
                            if(!err)
                            {
                                email=UserEmail[0].email
                                date=UserEmail[0].schedule_date
                                time =new Date(date.getHours());
                                service_name=UserEmail[0].sname+"-"+UserEmail[0].sname+"-"+UserEmail[0].sname+" "+UserEmail[0].name+" "+UserEmail[0].description
                                console.log('Time='+time+" service_name="+service_name);
                                EmailFor.BookingReminderToCustomer_48(email,service_name,date);
                                winston.info(chalk.green("*** Booking Start Reminder Mail send Successfully ***"));
                            }
                            else
                            {
                                console.log('Error for selecting user details',err);
                                return;
                            }
                        });
                    }
                    if(hour<=24)
                    {
                        //send Reminder to professional for 24 hours
                        appointment_request_id=allAppo[i].appointment_request_id
                        connection.query('select a.*,u.email,s.*,sc.name as sname from appointment_request a ,users u,service s ,service_category sc where appointment_request_id=? and a.professional_id=u.id and a.service_id=s.id and sc.id=s.service_category_id',[appointment_request_id],
                        function(err,UserEmail){
                            if(!err)
                            {
                                email=UserEmail[0].email
                                date=UserEmail[0].schedule_date
                                time =new Date(date.getHours());
                                service_name=UserEmail[0].sname+"-"+UserEmail[0].sname+"-"+UserEmail[0].sname+" "+UserEmail[0].name+" "+UserEmail[0].description
                                console.log('Time='+time+" service_name="+service_name);
                                EmailFor.BookingReminderToProfessional_24(email,time,service_name);
                                winston.info(chalk.green("*** Booking Start Reminder Mail send Successfully ***"));
                            }
                            else
                            {
                                console.log('Error for selecting user details',err);
                                return;
                            }
                        });
                    }
                    if(hour<=48)
                    {
                        //send Reminder to professional for 48 hours
                        appointment_request_id=allAppo[i].appointment_request_id
                        connection.query('select a.*,u.email,s.*,sc.name as sname from appointment_request a ,users u,service s ,service_category sc where appointment_request_id=? and a.professional_id=u.id and a.service_id=s.id and sc.id=s.service_category_id',[appointment_request_id],
                        function(err,UserEmail){
                            if(!err)
                            {
                                email=UserEmail[0].email
                                date=UserEmail[0].schedule_date
                                time =new Date(date.getHours());
                                service_name=UserEmail[0].sname+"-"+UserEmail[0].sname+"-"+UserEmail[0].sname+" "+UserEmail[0].name+" "+UserEmail[0].description
                                console.log('Time='+time+" service_name="+service_name);
                                EmailFor.BookingReminderToProfessional_48(email,service_name,date);
                                winston.info(chalk.green("*** Booking Start Reminder Mail send Successfully ***"));
                            }
                            else
                            {
                                console.log('Error for selecting user details',err);
                                return;
                            }
                        });
                    }

                }
            }
            else
            {
                console.log('Error for selecting data from appointment',err);
                return;
            }
        });
        connection.release();
    }
    else
    {
        console.log('Connection Error',err);
    }
  });
}

exports.UncaptureCharge=function()
{
  winston.info(chalk.green("*** Cron Job Running For Uncaputure Payment ***"));
  pool.getConnection(function(err,connection){
  if(!err)
  {
      connection.query('select * from appointment_request where status="accept" and uncaptured!=1',
      function(err,allAppo){
          if(!err)
          {
              totalAppo=allAppo.length

              ChargeAppoId=[];
              DiffHours=[];
              for(i=0;i<totalAppo;i++)
              {
                  //console.log('Appointment',allAppo[i].schedule_date);
                  appohourse=new Date(allAppo[i].schedule_date);
                  var now = moment(new Date()); //todays date
                  var end = moment(appohourse); // another date
                  var duration = moment.duration(now.diff(end));
                  var hours = duration.asHours();
                  var hour=Math.round(Math.abs(hours));
                  DiffHours=DiffHours+" "+hour
                  ChargeAppoId=ChargeAppoId+" "+allAppo[i].appointment_request_id
                  if(hour<=48)
                  {
                      var appointment_request_id=allAppo[i].appointment_request_id
                      connection.query('select a.*,upd.*,s.* from appointment_request a,user_payment_details upd,service s where appointment_request_id =? and a.user_id=upd.user_id and a.service_id=s.id',[appointment_request_id],
                      function(err,rows){
                        if(!err)
                        {
                            if(rows!="")
                            {
                              function listCard(callback)
                              {
                                customer_id=rows[0].customer_id
                                stripe.customers.listCards(customer_id,
                                  function(err, cards) {
                                    if(!err)
                                    {
                                        card_id=cards.data[0].id
                                        callback(card_id)
                                    }
                                    else
                                    {
                                      console.log('Error for selecting card',err);
                                    }
                                  });
                              }
                                      listCard(function(card_id){

                                      price=rows[0].price
                                      oldamount=price.replace('$','');
                                      email=rows[0].email
                                      //card_id=cards.data[0].id
                                      stripe.charges.create({
                                        amount: Math.round(oldamount * 100),
                                        currency: 'usd',
                                        capture:false,
                                        customer:rows[0].customer_id,
                                        card:card_id,
                                        description: "Charge for "+rows[0].email
                                        },function(err, charge) {
                                          if(!err)
                                          {
                                                price=rows[0].price
                                                var amount=price.replace('$','');
                                                charge_id=charge.id
                                                payment_type=1
                                                date=new Date();
                                                appointment_request_id=rows[0].appointment_request_id
                                                appointment_paymentData=[appointment_request_id,payment_type,charge.id,amount,'uncaptured',date]
                                                connection.query('update appointment_request set uncaptured=1 where appointment_request_id=?',[appointment_request_id],
                                                function(err,updateApo){
                                                    if(!err)
                                                    {
                                                        connection.query('insert into appointment_payment(appointment_request_id,payment_type,transaction_id,payment_amount,status,date) values(?)',[appointment_paymentData],
                                                        function(err,InsertedPayment){
                                                              if(!err)
                                                              {
                                                                    appointment_paymentInsertId=InsertedPayment.insertId
                                                                    price=rows[0].price
                                                                    var amount=price.replace('$','');
                                                                    var date=new Date();
                                                                    user_id=rows[0].user_id
                                                                    chargeId=charge.id
                                                                    appointment_request_id=rows[0].appointment_request_id
                                                                    transaction_historyData=[user_id,chargeId,'uncaptured',amount,0,appointment_request_id,date]
                                                                    connection.query('insert into transaction_history(customerId,chargeId,status,balance_transaction,debited_credited,appointment_request_id,date) values(?)',[transaction_historyData],
                                                                    function(err,InsertedTransactionHistry){
                                                                    if(!err)
                                                                    {
                                                                          winston.info(chalk.green("Uncapture Charge Successfully..."));
                                                                    }
                                                                    else
                                                                    {
                                                                          console.log('Error for inserting data into transaction_history',err);
                                                                    }
                                                                    });
                                                               }
                                                               else
                                                               {
                                                                  console.log('Error for inserting data into appointment_payment');
                                                               }
                                                             });
                                                    }
                                                    else
                                                    {
                                                        console.log('Error for update data',err);
                                                    }
                                                });
                                          }
                                          else
                                          {
                                              console.log('Error for creating charge',err);
                                          }
                                        });
                                      });

                            }
                        }
                        else
                        {
                            console.log('err',err);
                        }
                      })
                  }
              }
          }
          else
          {
              console.log('Error',err);
          }
      });
      connection.release();
    }
    else
    {
        console.log(err);
    }
  });
}

exports.CompleteAppointment=function(req,res)
{
  winston.info(chalk.green("*** Cron Job Running For CompleteAppointment ***"));
  pool.getConnection(function(err,connection){
      if(!err)
      {
          connection.query('select * from appointment_request where status="accept" and uncaptured=1',
          function(err,allAppo){
              if(!err)
              {
                  if(allAppo!="")
                  {
                    totalAppo=allAppo.length

                    console.log('totalAppo',totalAppo);
                    ChargeAppoId=[];
                    for(i=0;i<totalAppo;i++)
                    {
                      var now = new Date();
                      var end = new Date(allAppo[i].schedule_date);
                      if(now>=end)
                      {
                            console.log('appointment complitable',allAppo[i]);
                            appointment_request_id=allAppo[i].appointment_request_id

                            recure_id=allAppo[i].recure_id
                            connection.query('update appointment_request set status="complete" , uncaptured=0 where appointment_request_id=?',[appointment_request_id],
                            function(err,update){
                              if(!err)
                              {
                                  if(recure_id==1)
      														{
      																insert_new_one(7);
      														}
      														else if (recure_id==2)
      														{
      																insert_new_one(14);
      														}
      														else if (recure_id==3)
      														{
      																insert_new_one(21);
      														}
      														else if (recure_id==4)
      														{
      																insert_new_one(28);
      														}
      														else
      														{
                                      paymentCharge();
                                  }
                              }
                              else
                              {
                                  console.log('Error for Update Appointment',err);
                              }
                            });
                            function paymentCharge()
                            {
                                connection.query('select * from transaction_history where appointment_request_id=? and status="uncaptured"',[appointment_request_id],
                                function(err,chargeAppo){
                                  if(!err)
                                  {
                                    console.log('transaction_history selected',chargeAppo);
                                    totalChargable=chargeAppo.length
                                    console.log('totalChargable',totalChargable);
                                    connection.query('update transaction_history set status="charge" where appointment_request_id=?',[appointment_request_id],
                                    function(err,updatetransaction){
                                      if(!err)
                                      {
                                        for(j=0;j<totalChargable;j++)
                                        {
                                          console.log('charge id=',chargeAppo[j].chargeId);
                                          stripe.charges.capture(chargeAppo[j].chargeId,
                                            function(err, charge) {
                                              if(!err)
                                              {
                                                winston.info(chalk.green("Appointment Complete Successfully..."));
                                              }
                                              else
                                              {
                                                console.log('Error for charge',err);
                                              }
                                            });
                                          }
                                        }
                                        else
                                        {
                                          console.log('Error for updating transction history',err);
                                        }
                                      });
                                    }
                                    else
                                    {
                                      console.log('Error for selecting transaction_history',err);
                                    }
                                  });
                            }

                            function insert_new_one(j)
  													{
  																var d= end;
  																d.setDate(d.getDate() + j);
                                  user_id=allAppo[0].user_id
                                  service_id=allAppo[0].service_id
                                  recure_id=allAppo[0].recure_id
                                  notes=allAppo[0].notes
                                  var appodata=[user_id,service_id,d,recure_id,notes,0,0,0,"panding"]
  																connection.query('insert into appointment_request(user_id,service_id,schedule_date,recure_id,notes,professional_id,rate_by_cust,rate_by_prof,status) values(?)',[appodata],
  																function(err,insert_new_appo) {
  																			if(!err)
  																			{
  																					connection.query('select * from appointment_request where appointment_request_id=?',[insert_new_appo.insertId],
  																					function(err,insert_data){
  																						if(!err)
  																						{
  																								console.log('Data updated');
  																								user_id=insert_data[0].user_id
  																								id=appointment_request_id
  																								msg='Appointment completed'
  																								title='Appointment completed'
  																								Tokens.GetUserToken(connection,user_id,function(result){
  																											Tokens.SendNotification(msg,title,'COMPLETE_APPOINTMENT',id,user_id,result);
  																										});
                                                  paymentCharge();
  																								return;
  																						}
  																						else
  																						{
  																								console.log('Error For selecting last inserted data',err);
  																								return;
  																						}
  																					});
  																			}
  																			else
  																			{
  																					console.log('Error for Insert new appointment with complete',err);
  																					return;
  																			}
  																	});

  													}
                      }
                    }
                  }
              }
              else
              {
                  console.log('error',err);
              }
          });
          connection.release();
      }
      else
      {
          console.log('Err',err);
      }
  });
}

exports.CancelAppointment=function()
{
    winston.info(chalk.green("*** Cron Job Running For Cancel Appointment ***"));
    pool.getConnection(function(err,connection){
        if(!err)
        {
            connection.query('select * from appointment_request where status="panding"',
            function(err,allAppo){
                if(!err)
                {
                    if(allAppo!="")
                    {
                        totalAppo=allAppo.length
                        for(i=0;i<totalAppo;i++)
                        {
                            appohourse=new Date(allAppo[i].schedule_date);
                            var now = new Date();
                            var end = new Date(allAppo[i].schedule_date);
                            if(now>end)
                            {
                                  appointment_request_id=allAppo[i].appointment_request_id
                                  if(appointment_request_id!="")
                                  {
                                      connection.query('update appointment_request set status="cancel" where appointment_request_id=?',[appointment_request_id],
                                      function(err,appoinmentUpdate){
                                          if(!err)
                                          {
                                              winston.info(chalk.red("Panding Appointment Cancel Successfully..."));
                                          }
                                          else
                                          {
                                              console.log('Error for Cancel Appoinment',err);
                                          }
                                      });
                                  }
                              }
                        }
                    }
                }
                else
                {
                    console.log('Error for selecting appointment for cancel',err);
                }
            });
            connection.release();
        }
        else
        {
            console.log('Connection Eror',err);
        }
    });
}

exports.start=function(req,res)
{
	console.log("*** Requested for Start Appoinement ***");
	logger.info('*** Requested for Start Appoinement ***');
	receivedValues = req.body
	if(JSON.stringify(receivedValues) === '{}')
	{
			Errors.EmptyBody(res);
	}
	else
	{
		pool.getConnection(function(err,connection){
			if(!err)
			{
					appointment_request_id=req.body.appointment_request_id
					connection.query('select a.*,c.*,s.*,sc.name as catagory_name from appointment_request a,users c,service s,service_category sc where a.appointment_request_id=? and a.service_id=s.id and c.id=a.user_id and sc.id=s.service_category_id ',[appointment_request_id],
					function(err,appo_data){
							if(!err)
							{
									console.log('appodata',appo_data);
									Send_Notification();

									if(appo_data[0].professional_id!="")
									{
										connection.query('select a.*,c.*,s.* from appointment_request a,users c,service s where a.appointment_request_id=? and a.service_id=s.id and c.id=a.professional_id ',[appointment_request_id],
										function(err,appo_data){
												if(!err)
												{
                            //Send Mail to profesional
														Send_Mail();
														return
												}
												else
												{
														console.log('Error for Select professional Detail',err);
														res.json({'code':200,'status':'Error','message':'Error for Select professional Detail'});
														logger.error('URL=',URL.url, 'Responce=','Error for Select professional Detail');
														return;
												}
											});

									}
									return;

									function Send_Notification()
									{
											user_id=appo_data[0].user_id
											res.json({'code':200,'status':'Success','message':'Appointment Started Successfully'});
											logger.info('URL',URL.url,'Responce=','Appointment Started Successfully','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
											msg='Appointment Started Successfully'
											title='Appointment Started Successfully'
											id=appointment_request_id
											Tokens.GetUserToken(connection,user_id,function(result){
														Tokens.SendNotification(msg,title,'START_APPOINTMENT',id,user_id,result);
											});
									}

									function Send_Mail()
									{
												console.log('appo_data',appo_data);
												var date=appo_data[0].schedule_date
												var now = new Date();
												var diff = Math.round((now-date)/(1000*60*60));
												professional_email=appo_data[0].email
												service_name=appo_data[0].catagory_name+"-"+appo_data[0].service_name+" "+appo_data[0].description
											  if(diff==24)
												{
                            EmailFor.StartAppointmentEmailToProfessional_24(professional_email,service_name,date);
												}
												if(diff==48)
												{
                            EmailFor.StartAppointmentEmailToProfessional_48(professional_email,service_name,date);
												}
									}
							}
							else
							{
									console.log('Error for Selecting Data');
									res.json(constants.error.msg_selectdata_fail);
									logger.error('URL=',URL.url, 'Responce=','Error for Selecting Data');
									return
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

exports.rate_by_cust=function(req,res)
{
		console.log("*** Requested by customer for Rate... ***");
		logger.info('*** Requested by customer for Rate... ***');
		pool.getConnection(function(err,connection){
			if(!err)
			{

					email=req.user.email
					user_id=req.body.user_id
					rate=req.body.rate
					appointment_request_id=req.body.appointment_request_id
					connection.query('update appointment_request set rate_by_cust=? where appointment_request_id=?',[rate,appointment_request_id],
					function (err,rated) {
						if(!err)
						{
								connection.query('select * from appointment_request where appointment_request_id =?',[appointment_request_id],
								function (err,updated_appodata) {
									if(!err)
									{
												console.log('Appointment request update for rate');
												res.json({'code':200,'status':'Success','message':'Appointment request update for rate','appointmentData':updated_appodata});
												logger.info('URL',URL.url,'Responce=','Appointment request update for rate','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
												user_id=updated_appodata[0].user_id
												id=appointment_request_id
												msg='Customer Review with '+rate
												title='Customer Review'
												professional_id=updated_appodata[0].professional_id
														Tokens.GetUserToken(connection,professional_id,function(result){
															Tokens.SendNotification(msg,title,'CUSTOMER_REVIEW',id,professional_id,result);
														});

												connection.query('select a.*,p.email as professional_email,p.firstname,p.lastname from appointment_request a,users p where appointment_request_id=? and p.id=a.professional_id',[appointment_request_id],
												function(err,all_data){
													if(!err)
													{
                                if(all_data!="")
                                {
                                    //send mail to professional
                                    connection.query('select firstname,lastname from users where id=?',[user_id],
                                    function(err,customername){
                                        if(!err)
                                        {
                                            email=all_data[0].customer_email
                                            customer_name=profname[0].firstname+" "+profname[0].lastname
                                            //EmailFor.RatebyCustomerBookingToProfessional(email,customer_name);
                                            return;
                                        }
                                        else
                                        {
                                            console.log('error for selecting professional data',err);
                                        }
                                    });
                                }
                                else
                                {
                                    console.log('can not select data');
                                    res.json({'code':200,'status':'Error','message':'Data not found'});
                                    return;
                                }
                          }
													else
													{
																console.log('Error for selecting professional details...',err);
																res.json({'code':200,'status':'Error','message':'Error for selecting professional details...'});
																logger.error('URL=',URL.url, 'Responce=','Error for selecting professional details...');
																return;
													}
												});
												return;
									}
									else
									{
											console.log('Error for selecting updated appointmet data',err);
											res.json({'code':200,'status':'Error','message':'Error for selecting updated appointmet data'});
											logger.error('URL=',URL.url, 'Responce=','Error for selecting updated appointmet data');
											return;
									}
								});
						}
						else
						{
								console.log('Error for update appointment_request for customer rate');
								res.json({'code':200,'status':'Error','message':'Error for update appointment_request for customer rate'});
								logger.error('URL=',URL.url, 'Responce=','Error for update appointment_request for customer rate');
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

exports.rate_by_prof=function(req,res)
{
		console.log("*** Requested by Professional for Rate... ***");
		logger.info('*** Requested by Professional for Rate... ***');
		pool.getConnection(function(err,connection){
			if(!err)
			{
					email=req.user.email
					user_id=req.body.user_id
					rate=req.body.rate
					appointment_request_id=req.body.appointment_request_id
					connection.query('update appointment_request set rate_by_prof=? where appointment_request_id=?',[rate,appointment_request_id],
					function (err,rated) {
						if(!err)
						{
								connection.query('select * from appointment_request where appointment_request_id =?',[appointment_request_id],
								function (err,updated_appodata) {
									if(!err)
									{
												connection.query('select a.*,c.email as customer_email,p.firstname,p.lastname from appointment_request a,users c ,users p where appointment_request_id=? and c.id=a.user_id and p.id=a.professional_id',[appointment_request_id],
												function(err,all_data){
												if(!err)
												{
															console.log('Appointment request update for rate');
															res.json({'code':200,'status':'Success','message':'Appointment request update for rate','appointmentData':updated_appodata});
															logger.info('URL',URL.url,'Responce=','Appointment request update for rate','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
															id=appointment_request_id
															msg='Professional Review  with '+rate
															title='Professional Review'
															customert_id=updated_appodata[0].user_id
																	Tokens.GetUserToken(connection,customert_id,function(result){
																		Tokens.SendNotification(msg,title,'PROFESSIONAL_REVIEW',id,customert_id,result);
																	});
															professional_name=all_data[0].firstname+" "+all_data[0].lastname
															email=all_data[0].customer_email
															//EmailFor.RatebyProfessionalEmailToCustomer(email,professional_name);
															return;
												}
												else
												{
															console.log('Error for selecting data for email',err);
															res.json({'code':200,'status':'Error','message':'Error for selecting data for email'});
															logger.error('URL=',URL.url, 'Responce=','Error for selecting data for email');
															return;
												}
											});

									}
									else
									{
											console.log('Error for selecting updated appointmet data',err);
											res.json({'code':200,'status':'Error','message':'Error for selecting updated appointmet data'});
											logger.error('URL=',URL.url, 'Responce=','Error for selecting updated appointmet data');
											return;
									}
								});
						}
						else
						{
								console.log('Error for update appointment_request for customer rate');
								res.json({'code':200,'status':'Error','message':'Error for update appointment_request for customer rate'});
								logger.error('URL=',URL.url, 'Responce=','Error for update appointment_request for customer rate');
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


//for complete appointment
exports.complete_appo=function(req,res)
{
		console.log('*** Requesting for complite Appintment ***');
		logger.info('*** Requesting for complite Appintment ***');
		pool.getConnection(function(err,connection){
		if(!err)
		{
		    receivedValues = req.body
		    if(JSON.stringify(receivedValues) === '{}')
				{
		        Errors.EmptyBody(res);
		    }
		    else
				{
							email=req.user.email
							tableName='users'
							connection.query('select * from ?? where email=?',[tableName,email],
							function(err,user_detail){
								if(!err)
								{
										connection.query('select * from appointment_request where professional_id=? and appointment_request_id=?',[user_detail[0].id,req.body.appointment_request_id],
										function (err,appointment_req_data){
											if(!err)
											{
													if(appointment_req_data=="")
													{
															console.log('can not select recure id');
															res.json({'code':200,'status':'Error','message':'can not select recure id'});
															logger.error('URL=',URL.url, 'Responce=','can not select recure id');
															return;
													}
													else
													{
														recure_id=appointment_req_data[0].recure_id
														date=appointment_req_data[0].schedule_date
														appointment_request_id=req.body.appointment_request_id

														if(recure_id==1)
														{
																insert_new_one(7);
														}
														else if (recure_id==2)
														{
																insert_new_one(14);
														}
														else if (recure_id==3)
														{
																insert_new_one(21);
														}
														else if (recure_id==4)
														{
																insert_new_one(28);
														}
														else
														{
																connection.query('update appointment_request set status="complete" where appointment_request_id=?',[appointment_request_id],
																function(err,update){
																	if(!err)
																	{
																		connection.query('select * from appointment_request where appointment_request_id=?',[appointment_request_id],
																			function(err,user_data){
																					if(!err)
																					{
																							console.log('Appointment complete Successfully');
																							logger.info('URL',URL.url,'Responce=','Appointment complete Successfully','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
																							user_id=user_data[0].user_id
																							id=appointment_request_id
																							msg='Appointment completed'
																							title='Appointment completed'
																							Tokens.GetUserToken(connection,user_id,function(result){
																										Tokens.SendNotification(msg,title,'COMPLETE_APPOINTMENT',id,user_id,result);
																									});
                                                  customer_id=user_data[0].user_id
                                                  professional_id=user_data[0].professional_id
                                                  connection.query('select c.email ,p.firstname,p.lastname from users c,users p where c.id=? and p.id=? ',[customer_id,professional_id],
                                                  function(err,data){
                                                      if(!err)
                                                      {
                                                          email=data[0].email
                                                          customer_name=data[0].firstname+" "+data[0].lastname
                                                          EmailFor.ProfessionalComplite(email,customer_name);
                                                          return;
                                                      }
                                                      else
                                                      {
                                                          console.log('error for selecting professional data',err);
                                                      }
                                                  });
                                              payment_charge.payment_charge(req,res);
																							return;
																					}
																					else
																					{
																							console.log('Error for selecting user',err);
																							res.json(constants.msg_selectdata_fail);
																							logger.error('URL=',URL.url, 'Responce=','Error for Selecting Data');
																							return;
																					}

																			});
																		}
																		else
																		{
																				console.log('Error in appointment complete',err);
																				res.json({'code':200,'status':'Error','message':'Error for appointment request update status'});
																				logger.error('URL=',URL.url, 'Responce=','Error in appointment complete');
																				return;
																		}
																	});
														}
													}

													function insert_new_one(i)
													{
														connection.query('update appointment_request set status="complete" where appointment_request_id=?',[appointment_request_id],
														function(err,update){
															if(!err)
															{
																var d= new Date(appointment_req_data[0].schedule_date);
																d.setDate(d.getDate() + i);
																connection.query('insert into appointment_request set user_id=?,service_id=?,schedule_date=?,recure_id=?,notes=?,professional_id=0,rate_by_cust=0,rate_by_prof=0,status="panding" ',
																[appointment_req_data[0].user_id,appointment_req_data[0].service_id,d,appointment_req_data[0].recure_id,appointment_req_data[0].notes],
																function(err,insert_new_appo) {
																			if(!err)
																			{
																					connection.query('select * from appointment_request where appointment_request_id=?',[insert_new_appo.insertId],
																					function(err,insert_data){
																						if(!err)
																						{
																								console.log('Data updated');
																								logger.info('URL',URL.url,'Responce=','New appointment request create','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
																								user_id=insert_data[0].user_id
																								id=appointment_request_id
																								msg='Appointment completed'
																								title='Appointment completed'
																								Tokens.GetUserToken(connection,user_id,function(result){
																											Tokens.SendNotification(msg,title,'COMPLETE_APPOINTMENT',id,user_id,result);
																										});
                                                payment_charge.payment_charge(req,res);
																								return;
																						}
																						else
																						{
																								console.log('Error For selecting last inserted data',err);
																								res.json({'code':200,'status':'Success','message':'Error For selecting last inserted date'});
																								logger.error('URL=',URL.url, 'Responce=','Error For selecting last inserted data');
																								return;
																						}
																					});
																			}
																			else
																			{
																					console.log('Error for Insert new appointment with complete',err);
																					res.json({'code':200,'status':'Success','message':'Error For Insert new appointent with complete'});
																					logger.error('URL=',URL.url, 'Responce=','Error for Insert new appointment with complete');
																					return;
																			}
																	});
															}
															else
															{
																	console.log('Error for appointment request update status',err);
																	res.json({'code':200,'status':'Error','message':'Error for appointment request update status'});
																	logger.error('URL=',URL.url, 'Responce=','Error for appointment request update status');
																	return;
															}
														});
													}

                      }
											else
											{
													console.log('error for selecting appointment request data',err);
													res.json({'code':200,'status':'Error','message':'Error for selecting apointment request data'});
													logger.error('URL=',URL.url, 'Responce=','error for selecting appointment request data');
													return;
											}
										});
								}
								else
								{
										console.log('Error for selecting user detail',err);
										res.json({'code':200,'status':'Error','message':'Error for selecting user detail'});
										logger.error('URL=',URL.url, 'Responce=','Error for selecting user detail');
										return;
								}
							});
				}
        connection.release();
		}
		else
		{
				Errors.Connection_Error(res);
		}
	});
};

//create appointment Request

exports.create=function(req,res)
{
	console.log("*** Requested for Creating New Appointment request... ***");
	logger.info('*** Requested for Creating New Appointment request... ***');
	  receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);
    }
    else
    {
        console.log("*** Validating User Details... ");

        appocolumns = ['service_id', 'schedule_date', 'recure_id', 'notes'];
        var dbValues = [];
        for (var iter = 0; iter < appocolumns.length; iter++) {
            columnName = appocolumns[iter];
            var data = req.body
            if ((data == undefined || data == "") && (columnName == 'service_id' || columnName == 'schedule_time' || columnName == 'schedule_date' || columnName == 'recure_id' || columnName == "recure_id")) {
                console.log("*** Redirecting: ", columnName, " field is required")
                res.json({"code": 200, "status": "Error", "message": columnName + " field is undefined"});

                return;
            }
            dbValues[iter] = receivedValues[columnName];
        }

        // creating appointment
			pool.getConnection(function(err,connection){
			if(err)
			{
					Errors.Connection_Error(res);
			}
			else
			{
				var email=req.user.email;
				var tableName='users';
				connection.query('select * from ?? where email =?',[tableName,email],
				function(err,rows){
				if(err)
				{
						console.log("cannot select data from users data",err);
						res.json({'code':200,'status':'Error','message':'cannot select data from users data'});
						logger.error('URL=',URL.url, 'Responce=','cannot select data from users data');
						return;
				}
				else
				{
					var user_id=rows[0].id;

					connection.query('INSERT INTO appointment_request(??,user_id) VALUES(?,?)',[appocolumns,dbValues,user_id],function(err,rows){
					if(err)
					{
							console.log('Error: INSERT Error in appointment_request',err);
							res.json({'code':200,'status':'Error','message':'can not insert data in Appointment Request','err':err});
							logger.error('URL=',URL.url, 'Responce=','INSERT Error in appointment_request');
							return;
					}
					else
					{
						tableName='appointment_request'
						connection.query('SELECT * FROM ?? WHERE appointment_request_id = ?',[tableName,rows.insertId],
						function(err,rows){
						if(!err)
						{
									console.log('Appointment Request created Successfully..',rows);
									res.json({'code':200,'status':'Success','message':'Appointment Request created Successfully..','apporeqData':rows});
									id=rows[0].appointment_request_id
									logger.info('URL',URL.url,'Responce=','Appointment Request created Successfully..','User Email=',req.user.email,'Appointment Request id=',id);
									msg='New Appointment Request'
									title='New Appointment'
									Tokens.GetAllProfessionalToken(connection,function(result){
										Tokens.SendNotification(msg,title,'CREATE_APPOINTMENT',id,user_id,result);
									});

									appointment_request_id=rows[0].appointment_request_id
									connection.query('select a.*,s.name,s.description,s.price,sc.name as catagory_name from appointment_request a,service s ,service_category sc where appointment_request_id=? and a.service_id=s.id and s.service_category_id=sc.id',[appointment_request_id],
									function(err,data){
									if(!err)
									{
													console.log('data',data);
													var date=rows[0].schedule_date;
													var service_name=data[0].catagory_name+"-"+data[0].name+" "+data[0].description;
													var price=data[0].price;
                          EmailFor.CreateAppointmentToCustomer(email,service_name,date);
													return;
									}
									else
									{
											console.log('Error for selecting details for email',err);
											res.json({'code':200,'status':'Error','message':'Error for selecting details for email'});
											logger.error('URL=',URL.url, 'Responce=','Error for selecting details for email');
											return;
									}
								});
						}
						else
						{
								console.log('Error For selecting from appointment request',err);
								res.json({'code':200,'status':'Error','message':'Error for selecting data from appointment request'});
								logger.error('URL=',URL.url, 'Responce=','Error For selecting from appointment request');
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
}

//Edit appointment Request
exports.edit=function(req,res)
{
	console.log("*** Requested for Editing Appointment request... ***");
	logger.info('*** Requested for Editing Appointment request... ***');
	  receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);
    }
    else
    {
        appocolumns = ['service_id', 'schedule_date', 'recure_id', 'appointment_request_id', 'notes'];
        var dbValues = [];
        var updateString = [];
        var tmpcolumnName = [];
        for (var iter = 0; iter < appocolumns.length; iter++)
        {
            columnName = appocolumns[iter];
            var data = req.body
            if ((data == undefined || data == "") && (columnName == 'service_id' || columnName == 'schedule_date' || columnName == 'recure_id' || columnName == "recure_id" || columnName == "appointment_request_id"))
            {
                console.log("*** Redirecting: ", columnName, " field is required")
                res.json({"code": 200, "status": "Error", "message": columnName + " field is undefined"});
                return;
            }
            /*dbValues[iter] = receivedValues[columnName];
            if (iter == 0)
            {
                updateString = columnName + "='" + receivedValues[columnName] + "'";
            }
            else
            {
                updateString = updateString + "," + columnName + "='" + receivedValues[columnName] + "'";
            }*/
            if (receivedValues[columnName] != undefined)
            {
                dbValues[iter] = appocolumns[columnName];
                tmpcolumnName[iter] = appocolumns[iter];
                if (updateString == "")
                    updateString = columnName + "='" + receivedValues[columnName] + "'";
                else
                    updateString = updateString + "," + columnName + "='" + receivedValues[columnName] + "'";
            }
        }
			pool.getConnection(function(err,connection){
			if(err)
			{
					Errors.Connection_Error(res);
			}
			else
			{
				var email=req.user.email;
				tableName='users'
				connection.query('select * from ?? where email =?',[tableName,email],
				function(err,rows){
				if(err)
				{
						console.log("cannot select data from users data",err);
						res.json({'code':200,'status':'Error','message':'cannot select data from users data'});
						logger.error('URL=',URL.url, 'Responce=','cannot select data from users data');
						return;
				}
				else
				{

					var user_id=rows[0].id;
					var is_professional=rows[0].is_professional

					var id=req.body.appointment_request_id;
          connection.query('select * from appointment_request where appointment_request_id =?',[id],
          function(err,appodata){
              if(!err)
              {
                connection.query('UPDATE appointment_request set '+updateString+' WHERE appointment_request_id=?',[req.body.appointment_request_id],
                function(err,rowsdata){
                  if(!err)
                  {
                    connection.query('select * from appointment_request where appointment_request_id =?',[id],
                    function(err,updata){
                      if(err)
                      {
                        console.log('Error for selecing appointment request',err);
                        res.json({'code':200,'status':'Error','message':'Error for selecting appointment request'})
                        logger.error('URL=',URL.url, 'Responce=','Error for selecing appointment request');
                        return;
                      }
                      else
                      {
                        console.log('*** Redirecting: Appointment request Updated');
                        if(updata!="")
                        {
                          logger.info('URL',URL.url,'Responce=','*** Redirecting: Appointment request Updated','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
                          if(updata[0].professional_id!=0)
                          {
                            //send notification to professional
                            professional_id=updata[0].professional_id
                            msg="Appointment Edited"
                            title="Edit_Appoinement"
                            Tokens.GetUserToken(connection,professional_id,function(result){
                              Tokens.SendNotification(msg,title,'EDIT_APPOINTMENT',id,professional_id,result);
                            });

                            var scheduledTime = appodata[0].schedule_date;
                            console.log('schesule Time=',scheduledTime);
                            var currentTime = new Date();
                            var timeDifference = Math.abs(scheduledTime.getTime() - currentTime.getTime()) / 3600000;

                            if(appodata[0].professional_id!=0)
                            {
                                console.log('send mail to both');
                                SendMailToCustomer(timeDifference);
                                SendMailToProfessional();
                            }
                            else
                            {
                                SendMailToCustomer(timeDifference);
                            }
                          }
                          else
                          {
                            console.log('can not send notification. Appointment still not accepted by professional');
                            SendMailToCustomer();
                          }
                          res.json({"code" : 200,"status" : "Success","message" : "Appointment request Updated","appointmentData":updata});

                          function SendMailToProfessional()
                          {
                            console.log('send mail to professional');
                            connection.query('select a.user_id,a.schedule_date,u.firstname ,u.lastname,u.address,u.city,u.country,u.zip,u.email,s.name as service_name,s.description,s.price,sc.name as catagory_name from users u, appointment_request a,service s ,service_category sc where appointment_request_id=? and a.service_id=s.id and u.id=a.professional_id and s.service_category_id=sc.id',[id],
                            function(err,data){
                              if(!err)
                              {
                                professional_name=data[0].firstname+" "+data[0].lastname
                                date=data[0].schedule_date
                                service_name=data[0].catagory_name+"-"+data[0].service_name+" "+data[0].description
                                price=data[0].price
                                address=data[0].address
                                city=data[0].city
                                country=data[0].country
                                zip=data[0].zip
                                email=data[0].email
                                EmailFor.RescheduledBookingToProfessional(email,professional_name,service_name,price,address,city,country,zip,date);
                              }
                              else
                              {
                                console.log('Error for selecting data',err);
                                res.json({'code':200,'status':'Error','message':'Error for selecting data'});
                                logger.error('URL=',URL.url, 'Responce=','Error for selecting data');
                                return;
                              }
                            });

                          }

                          function SendMailToCustomer(timeDifference)
                          {
                            console.log('send mail to customer');
                            connection.query('select a.professional_id,a.schedule_date,u.firstname ,u.lastname,u.address,u.city,u.country,u.zip,u.email,s.name as service_name,s.description,s.price,sc.name as catagory_name from users u, appointment_request a,service s , service_category sc where appointment_request_id=? and a.service_id=s.id and u.id=a.user_id and s.service_category_id=sc.id',[id],
                            function(err,data){
                              if(!err)
                              {
                                console.log('data',data);
                                if(data!="")
                                {
                                  //send mail to professional ,cusomer has edit appointmentData
                                  customer_name=data[0].firstname+" "+data[0].lastname
                                  date=data[0].schedule_date
                                  service_name=data[0].catagory_name+"-"+data[0].service_name+" "+data[0].description
                                  price=data[0].price
                                  address=data[0].address
                                  city=data[0].city
                                  country=data[0].country
                                  zip=data[0].zip
                                  email=data[0].email
                                  console.log('timeDifference',timeDifference);
                                  if(timeDifference>2 && timeDifference <24)
                                  {
                                      console.log('send RescheduledBookingToCustomer_2To24');
                                      //send mail to cutomer mail number 15
                                      EmailFor.RescheduledBookingToCustomer_2To24(email,customer_name,service_name,address,city,country,zip,date);
                                  }
                                  if(timeDifference<2)
                                  {
                                      console.log('RescheduledBookingToCustomer_2');
                                      //send mail to cusomer mail number 16
                                      EmailFor.RescheduledBookingToCustomer_2(email,customer_name,service_name,price,address,city,country,zip,date);
                                  }
                                  else
                                  {
                                      console.log('RescheduledBookingToCustomer_2');
                                      //send mail to cusomer mail number 16
                                      EmailFor.RescheduledBookingToCustomer_More24(email,customer_name,service_name,price,address,city,country,zip,date);
                                  }
                                }
                              }
                              else
                              {
                                console.log('Error for selecting data',err);
                                res.json({'code':200,'status':'Error','message':'Error for selecting data'});
                                logger.error('URL=',URL.url, 'Responce=','Error for selecting data');
                                return;
                              }
                            });
                          }
                        }
                      }
                    });
                  }
                  else
                  {
                    console.log('*** Redirecting: Error for edit Appointment Request...',err);
                    res.json({"code" : 200, "status" : "Error", "message" : "Error for edit Appointment Request"});
                    logger.error('URL=',URL.url, 'Responce=','*** Redirecting: Error for edit Appointment Request...');
                    return;
                  }
                });
              }
              else
              {
                console.log('Error for selecting appointmet',err);
              }
            });

				}
			});
      connection.release();
			}
		});
	}
}


exports.appointment=function(req,res)
{
	console.log("*** Requested for View New Appointment request... ***");
	logger.info('*** Requested for View New Appointment request... ***');
	  receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);
    }
    else
		{
		recevedvalue=req.body
		pool.getConnection(function(err,connection){
			if(err)
			{
					Errors.Connection_Error(res);
			}
			else
			{

				profid=req.body.professional_id
				connection.query('select ar.*,u.*,s.*,sc.id as catagory_id,sc.name as catagory_name,(select firstname from users where id=?) as professional_name from users u,appointment_request ar,service s,service_category sc where ar.service_id=s.id and s.service_category_id=sc.id and ar.user_id=u.id and ar.status = "panding" and ar.appointment_request_id not IN (select appointment_request_id from appointment_reject where professional_id=?)',[profid,profid],
				function(err,rows){
				if(!err)
				{
					var result = [], index = {};
					rows.forEach(function (row)
					{
						if ( !(row.appointment_request_id in index) )
						{
							index[row.appointment_request_id] =
							{
								appointment_request_id: row.appointment_request_id,
								schedule_date: row.schedule_date,
								service_id: row.service_id,
								notes: row.notes,
								rate_by_cust:row.rate_by_cust,
								rate_by_prof:row.rate_by_prof,
								status:row.status,
								message_count:row.message_count,
								professional_id:row.professional_id,
								professional_name:row.professional_name,
								name: row.name,
								description:row.description,
								price: row.price,
								gender: row.gender,
								duration: row.duration,
								catagory_name: row.catagory_name,
								category_id: row.catagory_id,
								recure_id: row.recure_id,
								userData: []
							};
							result.push(index[row.appointment_request_id]);
							index[row.appointment_request_id].userData.push({
							id: row.user_id,
							firstname: row.firstname,
							lastname: row.lastname,
							dob: row.dob,
							gender: row.gender,
							phone:row.phone,
							email:row.email,
							address:row.address,
							city:row.city,
              province:row.province,
							country:row.country,
							img_path:row.img_path,
							is_professional:row.is_professional,
							is_social:row.is_social,
							zip:row.zip,
							Q1:row.Q1,
							Q2:row.Q2,
							Q3:row.Q3,
							Q4:row.Q4,
							Q5:row.Q5,
							Q6:row.Q6
							});
						}

					});
					console.log('Appointment request Updated',result);
					res.json({'code':200,"status": "Success",'appointment_requestData':result});
					logger.info('URL',URL.url,'Responce=','Appointment request Updated','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
					return;
				}
				else
				{
						console.log('Can not select data from user table',err);
						res.json({'code':200,'message':'Can not select data from user table'});
						logger.error('URL=',URL.url, 'Responce=','Can not select data from user table');
						return;
				}
				});
          connection.release();
			}
		});
	}
}

exports.appointments=function(req,res)
{
	console.log('*** Geting User Appointments ***');
	logger.info('*** Geting User Appointments ***');
	recevedvalue=req.body

	pool.getConnection(function(err,connection){
		if(err)
		{
			   Errors.Connection_Error(res);
		}
		else
		{

			email=req.user.email;
			connection.query('select ar.*,u.* ,s.* ,sc.id as catagory_id,sc.name as catagory_name, (select firstname from users where id=ar.professional_id) as professional_name , (select phone from users where id=ar.professional_id) as prof_phone from users u ,appointment_request ar,service s,service_category sc where ar.service_id=s.id and s.service_category_id=sc.id and ar.status != "cancel"  and u.email=? and ar.user_id=u.id',[email],
			function(err,rows){
				if(!err)
				{

					var result = [], index = {};
					rows.forEach(function (row) {
						if ( !(row.appointment_request_id in index) )
						{
							index[row.appointment_request_id] =
							{
								appointment_request_id: row.appointment_request_id,
								schedule_date: row.schedule_date,
								service_id: row.service_id,
								notes: row.notes,
								status:row.status,
								message_count:row.message_count,
								rate_by_cust:row.rate_by_cust,
								rate_by_prof:row.rate_by_prof,
								name: row.name,
								description:row.description,
								professional_id:row.professional_id,
								professional_name:row.professional_name,
                professional_number:row.prof_phone,
								price: row.price,
								gender: row.gender,
								duration: row.duration,
								recure_id: row.recure_id,
								catagory_name: row.catagory_name,
								category_id: row.catagory_id,
								userData: []							};
							result.push(index[row.appointment_request_id]);
						}
						index[row.appointment_request_id].userData.push({
						id: row.user_id,
						firstname: row.firstname,
						lastname: row.lastname,
						dob: row.dob,
						gender: row.gender,
						phone:row.phone,
						email:row.email,
						address:row.address,
						city:row.city,
            province:row.province,
						country:row.country,
						img_path:row.img_path,
						is_professional:row.is_professional,
						is_social:row.is_social,
						zip:row.zip,
						Q1:row.Q1,
						Q2:row.Q2,
						Q3:row.Q3,
						Q4:row.Q4,
						Q5:row.Q5,
						Q6:row.Q6
						});

					});
					console.log('User details',result);
					res.json({'code':200,"status": "Success",'appointment_requestData':result});
					logger.info('URL',URL.url,'Responce=','Appointment request Selected','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
					return;

				}
				else
				{
						console.log('Can not select data from user table',err);
						res.json({'code':200,'message':'Can not select data from user table'});
						logger.error('URL=',URL.url, 'Responce=','Can not select data from user table');
						return;
				}
			});
      connection.release();
		}
	});
}


exports.cust_cancel=function(req,res)
{
		console.log("*** Requested for Cancel Appointment request by customer ... ***");
		logger.info('*** Requested for Cancel Appointment request by customer ... ***');
		receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);
    }
    else
		{
			pool.getConnection(function(err,connection){
			if(err)
			{
						Errors.Connection_Error(res);
			}
			else
			{
				appoid=req.body.appointment_request_id
				connection.query('select a.*,u.id,u.email,u.firstname,u.lastname,s.id as service_id,s.name as service_name ,s.description sc.name as catagory_name from users u,appointment_request a,service s,service_category sc where a.appointment_request_id=? and s.id=a.service_id and a.professional_id=u.id and s.service_category_id=sc.id',[appoid],
				function(err,appodata){
						if(!err)
						{
								if(appodata=="")
							{
									professional_id=0
									console.log('appodata not found');
									cancel_appoinement();
									return;
							}
							else
							{
									console.log('appodata',appodata);
									customert_id=appodata[0].user_id
									professional_id=appodata[0].professional_id
									email=appodata[0].email
									id=appoid
									professional_name=appodata[0].firstname+" "+appodata[0].lastname
									date=appodata[0].schedule_date
									service_name=appodata[0].catagory_name+"-"+ appodata[0].service_name+" "+appodata[0].description
									cancel_appoinement();
							}

									function cancel_appoinement()
									{
											connection.query('update appointment_request set status = "cancel",professional_id=0 where appointment_request_id=?',[appoid],
											function(err,result_data){
												if(!err)
												{
														console.log('appointment request deactive');
														res.json({'code':200,'message':'appointment cancel successfully...','status':'Success'});
														logger.info('URL',URL.url,'Responce=','Appointment request Deactivateds','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
														msg='Appointment Canceled'
														title='Appointment Canceled'
														if(professional_id != 0)
														{
																Tokens.GetUserToken(connection,professional_id,function(result){
																	Tokens.SendNotification(msg,title,'CANCEL_APPOINTMENT',id,professional_id,result);
																});
																//Email send to professional
																EmailFor.CancelBookingToProfessional(Prof_email,professional_name,service_name,date);
														}
														return;
													}
											else
											{
													console.log('Error for selecting data',err);
													res.json({'code':200,'message':'Error for selecting data'});
													logger.error('URL=',URL.url, 'Responce=','Error for selecting data');
													return;
											}
											});
									}

					}
					else
					{
							console.log('Can not select data from user table',err);
							res.json({'code':200,'message':'Can not select data from user table'});
							logger.error('URL=',URL.url, 'Responce=','Can not select data from user table');
							return;
					}
				});
          connection.release();
			}
		});
	}
};


exports.prof_cancel=function(req,res)
{
	console.log('*** Geting Cancel Appointment***');
	logger.info('*** Geting Cancel Appointment***');
    receivedValues = req.body    //DATA FROM WEB
    var ProfessionalID = 0;    /// this on is imp to be inserted
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);
    }
	else
	{
		pool.getConnection(function(err,connection){
		if(!err)
		{
			email=req.user.email;
			tableName='users';
			connection.query('select * from ?? where email=?',[tableName,email],
			function(err,prouser){
				if(!err)
				{
					appointment_request_id=req.body.appointment_request_id;
					connection.query('select a.appointment_request_id, a.schedule_date,a.user_id, a.professional_id, u.id,u.email,u.firstname,u.lastname,s.id as service_id, sc.name as catagory_name,s.name as service_name ,s.description , s.price as service_price from users u,appointment_request a,service s,service_category sc where a.appointment_request_id=? and s.id=a.service_id and s.service_category_id=sc.id and a.user_id=u.id ',[appointment_request_id],
					function(err,appodata){
					if(!err)
					{
							customert_id=appodata[0].user_id
							email=appodata[0].email
							id=appointment_request_id;
							customer_name=appodata[0].firstname+" "+appodata[0].lastname
							date=appodata[0].schedule_date
							service_name=appodata[0].catagory_name+"-"+appodata[0].service_name+" "+appodata[0].description


              var is_professional = prouser[0].is_professional;

              var userId = prouser[0].id;
              var appointment_request_id = req.body.appointment_request_id;
              var price = appodata[0].service_price;
              ProfessionalID= appodata[0].professional_id;
              var service_price = price.slice(1);
              // find appointment and verify if the customer should be charged or penality should be placed on professional
              connection.query("Select * from appointment_request where appointment_request_id=? ",[appointment_request_id],
              function (err, appointmentRequest) {
              if (err)
             {
                      console.log("Error:", err);
                      res.json({'code': 200,'status': 'Error','message': 'appointment request cannot be  select','Error': err});
                      return
              }
              else if (!appointmentRequest || appointmentRequest.length === 0)
              {
                      // appointment does not exist
                      console.log('appointment does not exist');
                      res.json({'code': 200,'status': 'Error','message': 'appointment does not exist',});
                      return
              }
              else
              {
                      // appointment exist
                      var scheduledTime = appointmentRequest[0].schedule_date;
                      var currentTime = new Date();

                      var timeDifference = Math.abs(scheduledTime.getTime() - currentTime.getTime()) / 3600000;
                            connection.query('select * from appointment_request where appointment_request_id=?',[req.body.appointment_request_id],
                            function(err,updateappo){
                                if(!err)
                                {
                                      logger.info('URL',URL.url,'Responce=','Appointment request Rejected','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
                                      if(is_professional)
                                      {
                                          id=appointment_request_id
                                          msg='Appointment Rejected'
                                          title='Appointment Rejected'
                                          customert_id=updateappo[0].user_id
                                              Tokens.GetUserToken(connection,customert_id,function(result){
                                                Tokens.SendNotification(msg,title,'REJECT_APPOINTMENT',id,customert_id,result);
                                              });
                                        }
                                        else
                                        {
                                            id=appointment_request_id
                                            msg='Appointment Canceled'
                														title='Appointment Canceled'
                                            professional_id=appointmentRequest[0].professional_id
                                            Tokens.GetUserToken(connection,professional_id,function(result){
                                              Tokens.SendNotification(msg,title,'CANCEL_APPOINTMENT',id,professional_id,result);
                                            });
                                        }
                                    chargeUser(is_professional, timeDifference, null, null, userId)
                                }
                                else
                                {
                                    console.log('Error for selecting data',err);
                                    res.json({'code':200,'status':'Error','message':'Error for selecting data'});
                                    return;
                                }
                            });

              }
              });
                    function chargeUser(is_professional, timeDifference, chargeId, amount, userId)
                    {
                        console.log('ChargeUser amount',amount);
                        if (is_professional)
                        {
                              // user is professional
                              if (timeDifference > 48)
                              {
                                  // simple do the refund , no penalty apply
                                  winston.info(chalk.green("Professional cancelled Appointment .Time Left is greater then 48 hrs ,No penalty is charged on professional,canceling the appointment"));
                                  // cancel the appointment
                                  // refund(amount, chargeId);
                                  appointment_request_status(is_professional,appointment_request_id,false)
                              }
                              else if (timeDifference > 24 && timeDifference < 48)
                              {
                                  // 5$ penalty apply
                                  winston.info(chalk.green("Professional cancelled Appointment .Time Left is greater then 24 hrs and less then 48 hrs ,5$ penalty is charged on professional"));
                                  chargeProfessional(payment.professionalChargeForLastFourtyEightHours,userId,false,true);
                              }
                              else if (timeDifference < 24)
                              {
                                  // 10$ penalty apply
                                  winston.info(chalk.green("Professional canceled Appointment .Time Left is less then 24 hrs ,10$ penalty is charged on professional"));
                                  chargeProfessional(payment.professionalChargeForLastTwentyFourHours, userId, false, true);
                              }
                        }
                        else
                        {
                              appointment_request_id=req.body.appointment_request_id
                              connection.query('select a.*,p.* from appointment_request a,users p where a.appointment_request_id=? and p.id=a.professional_id',[appointment_request_id],
                              function(err,profdata){
                                  if(!err)
                                  {
                                      if(!profdata)
                                      {
                                          console.log('profdata',profdata);
                                          console.log('appointment_request_id',appointment_request_id);
                                          professional_email=profdata[0].email
                                          professional_name=profdata[0].firstname
                                          EmailFor.BookingReminderToProfessional(professional_email,professional_name,service_name,date)
                                      }

                                      recure_id=appodata[0].recure_id
                                      // user is customer Email To professional
                                      if(timeDifference>24)
                                      {
                                        professional_name=prouser[0].firstname+" "+prouser[0].lastname;
                                        EmailFor.CancelBookingToCustomer_24(email,customer_name,service_name,date);
                                      }

                                      if (timeDifference < 2)
                                      {
                                        // fully charge : less then 2hr left in appointment
                                        //  execute the normal flow
                                        // mark job as done in database
                                        winston.info(chalk.green("Client canceled Appointment .Time Left is less then 2 hrs Charging Client with full amount"));
                                        var amount = service_price;  // amount in dollar
                                        EmailFor.CancelBookingToCustomer_2(email,customer_name,service_name,date,recure_id);
                                        chargeProfessional(amount,userId,true,false);
                                      }
                                      else if (timeDifference > 2 && timeDifference < 24)
                                      {
                                        // deduct 10% , fully charge : more then 2hr and less then 24 hrs left in appointment
                                        winston.info(chalk.green("Client Cancelled the appointment.Time Left is less then 24 hrs and greater then 2 hrs,10 % charged"));
                                        var fee = service_price * payment.FeeToCollect;
                                        var amount = fee;    // converts in dollar
                                        EmailFor.CancelBookingToCustomer_2To24(email,customer_name,service_name,date,recure_id);
                                        chargeProfessional(amount,userId,false,false);
                                      }
                                      else
                                      {
                                        winston.info(chalk.green("Client Cancelled the appointment. Time Left is greater then 24 hrs and No charges"));
                                        appointment_request_status(false,appointment_request_id,false)
                                      }
                                  }
                                  else
                                  {
                                      console.log('Error for select data from user table',err);
                                  }
                              });
                          }
                    }

                    function chargeProfessional(amount, userId,payProfessional,isProfessional)
                    {
                                  // **************************************** for professional money needs to be inserted in payment dues table
                          console.log('charge professional Amount=',amount);
                          appointment_request_id=req.body.appointment_request_id
                          if(isProfessional)
                          {
                                console.log('Professional have penalty of ',amount);
                                connection.query('select * from professional_dues where professional_id=?',[userId],
                                function(err,duesDetails){
                                    if(!err)
                                    {
                                        if(duesDetails!="")
                                        {
                                            console.log('Update professional_dues');
                                            totalTransaction=duesDetails.length
                                            console.log('totalTransaction',totalTransaction);
                                            var amount_due=0;
                                            var penalty=0;
                                            for(var i=0;i<totalTransaction;i++)
                                            {
                                                amount_due=amount_due+duesDetails[i].amount_due
                                                penalty=penalty+duesDetails[i].penalty
                                            }
                                            console.log('amount_due',amount_due);
                                            console.log('penalty',penalty);

                                            //penalty is more than
                                            newpenalty=penalty+amount
                                            connection.query('update professional_dues set penalty=?',[newpenalty],
                                            function(err,newpenalyUpdate){
                                                if(!err)
                                                {
                                                      appointment_request_status(true,appointment_request_id,false);
                                                }
                                                else
                                                {
                                                    console.log('Error for update penalty',err);
                                                    res.json({'code':200,'status':'Error','messages':'Error for update penalty'});
                                                    return;
                                                }
                                            });
                                        }
                                        else
                                        {
                                            console.log('insert professional_dues');
                                            //insert penaly into professional_dues
                                            PenalyData=[userId,amount,appointment_request_id]
                                            connection.query('insert into professional_dues(professional_id,penalty,appointment_request_id) values(?)',[PenalyData],
                                            function(err,penaltyIns){
                                                if(!err)
                                                {
                                                    appointment_request_status(true,appointment_request_id, false);
                                                }
                                                else
                                                {
                                                    console.log('Error for inserting data into professional dues',err);
                                                    res.json({'code':200,'status':'Error','message':'Error for inserting data into professional dues'});
                                                    return;
                                                }
                                            });
                                        }
                                    }
                                    else
                                    {
                                        console.log('Error for selecting data',err);
                                    }
                                });
                          }
                          else
                          {
                            console.log('Charge for customer Amount=',amount);
                            connection.query('select * from user_payment_details where user_id=?',[userId],
                            function(err,UserCardDetails){
                                if(!err)
                                {
                                    if(UserCardDetails=="")
                                    {
                                        console.log('Card Details Not found');
                                        res.json({'code':200,'status':'Error','messages':'Card Details Not found for charges'});
                                        return;
                                    }
                                    else
                                    {
                                        customerId=UserCardDetails[0].customer_id
                                        currencyType=UserCardDetails[0].currency_type
                                        stripe.customers.listCards(customerId,
                                          function(err, cards) {
                                            if(!err)
                                            {
                                              card_id=cards.data[0].id
                                              stripe.charges.create({
                                              amount: amount*100, // amount in dollar
                                              currency: currencyType,
                                              card:card_id,
                                              customer: customerId // Previously stored, then retrieved
                                            }, function (err, charged) {
                                              if (err)
                                              {
                                                  winston.info(chalk.green("Error for penalty Charged:",err));
                                                  res.json({Status: 'Error',message: 'Error Occurred while charging for penalty',data: err,statusCode: 200});
                                                  return
                                              }
                                              else
                                              {
                                                winston.info(chalk.green("penalty Charged:", amount));
                                                if(payProfessional)
                                                {
                                                      var SelectQuery = 'Select * from professional_dues  Where( professional_id = ' + ProfessionalID + ' AND paid_status = 0 )';
                                                      UpdateProfessionalDuess(SelectQuery, appointment_request_id,userId,amount,false);
                                                }
                                                else
                                                {
                                                      //appointment_request_status(isProfessional,appointment_request_id);
                                                      charge_id=charged.id
                                                      InsertTransactionHistory(userId,charge_id,amount,appointment_request_id);
                                                }
                                              }
                                            });
                                          }
                                          else
                                          {
                                              console.log('Error for list card',err);
                                          }
                                        });
                                    }
                                }
                                else
                                {
                                    console.log('Error for seleting Data from user card',err);
                                }
                            });
                           }
                    }

                    //ChargeProfessionalwithFlag  is not use
                    function ChargeProfessionalwithFlag(user_id,amount)
                    {
                        appointment_request_id=req.body.appointment_request_id
                        console.log('charge Part');

                        //update professional_dues with penalty =0 and charge with amount
                        var cvc = req.body.cvc;
                        var exp_month = req.body.exp_month;
                        var card_number = req.body.card_number;
                        var exp_year = req.body.exp_year;
                        var card_type=req.body.card_type;
                        var name=req.body.name

                            if (!exp_month)
                            {
                                  console.log('Please provide exp_month of card');
                                  res.json({'code':200,Status: 'Error',message: 'Please provide exp_month of card'});
                                  return;
                            }
                            if (!exp_year)
                            {
                                  console.log('Please provide exp_year of card');
                                  res.json({'code':200,Status: 'Error',message: 'Please provide exp_year of card'});
                                  return;
                            }
                            if (!card_number)
                            {
                                  console.log('Please provide card_number of card');
                                  res.json({'code':200,Status: 'Error',message: 'Please provide card_number of card'});
                                  return;
                            }

                            if (!card_type)
                            {
                                console.log('Please provide card_type of card');
                                res.json({'code':200,Status: 'Error',message: 'Please provide card_type of card'});
                                return;
                            }
                            if (!cvc)
                            {
                                console.log('Please provide cvc of card');
                                res.json({'code':200,Status: 'Error',message: 'Please provide cvc of card'});
                                return;
                            }
                            if(!name)
                            {
                                console.log('Please provide name of card holder');
                                res.json({'code':200,Status: 'Error',message: 'Please provide name of card holder'});
                                return;
                            }
                            if(!save)
                            {
                                console.log('Please provide save flag for save card details or not');
                                res.json({'code':200,Status: 'Error',message: 'Please provide save flag for save card details or not'});
                                return;
                            }


                          stripe.tokens.create({
                              card: {
                                  "number": card_number,
                                  "exp_month": exp_month,
                                  "exp_year": exp_year,
                                  "card_type": card_type,
                                  "cvc": cvc,
                                  "name": name
                              }
                          }, function (err, token) {
                              if (!err)
                              {
                                  token_id=token.id
                                  stripe.customers.create({
                                      description: 'Customer for '+req.user.email,
                                      email: email,
                                      source: token_id
                                  }, function (err, customer) {
                                      if (!err)
                                      {
                                            customer_id=customer.id
                                            if (token.card.country === 'US')
                                            {
                                                currencyType = 'usd'
                                            }
                                            else
                                            {
                                                currencyType = 'cad'
                                            }

                                            stripe.charges.create({
                                              amount: amount,
                                              currency: currencyType,
                                              customer:customer_id,
                                              card:token.card.id,
                                              description: "Charge for "+req.user.email
                                            },function(err, charge) {
                                              if(!err)
                                              {
                                                  charge_id=charge.id
                                                  if(save==1)
                                                  {
                                                      console.log('update professional_stripe_account with customer_id');
                                                      connection.query('update professional_stripe_account set customer_id=? where user_id=?',[customer_id,user_id],
                                                      function (err, insertion) {
                                                        if (!err)
                                                        {
                                                              InsertTransactionHistory(user_id,charge_id,amount,appointment_request_id);
                                                        }
                                                        else
                                                        {
                                                              console.log("Error Occurred",err);
                                                              res.json({'code':200,'status':'Error','message':'Error Occurred'});
                                                              return;
                                                        }
                                                      });
                                                  }
                                                  else
                                                  {
                                                      InsertTransactionHistory(user_id,charge_id,amount,appointment_request_id);
                                                  }
                                              }
                                              else
                                              {
                                                  console.log('Error for create charge',err);
                                                  res.json({'code':200,'status':'Error','message':'Error for create charge'});
                                                  return;

                                              }
                                            });
                                        }
                                        else
                                        {
                                            console.log('Error for creating customer',err);
                                            res.json({'code':200,'status':'Error','message':'Error for creating customer'});
                                            return;
                                        }
                                      });
                              }
                              else
                              {
                                  console.log('error for create card',err);
                                  res.json({'code':200,'status':'Error','message':'error for create card'});
                                  return;
                              }
                            });

                    }

                    function InsertTransactionHistory(user_id,charge_id,amount,appointment_request_id)
                    {
                      console.log('penaly charged of ',amount);
                      //insert into transaction_history
                      date=new Date();
                      transaction_historyValue=[user_id,charge_id,'charge',amount,appointment_request_id,date]
                      connection.query('insert into transaction_history(customerId,chargeId,status,balance_transaction,appointment_request_id,date) values(?)',[transaction_historyValue],
                      function(err,inserted){
                        if(!err)
                        {
                            console.log('data inserted Successfully..');
                            appointment_request_status(false,appointment_request_id, true)
                            return;
                        }
                        else
                        {
                            console.log('Error for inserting data',err);
                            res.json({'code':200,'status':'Error','message':'Error for inserting data'});
                            return;
                        }
                      });
                    }

                    function selectedProfessionalDues(user_id,callback)
                    {
                      connection.query('Select * from professional_dues  Where  professional_id = ? AND paid_status = 0 ',[user_id],
                      function(err,profesionalDuesData){
                        if(!err)
                        {
                          appointment_request_id=profesionalDuesData[0].appointment_request_id
                          callback(appointment_request_id);
                        }
                        else
                        {
                          console.log('Error for selecting professional_dues data');
                        }
                      });
                    }

                    function UpdateProfessionalDuess(SelectQuery, appointment_request_id,userId,amount,penalty)
                    {
                            console.log('UpdateProfessionalDuess amount',amount);
                            connection.query(SelectQuery,
                              function (err, selectedProfessionalDue) {

                                if (err)
                                {
                                    winston.info(chalk.red(" job report :Failed to query professional_dues ", err));
                                }
                                else if (!selectedProfessionalDue || selectedProfessionalDue.length === 0)
                                {
                                    winston.info(chalk.green(" Entry for Professional  does not exist in Professional_dues , Creating registry in Professional_dues "));
                                    appointment_request_id=req.body.appointment_request_id
                                    var insertQuery = 'Insert Into professional_dues (professional_id, penalty,appointment_request_id) Value ( ' + userId + ',' + amount + ','+ appointment_request_id +')';
                                    UpdateProfessionalDues(insertQuery, appointment_request_id)
                                }
                                else
                                {
                                    if(penalty)
                                    {
                                        var totalAmount = selectedProfessionalDue[0].penalty + amount;
                                        var professionalDueId = selectedProfessionalDue[0].id;
                                        var updateQuery = 'UPDATE professional_dues SET penalty = ' + totalAmount + ' WHERE ( id = ' + professionalDueId + ')';
                                    }
                                    else
                                    {
                                        var totalAmount = selectedProfessionalDue[0].amount_due + amount;
                                        var professionalDueId = selectedProfessionalDue[0].id;
                                        var updateQuery = 'UPDATE professional_dues SET amount_due = ' + totalAmount + ' WHERE ( id = ' + professionalDueId + ')';
                                    }
                                    UpdateProfessionalDues(updateQuery, appointment_request_id)
                                }

                                function UpdateProfessionalDues(query, appointment_request_id)
                                {

                                    connection.query(query, function (err, recordUpdated) {
                                        if (err)
                                        {
                                            console.log(" job report :there was an error updating values in professional_dues,Error Details:", err);

                                        }
                                        else
                                        {
                                            console.log("Record updated in Professional_dues successfully ");
                                            if(penalty)
                                            {
                                                  appointment_request_status(true,appointment_request_id,false);
                                            }
                                            else
                                            {
                                                  appointment_request_status(false,appointment_request_id,true);
                                            }
                                        }
                                    })
                                }
                            })
                        }

                    function appointment_request_status(is_professional,appointment_request_id, payProfessional)
                    {
                        var updateAppointmentRequest = "";
                        if(!is_professional && payProfessional)
                        {
                            // user is client pay the professional and mark status complete

                            winston.info(chalk.green('user is client pay the professional and mark status complete'));
                            updateAppointmentRequest = 'update appointment_request set    professional_id ='+ ProfessionalID +',status="cancel" ,payment_status = 1 where (appointment_request_id=' + appointment_request_id + ')'

                        }
                        else if(!is_professional && !payProfessional)
                        {
                            // user is not professional simply cancel the appointment but deduct service fee
                            winston.info(chalk.green('// user is not professional simply cancel the appointment'));
                            // payment status indicates that payment is done
                            updateAppointmentRequest = 'update appointment_request set status="cancel"  ,payment_status = 1 where (appointment_request_id=' + appointment_request_id + ')'

                        }
                       else if (is_professional && !payProfessional)
                        {
                            // user is professional update status to pending

                            winston.info(chalk.green('// user is professional update status to pending'));

                            updateAppointmentRequest = 'update appointment_request set status="panding" , professional_id=0 ,payment_status = 0  where  (appointment_request_id=' + appointment_request_id + ')';
                        }
                        else if(is_professional)
                        {
                            // user is professional and dont pay the professional just mark the status complete --------
                            winston.info(chalk.green('// user is professional and dont pay the professional just mark the status complete --------'));
                            updateAppointmentRequest = 'update appointment_request set status="panding" , user_id=0 ,payment_status = 0 where (appointment_request_id=' + appointment_request_id + ')'
                        }

                        connection.query(updateAppointmentRequest,
                          function (err, updata) {
                            if (!err)
                            {
                                // fetching details of appointment after updating
                                connection.query('select * from appointment_request where appointment_request_id=?', [appointment_request_id],
                                    function (err, updateappo) {
                                        if (!err)
                                        {
                                            console.log('appointment is Rejected');
                                            res.json({'code': 200,'status': 'Success','message': 'Appointment cancelled','appointmentData': updateappo});
                                            return;
                                        }
                                        else
                                        {
                                            console.log('appointment request cannot select', err);
                                            res.json({'code': 200,'status': 'Error','message': 'appointment request cannot select','Error': err});
                                            return;
                                        }
                                    });
                            }
                            else
                            {
                                console.log('appointment request Update Error', err);
                                res.json({'code': 200,  'status': 'Error','message': 'appointment request Update Error','Error': err});
                                return;
                            }
                        });
                    }
					}
					else
					{
  						console.log('appointment request Update Error',err);
  						res.json({'code':200,'status':'Error','message':'appointment request Update Error','Error':err});
  						logger.error('URL=',URL.url, 'Responce=','appointment request Update Error');
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


exports.accept=function(req,res)
{
	console.log("*** Requested for Accept Appointment ... ***");
	logger.info('*** Requested for Accept Appointment ... ***');
	  receivedValues = req.body;    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);
    }
    else
	{
		pool.getConnection(function(err,connection){
		if(!err)
		{

			email=req.user.email;
			connection.query('select * from users where email=?',[email],
			function(err,prouser){
				if(!err)
				{
          //First Chaeck Professional's Balance are in negative or not
          professional_id=prouser[0].id
          connection.query('select * from professional_dues where professional_id=? and paid_status!=1',[professional_id],
          function(err,duesDetails){
              if(!err)
              {
                  if(duesDetails!=0)
                  {
                        //console.log('duesDetails',duesDetails);
                        totalTransaction=duesDetails.length
                        console.log('totalTransaction',totalTransaction);
                        var amount_due=0;
                        var penalty=0;
                        for(var i=0;i<totalTransaction;i++)
                        {
                            amount_due=amount_due+duesDetails[i].amount_due
                            penalty=penalty+duesDetails[i].penalty
                        }
                        console.log('amount_due',amount_due);
                        console.log('penalty',penalty);
                        if(amount_due<penalty)
                        {
                            //can not accept any appointent Becouse professional have penaly to pay and not balance more than penalty
                            connection.query('select * from professional_stripe_account where user_id=?',[professional_id],
                            function(err,iscard){
                                if(!err)
                                {
                                    if(iscard=="")
                                    {
                                        console.log('there is no any professional account and card');
                                        res.json({'code':200,'status':'Error','message':'Can not accept appointment \n not enough balance in Professional Dues \n There is no any professional account and card details'});
                                        return;
                                    }
                                    else if(!iscard[0].customer_id)
                                    {
                                        console.log('Can not accept appointment \n not enough balance in Professional Dues \n There is No Old Card Available. do you want to create it ?');
                                        res.json({'code':200,'status':'Error','message':'There is a negative balance on your account. No new appointments can be accepted until this amount is paid.','extra_message':'','Penalty':penalty});
                                        return;
                                    }
                                    else
                                    {
                                        console.log('Can not accept appointment \n not enough balance in Professional Dues \n There is Old Card Available. do you want to pay with it ?');
                                        res.json({'code':200,'status':'Error','message':'There is a negative balance on your account. No new appointments can be accepted until this amount is paid.','extra_message':'You have one save card in your account, do you want to use same card for this payment?','Penalty':penalty});
                                        return;
                                    }

                                }
                                else
                                {
                                    console.log('Error for Selecting data from professional_stripe_account',err);
                                    res.json({'code':200,'status':'Error','message':'Error for Selecting data from professional_stripe_account'});
                                    return;
                                }
                            });
                        }
                        else
                        {
                            //can accept appointment
                            console.log('Amount is more than penalty');
                            AcceptAppointment();
                        }
                  }
                  else
                  {
                      console.log('there is no any transaction or transaction are complited for current professional');
                      AcceptAppointment();
                  }

                  function AcceptAppointment()
                  {
                      user_id=prouser[0].id
                      appointment_request_id=req.body.appointment_request_id
                      connection.query('select * from appointment_request where appointment_request_id=?',[appointment_request_id],
                      function(err,updateappo){
                      if(!err)
                      {
                            service_id=updateappo[0].service_id
                            professional_id=user_id
                            console.log(service_id);
                            console.log(professional_id);
                            connection.query('update appointment_request set status="accept" , professional_id=? where appointment_request_id=?',[user_id,appointment_request_id],
                            function(err,updata){
                            if(!err)
                            {
                                console.log('updated data',updata);
                                customert_id=updateappo[0].user_id
                                res.json({'code':200,'status':'Success','message':'appointment request accepted','appointmentData':updateappo});
                                console.log('updateappo',updateappo);
                                logger.info('URL',URL.url,'Responce=','Appointment request Accepted','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
                                /*msg='Appointment Accepted'
                                title='Appointment Accepted'
                                id=appointment_request_id
                                Tokens.GetUserToken(connection,customert_id,function(result){
                                  Tokens.SendNotification(msg,title,'ACCEPT_APPOINTMENT',id,customert_id,result);
                                });*/
                                connection.query('select u.*,s.name as service_name,s.duration as duration,s.description,sc.name as catagory_name from users as u ,service as s,service_category sc where u.id=? and s.id=? and s.id=sc.id',[updateappo[0].user_id,service_id],
                              function(err,profetional){
                                if(!err)
                                {
                                    console.log('profetional',profetional);
                                    var service_name=profetional[0].catagory_name+"-"+profetional[0].service_name +" "+profetional[0].description  ;
                                    var catagory_name=profetional[0].catagory_name
                                    var professional_name=profetional[0].firstname;
                                    var Duration=profetional[0].duration;
                                    var Address=profetional[0].address;
                                    var country=profetional[0].country;
                                    var city=profetional[0].city;
                                    var zip=profetional[0].zip;
                                    connection.query('select * from users where id=?',[customert_id],
                                    function(err,customer_detail){
                                        if(!err)
                                        {
                                            if(customer_detail=="")
                                            {
                                                console.log('can not select data for send mail  to customer');
                                                res.json({'code':200,'status':'Error','message':'can not select data for send mail  to customer'});
                                                return;
                                            }
                                            else
                                            {
                                                customer_email=customer_detail[0].email
                                                console.log('customer email=',customer_email);
                                                customer_name=customer_detail[0].firstname
                                                id=appointment_request_id
                                                appo_Date=updateappo[0].schedule_date

                                                connection.query('select * from users where id=?',[user_id],
                                                function(err,prof_details){
                                                    if(!err)
                                                    {
                                                        professional_name=prof_details[0].firstname
                                                        professional_email=prof_details[0].email
                                                        EmailFor.AcceptBookingToCustomer(customer_email,customer_name,professional_name,service_name,Duration,appo_Date,catagory_name);
                                                        EmailFor.AcceptBookingToProfessional(professional_email,professional_name,service_name,Duration,appo_Date);
                                                        return;
                                                    }
                                                    else
                                                    {
                                                        Errors.SelectUserError(res,err);
                                                    }
                                                });
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
                                  console.log('Error for selecting profetional Details',err);
                                  res.json({'code':200,'status':'Error','message':'Error for selecting profetional Details'});
                                  logger.error('URL=',URL.url, 'Responce=','Error for selecting profetional Details');
                                  return;
                              }
                            });

                        }
                        else
                        {
                            console.log('appointment request cannot select',err);
                            res.json({'code':200,'status':'Error','message':'appointment request cannot select','Error':err});
                            logger.error('URL=',URL.url, 'Responce=','appointment request cannot select');
                            return;
                        }
                        });
                      }
                      else
                      {
                          console.log('appointment request Update Error',err);
                          res.json({'code':200,'status':'Error','message':'appointment request Update Error','Error':err});
                          logger.error('URL=',URL.url, 'Responce=','appointment request Update Error');
                          return;
                      }
                      });
                    }
              }
              else
              {
                  console.log('Error for selecting duesDetails',err);
                  res.json({'code':200,'status':'Error','message':'Error for selecting duesDetails'});
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


exports.acceptbyuser=function(req,res)
{
	console.log('*** Geting User Appointments ***');
	logger.info('*** Geting User Appointments ***');
	recevedvalue=req.body
	console.log("*** Requested for Creating New Appointment request... ");
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

			var profid=req.body.professional_id
			connection.query('select ar.*,u.*,s.*,sc.id as catagory_id,sc.name as catagory_name from users u,appointment_request ar,service s,service_category sc where ar.service_id=s.id and s.service_category_id=sc.id and  ar.user_id=u.id and ar.professional_id=? and ar.status != "cancel"',[profid],
			function(err,rows){
			if(!err)
				{
					var result = [], index = {};
					rows.forEach(function (row)
					{
						if ( !(row.appointment_request_id in index) )
						{
							index[row.appointment_request_id] =
							{
								appointment_request_id: row.appointment_request_id,
								schedule_date: row.schedule_date,
								service_id: row.service_id,
								notes: row.notes,
								status:row.status,
								message_count:row.message_count,
								rate_by_cust:row.rate_by_cust,
								rate_by_prof:row.rate_by_prof,
								professional_id:row.professional_id,
								name: row.name,
								description: row.description,
								price: row.price,
								gender: row.gender,
								duration: row.duration,
								catagory_name: row.catagory_name,
								category_id: row.catagory_id,
								recure_id: row.recure_id,

								userData: []
							};
							result.push(index[row.appointment_request_id]);
						}

							index[row.appointment_request_id].userData.push({
							id: row.user_id,
							firstname: row.firstname,
							lastname: row.lastname,
							dob: row.dob,
							gender: row.gender,
							phone:row.phone,
							email:row.email,
							address:row.address,
							city:row.city,
              province:row.province,
							country:row.country,
							img_path:row.img_path,
							is_professional:row.is_professional,
							is_social:row.is_social,
							zip:row.zip,
							Q1:row.Q1,
							Q2:row.Q2,
							Q3:row.Q3,
							Q4:row.Q4,
							Q5:row.Q5,
							Q6:row.Q6
							});


					});
					console.log('Request accept by User');
					res.json({'code':200,"status": "Success",'appointment_requestData':result});
					logger.info('URL',URL.url,'Responce=','Appointment request Accept by User','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
					return;
				}
				else
				{
						console.log('Can not select data from user table',err);
						res.json({'code':200,'message':'cannot select data','Error':err});
						logger.error('URL=',URL.url, 'Responce=','Can not select data from user table');
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


exports.reject=function(req,res)
{
		console.log("*** Requested for Appointment Reject... ***");
		logger.info('*** Requested for Appointment Reject... ***');
		receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
		{
        Errors.EmptyBody(res);

    }
    else {
        console.log("*** Validating User Details... ");
        appocolumns = ['professional_id', 'appointment_request_id'];
        var dbValues = [];
        for (var iter = 0; iter < appocolumns.length; iter++) {
            columnName = appocolumns[iter];

						var data=req.body

            if ((receivedValues[columnName] == undefined || receivedValues[columnName] == "")  && (columnName=='appointment_request_id'||columnName=='professional_id'))
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

				console.log('appocolumns',appocolumns);
				console.log('dbValues',dbValues);
					connection.query('INSERT INTO appointment_reject(??) VALUES(?)',[appocolumns,dbValues],
					function(err,rows){
					if(!err)
					{

							console.log('Appointment Rejected Successfully...');
							res.json({'code':200,'status':'Success','message':'Appointment Rejected Successfully...'});
							logger.info('URL',URL.url,'Responce=','Appointment request Appointment Rejected','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);

							connection.query('select * from users where id=?',[req.body.professional_id],
							function(err,professional_detail){
									if(!err)
									{
												professional_name=professional_detail[0].firstname
												professional_email=professional_detail[0].email
												//EmailFor.RejectBookingToProfessional(professional_email,professional_name);
												return;
									}
									else
									{
											Errors.SelectUserError(res,err);
									}
							});

					}
					else
					{
								console.log('cannot Reject request',err);
								res.json({'code':200,'status':'Error','message':'cannot Reject request','err':err});
								logger.error('URL=',URL.url, 'Responce=','cannot Reject request');
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
