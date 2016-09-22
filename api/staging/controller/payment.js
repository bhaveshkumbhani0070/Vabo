var mysql = require('mysql');            //For mysql Connection
var config = require('../config/config'); //For App configuration
var bcrypt = require('bcrypt-nodejs');    //For encryption
var jwt = require("jsonwebtoken");
var fs = require("fs");
var busboy = require('connect-busboy');
var email = require('email-validation');
var logger = require('./log');
var URL = require('../../app.js');
var Errors = require('../constants/functions.js');
var payment = require('../config/payment');

//<script type="text/javascript" src="https://js.stripe.com/v2/"></script>

var async = require('async');
var stripe = require('stripe')('sk_test_d5DLmYD5BDyExfoL85g2DSCQ');
//var Cart = require('../models/cart');

//CONFIGURATION FOR CREATING POOL
var pool = require('../config/db');


var selectQuery = "";
var insertQuery = "";
var deleteQuery = "";
var updateQuery = "";
var tableName = "";
var usercolumns = [];
var receivedValues = {};
var dbValues = [];
var updateString = [];

exports.payment_charge=function(req,res)
{
  console.log("*** Staging Requested for Payment Charge ***");
  logger.info('*** Staging Requested for Payment Charge	***');

  pool.getConnection(function(err,connection){
      if(!err)
      {
          email=req.user.email
          appointment_request_id=req.body.appointment_request_id
          connection.query('select * from transaction_history where appointment_request_id=? and status="uncaptured"',[appointment_request_id],
          function(err,uncapturedData){
              if(!err)
              {
                  if(uncapturedData!="")
                  {
                      chargeId=uncapturedData[0].chargeId

                      stripe.charges.capture(chargeId,
                      function(err, charge) {
                        if(!err)
                        {
                            console.log('Charge Successfully');
                            user_id=uncapturedData[0].customerId
                            charge_id=charge.id
                            amount=uncapturedData[0].balance_transaction
                            date=new Date();
                            transaction_historyData=[user_id,charge_id,'charge',amount,0,appointment_request_id,date]
                            connection.query('insert into transaction_history(customerId,chargeId,status,balance_transaction,debited_credited,appointment_request_id,date) values(?)',[transaction_historyData],
                            function(err,InsertedPayment){
                                if(!err)
                                {
                                    console.log('Appointment Complited Successfully');
                                    res.json({'code':200,'status':'Success','message':'Appointment complete Successfully'});
                                    logger.info('URL',URL.url,'Responce=','Customer Charged Successfully...','User Email=',email,'Appointment Request id=',appointment_request_id);
                                    return;
                                }
                                else
                                {
                                    console.log('Error for Insert data into transaction_history',err);
                                    res.json({'code':200,'status':'Error','message':'Error for Insert data into transaction_history'});
                                    logger.error('URL',URL.url,'Responce=','Customer Charge insert Error...','User Email=',email,'Appointment Request id=',appointment_request_id);
                                    return;
                                }
                              });
                        }
                        else
                        {
                            console.log('Error for Capture Charge',err);
                            res.json({'code':200,'status':'Error','message':'Error for Capture Charge'});
                            logger.error('URL',URL.url,'Responce=','Error for Capture Charge','User Email=',email,'Appointment Request id=',appointment_request_id);
                            return;
                        }
                      });
                  }
                  else
                  {
                      console.log('There is no any uncaptured charge');
                      connection.query('select * from users where email=?',[email],
                      function(err,user){
                        if(!err)
                        {
                          connection.query('select u.*,a.*,s.* from users u,appointment_request a,service s where a.appointment_request_id=? and u.id=a.user_id and a.service_id=s.id',[appointment_request_id],
                          function(err,rows){
                            if(!err)
                            {
                              if(rows!="")
                              {
                                price=rows[0].price
                                oldamount=price.replace('$','');
                                email=rows[0].email
                                user_id=rows[0].user_id
                                var amount=Math.round(oldamount * 100);
                                connection.query('select a.*,up.* from appointment_request a,user_payment_details up where a.user_id=? and a.status="complete" and up.user_id=?',[user_id,user_id],
                                function(err,user_appointment){
                                  if(!err)
                                  {
                                    //charge from cutomer to stripe
                                    cust_id = user_appointment[0].customer_id
                                    stripe.customers.listCards(cust_id,
                                      function(err, cards) {
                                        if(!err)
                                        {
                                          card_id=cards.data[0].id
                                          stripe.charges.create({
                                            amount: amount,
                                            currency: user_appointment[0].currency_type,
                                            customer:cust_id,
                                            card:card_id,
                                            description: "Charge for "+email
                                          },function(err, charge) {
                                            if(!err)
                                            {
                                              var amount=price.replace('$','');
                                              charge_id=charge.id
                                              appointment_request_id=user_appointment[0].appointment_request_id
                                              payment_type=1
                                              appointment_paymentData=[appointment_request_id,payment_type,charge_id,amount]
                                              connection.query('insert into appointment_payment(appointment_request_id,payment_type,transaction_id,payment_amount) values(?)',[appointment_paymentData],
                                              function(err,InsertedPayment){
                                                if(!err)
                                                {
                                                  appointment_paymentInsertId=InsertedPayment.insertId
                                                  var date=new Date();
                                                  transaction_historyData=[user_id,charge_id,'charge',0,amount,0,appointment_request_id,date]
                                                  connection.query('insert into transaction_history(customerId,chargeId,status,balance_transaction,penalty,debited_credited,appointment_request_id,date) values(?)',[transaction_historyData],
                                                  function(err,InsertedTransactionHistry){
                                                    if(!err)
                                                    {
                                                        professional_id=user[0].id
                                                        connection.query('select * from professional_dues where professional_id=? and paid_status=0',[professional_id],
                                                        function(err,oldTransaction){
                                                          if(!err)
                                                          {
                                                            if(oldTransaction=="")
                                                            {
                                                                InsertNewTransactionHistory();
                                                            }
                                                            else
                                                            {
                                                                OldAmount=oldTransaction[0].amount_due
                                                                UpdateOldTransactionHistory(OldAmount);
                                                            }
                                                          }
                                                          else
                                                          {
                                                              console.log('Error for Selecting transction histry',err);
                                                              res.json({'code':200,'status':'Error','Message':'Error for Selecting transction histry'});
                                                              return;
                                                          }
                                                        });

                                                        function InsertNewTransactionHistory()
                                                        {
                                                            transaction_historyInsertId=InsertedTransactionHistry.insertId
                                                            console.log('transaction_history Inserted');
                                                            professional_id=user[0].id
                                                            amount=amount-(amount*10/100)
                                                            professional_duesData=[professional_id,amount,appointment_request_id]
                                                            connection.query('insert into professional_dues(professional_id,amount_due,appointment_request_id) values(?)',[professional_duesData],
                                                            function(err,InsertProfessionalDues){
                                                              if(!err)
                                                              {
                                                                professional_duesInsertId=InsertProfessionalDues.insertId
                                                                console.log('Data inserted into professional_dues');

                                                                connection.query('select ap.*,th.*,pd.* from appointment_payment ap,transaction_history th,professional_dues pd where ap.id=? and th.id=? and pd.id=?',[appointment_paymentInsertId,transaction_historyInsertId,professional_duesInsertId],
                                                                function(err,allData){
                                                                  if(!err)
                                                                  {
                                                                    console.log('All Inserted Data',allData);
                                                                    res.json({'code':200,'status':'Success','message':'Appointment complete Successfully'});
                                                                    logger.info('URL',URL.url,'Responce=','Customer Charged Successfully...','User Email=',email,'Appointment Request id=',appointment_request_id);
                                                                    return;
                                                                  }
                                                                  else
                                                                  {
                                                                    console.log('Error for selecting all data',err);
                                                                    res.json({'code':200,'status':'Error','message':'Error for selecting all data'});
                                                                    logger.error('URL=',URL.url, 'Responce=','Error for selecting all data');
                                                                    return;
                                                                  }
                                                                });
                                                              }
                                                              else
                                                              {
                                                                console.log('Error for insert into professional_dues',err);
                                                                res.json({'code':200,'status':'Error','message':'Error for insert into professional_dues'});
                                                                logger.error('URL=',URL.url, 'Responce=','Error for insert into professional_dues');
                                                                return;
                                                              }
                                                            });
                                                        }

                                                        function UpdateOldTransactionHistory(OldAmount)
                                                        {
                                                              transaction_historyInsertId=InsertedTransactionHistry.insertId
                                                              console.log('transaction_history Update');
                                                              professional_id=user[0].id
                                                              amount=amount-(amount*10/100)
                                                              NewAmount=OldAmount+amount
                                                              professional_duesData=[professional_id,amount,appointment_request_id]
                                                              connection.query('update professional_dues set amount_due=? where professional_id=?',[NewAmount,professional_id],
                                                              function(err,InsertProfessionalDues){
                                                                if(!err)
                                                                {
                                                                  professional_duesInsertId=InsertProfessionalDues.insertId
                                                                  console.log('Data inserted into professional_dues');

                                                                  connection.query('select ap.*,th.*,pd.* from appointment_payment ap,transaction_history th,professional_dues pd where ap.id=? and th.id=? and pd.id=?',[appointment_paymentInsertId,transaction_historyInsertId,professional_duesInsertId],
                                                                  function(err,allData){
                                                                    if(!err)
                                                                    {
                                                                        console.log('All Inserted Data',allData);
                                                                        res.json({'code':200,'status':'Success','message':'Appointment complete Successfully'});
                                                                        logger.info('URL',URL.url,'Responce=','Customer Charged Successfully...','User Email=',email,'Appointment Request id=',appointment_request_id);
                                                                        return;
                                                                    }
                                                                    else
                                                                    {
                                                                        console.log('Error for selecting all data',err);
                                                                        res.json({'code':200,'status':'Error','message':'Error for selecting all data'});
                                                                        logger.error('URL=',URL.url, 'Responce=','Error for selecting all data');
                                                                        return;
                                                                    }
                                                                  });
                                                                }
                                                                else
                                                                {
                                                                  console.log('Error for insert into professional_dues',err);
                                                                  res.json({'code':200,'status':'Error','message':'Error for insert into professional_dues'});
                                                                  logger.error('URL=',URL.url, 'Responce=','Error for insert into professional_dues');
                                                                  return;
                                                                }
                                                              });
                                                        }
                                                    }
                                                    else
                                                    {
                                                        console.log('Error for insert data into transaction_history',err);
                                                        res.json({'code':200,'status':'Error','message':'Error for insert data into transaction_history'});
                                                        logger.error('URL=',URL.url, 'Responce=','Error for insert data into transaction_history');
                                                        return;
                                                    }
                                                  });
                                                }
                                                else
                                                {
                                                    console.log('Error for insert data into appointment_payment table',err);
                                                    res.json({'code':200,'status':'Error','message':'Error for insert data in appointment_payment table'});
                                                    logger.error('URL=',URL.url, 'Responce=','Error for insert data into appointment_payment table');
                                                    return;
                                                }
                                              });
                                            }
                                            else
                                            {
                                                console.log('Error for charge from customer card to stripe',err);
                                                res.json({'code':200,'status':'Error','message':'Error for charge from customer card to stripe'});
                                                logger.error('URL=',URL.url, 'Responce=','Error for charge from customer card to stripe');
                                                return;
                                            }
                                          });
                                        }
                                        else
                                        {
                                            console.log('Error for selecting card',err);
                                            res.json({'code':200,'status':'Error','message':'Error for selecting card'});
                                            logger.error('URL=',URL.url, 'Responce=','Error for selecting card');
                                            return;
                                        }
                                      });
                                    }
                                    else
                                    {
                                        console.log('Error for selecting appointment request data',err);
                                        res.json({'code':200,'status':'Error','message':'Error for selecting appointment request data'});
                                        logger.error('URL=',URL.url, 'Responce=','Error for selecting appointment request data');
                                        return;
                                    }
                                  });
                                }
                                else
                                {
                                    console.log('rows data is blank');
                                    res.json({'code':200,'status':'Error','message':'rows data is blank'});
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
                            console.log('Error',err);
                          }
                        });
                  }
              }
              else
              {
                  console.log('Error for Selecting transaction_history Data',err);
                  res.json({'code':200,'status':'Error','message':'Error for Selecting transaction_history Data'});
                  logger.error('URL',URL.url,'Responce=','Error for Selecting transaction_history Data','User Email=',email,'Appointment Request id=',appointment_request_id);
                  return;
              }
          });
          connection.release();
      }
      else
      {
          console.log('Connectio Error',err);
          res.json({'code':200,'status':'Error','message':'Connection Error'});
          logger.error('URL',URL.url,'Responce=','Connection Error');
          return;
      }
  });
}







 	/*//	pool.getConnection(function(err,connection){
 			if(!err)
 			{

 				var amount=Math.round(req.body.amount *100);
 				fee=amount*10/100
 				payable=amount-fee
 				console.log('fee',fee);
 				console.log('payable',payable);

 				stripe.charges.create({
 						amount: amount,
 						currency: req.body.currency,
 						customer:req.body.customer_id,
 						card:req.body.card_id,
 						description: "Charge for "+req.user.email
 					},function(err, charge) {
 							if(!err)
 							{
 					//*/			/*var result = [], index = {};
 								index[charge.id] =
 								{
 									id:charge.id,
 									amount:charge.amount,
 									currency:charge.currency
 								}
 								result.push(index[charge.id]);

 								console.log('Charge Success...',result);
 								res.json({'Code':200,'status':'Success','message':'Charge Success...','chargeData':result});
 								return;*/

 			/*//					appointment_request_id=req.body.appointment_request_id
 								connection.query('select * from appointment_request where appointment_request_id=?',[appointment_request_id],
 								function (err,appointment_request_data){
 										if(!err)
 										{
 												professional_id=appointment_request_data[0].professional_id
                        console.log('appodata',appointment_request_data);
 												console.log('profetional id=',professional_id);
 												connection.query('select count(user_id) as count from user_payment_details where user_id=?',[professional_id],
 												function(err,user_payment_data){
 													if(!err)
 													{
 															console.log('user_payment_data',user_payment_data);
 															if(user_payment_data[0].count>0)
 															{
 																	console.log('professional have customer account ');
 																	connection.query('select * from user_payment_details where user_id=?',[professional_id],
 																	function(err,customer_detail){
 																		if(!err)
 																		{
 																				customer_id=customer_detail[0].customer_id
 																				console.log('Customer id of Professional',customer_id);

 																				stripe.customers.listCards(customer_id,
 																				function(err, cards) {
 																					if(!err)
 																					{
 																						var result = [], index = {};
 																						console.log('total card',cards.length);
 																						cards.data.forEach(function (row)
 																						{
 																							if ( !(row.id in index) )
 																							{
 																								index[row.id] =
 																								{
 																									id:row.id,
 																									brand:row.brand,
 																									exp_month:row.exp_month,
 																									exp_year:row.exp_year,
 																									last4:row.last4,
 																									name:row.name
 																								}
 																								result.push(index[row.id]);
 																							}
 																						});
 																						card_id=result[0].id
 																						console.log('card id=',card_id);
 																						stripe.transfers.create({
 																									amount: payable,
 																									currency: req.body.currency,
 																									destination: card_id,
 																									description: "Transfer for appointment request"
 																								}, function(err, transfer) {
 																										if(!err)
 																										{
 																												console.log('Transfer success to professional');
 																												res.json({'code':200,'status':'success','message':'Transfer success to professional','transferData':transfer});
 																												return;
 																										}
 																										else
 																										{
 																												console.log('Error for transfer payment to professional',err);
 																												res.json({'code':200,'status':'Error','message':'Error for transfer payment to professional'});
 																												return;
 																										}
 																								});
 																						console.log('card details',result);
 																						res.json({'code':200,'status':'Success','message':'card details','customer_id':customer_id,'cardsData':result});
 																						return;
 																					}
 																					else
 																					{
 																						console.log('can not select any card',err);
 																						res.json({'code':200,'status':'Success','message':'can not select any card','cardsData':err});
 																						return;
 																					}
 																			});

 																		}
 																		else
 																		{
 																				console.log('Error for selecting customer detail',err);
 																				res.json({'code':200,'status':'Error','message':'Error for selecting customer detail'});
 																				return;
 																		}
 																	});
 															}
 															else
 															{
 																	console.log('Professional have no account');
 																	res.json({'code':200,'status':'Error','message':'Professional have no account'});
 																	return;
 															}
 													}
 													else
 													{
 																console.log('Error for selecting user payment detail',err);
 																res.json({'code':200,'status':'Error','message':'Error for selecting user payment detail'});
 																return;
 													}
 												});
 										}
 										else
 										{
 												console.log('Error for selecting appointment request data',err);
 												res.json({'code':200,'status':'Error','message':'Error for selecting appointment request data'});
 												return;
 										}
 								});
 							}
 							else
 							{
 									console.log('Error for create charge ',err);
 									res.json({'code':200,'status':'Error','message':'Error for charge'});
 									return;
 							}
 					});
          connection.release();
 			}
 			else
 			{
 					console.log('Error for connection',err);
 					res.json({'code':500,'status':'Error','message':'Error for connection...'});
 					return;
 			}
 		});//*/


exports.defaultChange=function(req,res)
{
      console.log("*** Staging Requested for Change Card as Default ***");
      logger.info('*** Staging Requested for Change Card as Default ***');
      receivedValues = req.body    //DATA FROM WEB
      if (JSON.stringify(receivedValues) === '{}')
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
                        connection.query('select * from user_payment_details where user_id=?',[user_id],
                        function(err,customer){
                            if(!err)
                            {
                                cust_id=customer[0].customer_id
                                card_id=req.body.card_id

                                stripe.customers.update(cust_id, {
                                  default_source: card_id
                                }, function(err, customer)
                                {
                                   if(!err)
                                   {
                                       console.log('Change Card as Default',customer);
                                       res.json({'code':200,'status':'Success','message':'Card update as Default'});
                                       logger.info('URL',URL.url,'Responce=','Card update as Default','User Email=',req.user.email,'Appointment Request id=',req.body.appointment_request_id);
                 											return;
                                   }
                                   else
                                   {
                                       console.log('Error for update customer',err);
                                       res.json({'code':200,'status':'Error','message':'Error for update customer'});
                                       logger.error('URL=',URL.url, 'Responce=','Error for update customer');
                     									return;
                                   }
                                });
                            }
                            else
                            {
                                console.log('Error for selecting card detail',err);
                                res.json({'code':200,'status':'Error','message':'Error for selecting card detail'});
                                return;
                            }
                        });
                    }
                    else
                    {
                        console.log('Error for Selecing user detail');
                        res.json({'code':200,'status':'Error','message':'Error for Selecing user detail'});
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

exports.card_detail=function(req,res)
{
  console.log("*** Staging Requested for Card Details ***");
  logger.info('*** Staging Requested for Card Details ***');
  pool.getConnection(function(err,connection){
 			if(!err)
 			{

 					email=req.user.email
 					connection.query('select * from users where email=?',[email],
 					function (err,user) {
 						if(!err)
 						{
 								user_id=user[0].id
 								connection.query('select * from user_payment_details where user_id=?',[user_id],
 								function (err,card_detail) {
 									if(!err)
 									{
 											if(card_detail=="")
 											{
 													console.log('Ther is no card detail for current customer',card_detail);
 													res.json({'code':200,'status':'ok','message':'There is no card detail for current customer','customer Detail':card_detail});
 													return;
 											}
 											else
 											{
 												cust_id = card_detail[0].customer_id
 												name=card_detail[0].name
 												stripe.customers.listCards(cust_id,
 												function(err, cards) {
 													if(!err)
 													{
                              stripe.customers.retrieve(
                              cust_id,
                              function(err, cards_detail) {
                              if(!err)
                              {
                                  console.log('c',cards_detail.default_source);
                                  default_card=cards_detail.default_source
                                  console.log('total card',cards.length);
       														var result = [], index = {};
       														cards.data.forEach(function (row)
       														{
       															if ( !(row.id in index) )
       															{
       																index[row.id] =
       																{
       																	id:row.id,
       																	brand:row.brand,
       																	exp_month:row.exp_month,
       																	exp_year:row.exp_year,
       																	last4:row.last4,
       																	name:row.name
       																}
       																result.push(index[row.id]);
       															}
       														});

 														console.log('card details',result);
 														res.json({'code':200,'status':'Success','message':'card details','customer_id':cust_id,'default_card':default_card,'cardsData':result});
 														return;
                          }
                          else
                          {
                              console.log('Error for selecting Default card',err);
                          }
                        });


 													}
 													else
 													{
 														console.log('can not select any card',err);
 														res.json({'code':200,'status':'Success','message':'can not select any card','cardsData':err});
 														return;
 													}
 											});
 										}
 									}
 									else
 									{
 										console.log('error for selecting user',err);
 										res.json({'code':200,'status':'Error','message':'error for selecing user'});
 										return;
 									}
 								});
 						}
 						else
 						{
 								console.log('Error for selecing user',err);
 								res.json({'code':200,'status':'Error','message':'Error for selecting users'});
 								return;
 						}
 					});
          connection.release();
 			}
 	});
 }

//*** /api/card/create

exports.card_create = function (req, res)
{
  console.log("*** Staging Requested for Card Create ***");
  logger.info('*** Staging Requested for Card Create ***');

    var tokenToForward;
    console.log("*** Requested for Creating New User... ");
    receivedValues = req.body;    //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}')
    {
        console.log("*** Redirecting: No appropriate data available for Card Create");
        res.json({"code": 204, "status": "Error", "message": "No appropriate data available for Card Create"});
        return;
    }
    else
    {
        stripe.tokens.create({
            card: {
                "number": req.body.card_number,
                "exp_month": req.body.exp_month,
                "exp_year": req.body.exp_year,
                "card_type": req.body.card_type,
                "cvc": req.body.cvc,
                "name": req.body.name
            }
        }, function (err, token) {
            if (err)
            {
                console.log('Error for creating card', err);
                res.json({'code': 200, 'status': 'Error', 'message': 'Error for creating card', 'Error': err});
                return;
            }
            else
            {
                // token generated corresponding to provided data
                console.log(token);
                var currencyType = '';
                if (token.card.country === 'US')
                {
                    currencyType = 'usd'
                }
                else
                {
                    currencyType = 'cad'
                }
                tokenToForward = token;
                console.log("token ", token);
                pool.getConnection(function (err, connection) {
                    if (!err)
                    {

                        email = req.user.email;
                        connection.query('select * from users where email=?', [email],
                            function (err, user) {
                                if (!err)
                                {
                                    var user_id = user[0].id;
                                    connection.query('SELECT count(user_id) as count FROM user_payment_details WHERE user_id = ?', [user_id],
                                    function (err, customer) {
                                      if (!err)
                                      {
                                          if (customer[0].count >= 1)
                                          {
                                              console.log('Customer Exist');
                                              //Customer Exist
                                              connection.query('select * from user_payment_details where user_id=?', [user_id],
                                              function (err, customer_detail) {
                                              if (!err)
                                              {
                                                    stripe.customers.createSource(
                                                    customer_detail[0].customer_id,
                                                    {source: token.id},
                                                    function (err, card) {
                                                    if (!err)
                                                    {
                                                            var result = [], index = {};
                                                            index[card.id] =
                                                            {
                                                                id: card.id,
                                                                brand: card.brand,
                                                                exp_month: card.exp_month,
                                                                exp_year: card.exp_year,
                                                                last4: card.last4,
                                                                name: card.name
                                                            };
                                                                result.push(index[card.id]);
                                                                console.log('card create with old customer', result);
                                                                res.json({
                                                                    'code': 200,
                                                                    'status': 'Success',
                                                                    'message': 'card create with old customer',
                                                                    'customer_id': customer_detail[0].customer_id,
                                                                    'email': req.user.email,
                                                                    'cardsData': result,
                                                                    token: tokenToForward
                                                                });
                                                                //	res.json({'code':200,'status':'Success','message':'customer created with card detail','customer_id':customer.id,,'customer Detail':customer.sources});
                                                                return;
                                                            }
                                                            else
                                                            {
                                                                console.log(' Error for creating card', err);
                                                                res.json({'code': 200,'status': 'Error','message': ' Error for creating card'});
                                                                return;
                                                            }
                                                        });
                                                      }
                                                    });
                                              }
                                              else
                                              {
                                                    console.log('Customer Not Exist Create new one');
                                                    //Customer Not Exist Create new one
                                                    var tok = token.id;
                                                    console.log('token_id', tok);

                                                    stripe.customers.create({
                                                        description: 'Customer for ' + req.user.email,
                                                        email: req.user.email,
                                                        source: token.id
                                                    }, function (err, customer) {
                                                        if (!err)
                                                        {

                                                            pool.getConnection(function (err, connection) {

                                                                if (!err)
                                                                {
                                                                  connection.query('select * from users where email=?', [req.user.email],
                                                                      function (err, user) {
                                                                          if (!err)
                                                                          {
                                                                              user_id = user[0].id;
                                                                              var customer_id = customer.id;
                                                                              //card_id=card.id
                                                                              name = req.body.name;
                                                                              connection.query('insert into user_payment_details(user_id,customer_id,currency_type) values(?,?,?)', [user_id, customer_id, currencyType],
                                                                                  function (err, customer_inserted) {
                                                                                      if (!err)
                                                                                      {
                                                                                          connection.query('select * from user_payment_details where user_id=?', [user_id],
                                                                                              function (err, data) {
                                                                                                  if (!err)
                                                                                                  {
                                                                                                      var result = [], index = {};
                                                                                                      index[customer.sources.data[0].id] =
                                                                                                      {
                                                                                                          id: customer.sources.data[0].id,
                                                                                                          brand: customer.sources.data[0].brand,
                                                                                                          exp_month: customer.sources.data[0].exp_month,
                                                                                                          exp_year: customer.sources.data[0].exp_year,
                                                                                                          last4: customer.sources.data[0].last4,
                                                                                                          name: customer.sources.data[0].name
                                                                                                      };
                                                                                                      result.push(index[customer.sources.data[0].id]);

                                                                                                      console.log('customer created', result);
                                                                                                      res.json({
                                                                                                          'code': 200,
                                                                                                          'status': 'Success',
                                                                                                          'message': 'customer created with card detail',
                                                                                                          'customer_id': customer.id,
                                                                                                          'email': req.user.email,
                                                                                                          'cardsData': result,
                                                                                                          token: tokenToForward
                                                                                                      });
                                                                                                      return;
                                                                                                  }
                                                                                                  else
                                                                                                  {
                                                                                                      console.log('Error for selecting user detail', err);
                                                                                                      res.json({
                                                                                                          'code': 200,
                                                                                                          'status': 'Error',
                                                                                                          'message': 'Error for selecting user detail',
                                                                                                          'Error': err
                                                                                                      });
                                                                                                      return;
                                                                                                  }
                                                                                              });
                                                                                      }
                                                                                      else
                                                                                      {
                                                                                          console.log('error for insert data ', err);
                                                                                          res.json({
                                                                                              'code': 200,
                                                                                              'status': 'Error',
                                                                                              'message': 'Error For insert data ',
                                                                                              'Error': err
                                                                                          });
                                                                                          return;
                                                                                      }
                                                                                  });
                                                                          }
                                                                          else
                                                                          {
                                                                              console.log('error for insert data ', err);
                                                                              res.json({
                                                                                  'code': 200,
                                                                                  'status': 'Error',
                                                                                  'message': 'error for Update data ',
                                                                                  'Error': err
                                                                              });
                                                                              return;
                                                                          }
                                                                      });
                                                                      connection.release();
                                                                }
                                                                else
                                                                {
                                                                    console.log('error for insert data ', err);
                                                                    res.json({'code': 200,'status': 'Error','message': 'error for Update data ','Error': err});
                                                                    return;
                                                                }

                                                            });
                                                        }
                                                        else
                                                        {
                                                            console.log('error for creating user', err);
                                                            res.json({'code': 200,'status': 'Error','message': 'error for creating user','Error': err});
                                                            return;
                                                        }
                                                    });
                                              }
                                            }
                                            else
                                            {
                                                console.log('customer id select error', err);
                                                res.json({"code": 204,"status": "Error","message": "customer id select error"});
                                                return;
                                            }
                                        });
                                }
                                else
                                {
                                    console.log('Error For selecting user', err);
                                    res.json({'code': 200,'status': 'Error','message': 'Error For selecting user','Error': err});
                                    return;
                                }
                            });
                            connection.release();
                    }
                });
            }
        });
    }
};

//*** /api/card/edit

exports.card_edit=function(req,res)
{
  console.log("*** Staging Requested for Card Edit ***");
  logger.info('*** Staging Requested for Card Edit ***');
	receivedValues = req.body    //DATA FROM WEB
	if(JSON.stringify(receivedValues) === '{}')
	{
			console.log("*** Redirecting: No appropriate data available for Card Create");
			res.json({"code" : 204, "status" : "Error","message" : "No appropriate data available for Card Create"});
			return;
	}
	else
	{
		var cust_id=req.body.customer_id
		var card_id=req.body.card_id

		stripe.customers.updateCard(
			  cust_id,
			  card_id,
			  {
					exp_month:req.body.exp_month,
					exp_year:req.body.exp_year,
					name:req.body.name
				},
		 function(err, cards)
			{
				if(!err)
				{
						var result = [], index = {};
						index[cards.id] =
						{
							id:cards.id,
							brand:cards.brand,
							exp_month:cards.exp_month,
							exp_year:cards.exp_year,
							last4:cards.last4,
							name:cards.name
						}
						result.push(index[cards.id]);

						console.log('card Edited ..',result);
						res.json({'code':200,'status':'Success','message':'Card Edited ','cardsData':result});
						return;
				}
				else
				{
						console.log('error for edit card ',err);
						res.json({'code':200,'status':'Error','message':'Error for edit card ','Error':err});
						return;
				}
			});
		}
}

exports.delete_card=function(req,res)
{
  console.log("*** Staging Requested for Card Delete ***");
  logger.info('*** Staging Requested for Card Delete ***');

	customer_id=req.body.customer_id
	card_id=req.body.card_id

	stripe.customers.deleteCard(
  customer_id,
  card_id,
  function(err, cardsData) {
    if(!err)
		{
				console.log('Card deleted...',cardsData);
				res.json({'code':200,'status':'Success','message':'card deleted','cardsData':cardsData});
				return;
		}
		else
		{
				console.log('Error for Delete card',err);
				res.json({'code':200,'status':'Error','message':'Error for Delete card'});
				return;
		}
  });
}


exports.charge=function(req,res)
{
  console.log("*** Staging Requested for Charge ***");
  logger.info('*** Staging Requested for Charge ***');

	//var stripeToken = req.body.stripeToken;
  var amount=Math.round(req.body.amount *100);

	pool.getConnection(function(err,connection){
		if(!err)
		{

			email=req.user.email;
			console.log('email',email);
			connection.query('select * from users where email=?',[email],
		function(err,userdetail) {
			if(!err)
			{
				//user_id=userdetail[0].id
				user_id=130
				console.log('user_id',user_id);
				connection.query('select * from user_payment_details where user_id=?',[user_id],
			function(err,card_detail) {
				if(!err)
				{
						console.log('pay detail',card_detail);
						stripeToken=card_detail[0].token

						stripe.tokens.create({
							card: {
							"number": card_detail[0].card_number,
							"exp_month": card_detail[0].expiry_month,
							"exp_year": card_detail[0].expiry_year,
							"card_type":card_detail[0].card_type
							}
						}, function(err, token)
							{
								if(err)
								{
										console.log('token can not create',err);
								}
								else
								{
									console.log('old token',stripeToken);
									console.log('new token',token);
							}
						});
				}
				else
				{
						console.log('Error for selecting user',err);
				}
			});
			}
		});
    connection.release();
	}
  else
  {
    console.log('Connnection Error',err);
    res.json({'code':200,'status':'Error','message':'Connection Error'});
    return;
  }
	});

}



/*
 stripe.transfers.create({
 amount: 1000,
 currency: "usd",
 source_type:"card",
 //destination_payment:"cus_8weRTghhaRqa4H",
 //destination:"cus_8weRTghhaRqa4H",
 destination: 'acct_18fTyUEyowqraZ6A',
 description: "Transfer for test@example.com"
 }, function(err, transfer) {
 if(!err)
 {
 console.log('Transfer success',transfer);
 }
 else
 {
 console.log('Error for Transaction',err);
 }
 });
 */



/*
 stripe.balance.retrieve(
 function(err, balance) {
 if(!err)
 {
 console.log('balances',balance);
 }
 else
 {
 console.log('Error for view balance',err);
 }
 });
 */


/*
 stripe.accounts.update("acct_18fTyUEyowqraZ6A",
 {
 legal_entity:
 {
 dob:
 {
 day:30,
 month:04,
 year:1994
 },
 first_name:"fname",
 last_name:"lname",
 type:"individual"
 }

 }, function(err, account) {
 if(!err)
 {
 console.log('account created',account);
 }
 else
 {
 console.log('Can not account',err);
 }
 });*/
/*
 stripe.recipients.create({
 name: "John Doe",
 type: "individual",
 card:"card_18fQe4F1GTddxJptVPIh7btY",
 email: "payee@example.com"
 }, function(err, recipient) {
 if(!err)
 {
 console.log('recipient done',recipient);
 }
 else
 {
 console.log('Can not recipient',err);
 }
 });
 */


/*
 stripe.recipients.create({
 name: "fname lname",
 type: "individual",
 card:"card_18fQe4F1GTddxJptVPIh7btY"
 }, function(err, recipient) {
 if(!err)
 {
 console.log('recipient created successfully...',recipient);
 }
 else
 {
 console.log('Error for  recept',err);
 }
 });
 */


/*
 stripe.accounts.create(
 {
 country: "US",
 managed: true,
 legal_entity: {
 first_name:'kumbhani',
 last_name:'alex',
 dob:{
 day:30,
 month:04,
 year:1994
 },
 address:{
 country: "US"
 }

 }
 }
 );
 */


/*
 exports.token=function(req,res)
 {
 console.log("*** Requested for Creating New Appointment request... ");
 receivedValues = req.body    //DATA FROM WEB
 if(JSON.stringify(receivedValues) === '{}'){
 console.log("*** Redirecting: No appropriate data available for creating appointment Request")
 res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for creating appointment Request"});
 return;
 }
 else
 {
 console.log("*** Validating User Details... ");
 paycolumns=['card_type','card_number','expiry_month','expiry_year'];
 for(var iter=0;iter<paycolumns.length;iter++)
 {
 columnName = paycolumns[iter];
 var data=req.body
 if((data == undefined || data == "") && (columnName=='card_type' || columnName=='card_number' || columnName=='expiry_month' || columnName=="expiry_year"))
 {
 console.log("*** Redirecting: ",columnName," field is required")
 res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
 return;
 }
 dbValues[iter] = receivedValues[columnName];

 }



 //Customer Created With Token
 stripe.tokens.create({
 card: {
 "number": req.body.card_number,
 "exp_month": req.body.exp_month,
 "exp_year": req.body.exp_year,
 "card_type":req.body.card_type
 }
 }, function(err, token)
 {
 if(err)
 {
 console.log('err');
 }
 else
 {
 var email=req.user.email;
 console.log('email',email);
 console.log()
 console.log('token',token);
 stripe.customers.create({
 email:email,
 description: 'Customer for test@example.com',
 source: token.id // obtained with Stripe.js
 },
 function(err, customer)
 {
 if(err)
 {
 console.log('error for creatig customer');
 }
 else
 {

 pool.getConnection(function(err,connection){
 connection.release();
 if(!err)
 {

 connection.query('select * from users where email=?',[email],
 function(err,rows){
 if(!err)
 {

 var user_id=rows[0].id;

 connection.query('insert into user_payment_details(??,user_id) values(?,?)', [paycolumns,dbValues,user_id],
 function(err,inserted){
 if(!err)
 {
 connection.query('update user_payment_details set token=? where user_id=?',[token])

 connection.query('select * from user_payment_details where user_id=?',user_id,
 function(err,paymentdetail) {
 if(!err)
 {
 console.log('Customer create With creadit detail');
 res.json({'code':200,'status':'Success','message':'Customer create With creadit detail','customerData':paymentdetail});
 return;
 }
 else
 {
 console.log('Customer can not select after insert',err);
 res.json({'code':200,'status':'Error','message':'Customer can not select after insert','Error':err});
 return;
 }
 });
 }
 else
 {
 console.log('Cannot create customer',err);
 res.json({'code':200,'status':'Error','message':'cannot create customer','Error':err});
 return;
 }
 });

 }
 else
 {
 console.log('Error for selecting user',err);
 res.json({'code':200,'status':'Error','message':'Error for select current user','Error':err});
 return;
 }
 });
 }
 });
 }
 });
 }
 });
 }
 }
 */
/* Retrive Charge
 stripe.charges.retrieve(
 "ch_18crWvF1GTddxJptIkm692PJ",
 function(err, charge) {
 if(err)
 {
 console.log('err',err);
 }
 else
 {
 console.log('charge retrive',charge.balance_transaction);
 }
 }
 );*/

/* Retrive Transaction

 stripe.balance.retrieveTransaction(
 "txn_18crWvF1GTddxJptJmRrfndv",
 function(err, balanceTransaction) {
 if(err)
 {
 console.log('err',err);
 }
 else
 {
 console.log('charge retrive',balanceTransaction);
 }
 }
 );
 */
/* update
 stripe.charges.update(
 "ch_18crWvF1GTddxJptIkm692PJ",
 {
 description: "Charge for test@example.com",
 //metadata
 //receipt_email
 //fraud_details
 //shipping
 },
 function(err, charge) {
 if(err)
 {
 console.log('err',err);
 }
 else
 {
 console.log('charge retrive',charge);
 }
 }
 );
 */
/*
 stripe.charges.list(
 { limit: 3 },
 function(err, charges) {
 if(err)
 {
 console.log('err',err);
 }
 else
 {
 console.log('charge retrive',charges);
 }
 }
 );*/
/* Delete Cutomer With Custmer id

 stripe.customers.del(
 "cus_8uP4RfdzZi7viA",
 function(err, customer) {
 if(err)
 {
 console.log('err',err);
 }
 else
 {
 console.log('charge retrive',customer);
 return;
 }
 }
 );
 */
/*
 //Refund
 stripe.refunds.create({
 charge: "ch_18crWvF1GTddxJptIkm692PJ"
 }, function(err, refund) {
 if(err)
 {
 console.log('err',err);
 }
 else
 {
 console.log('charge retrive',refund);
 return;
 }
 });
 */
