var stripeKeys = require('../config/stripe');
var stripe = require("stripe")(stripeKeys.stripeSecretKey);
var logger = require('./log');
var URL = require('../../app.js');
var pool = require('../config/db');
var Errors = require('../constants/functions.js');
var winston = require('winston');
var chalk = require('chalk');
var Tokens = require('./getFCMtokens.js');
var moment = require('moment');

exports.customerCreate=function(req,res)
{
  console.log("*** Staging Requested for customerCreate ***");
  logger.info('*** Staging Requested for customerCreate ***');

      var cvc = req.body.cvc;
      var exp_month = req.body.exp_month;
      var card_number = req.body.card_number;
      var exp_year = req.body.exp_year;
      var card_type=req.body.card_type;


      if (!exp_month)
      {
          return res.json({'code':200,code:200,Status: 'Error',message: 'Please provide exp_month of card'});
      }
      if (!exp_year)
      {
          return res.json({'code':200,Status: 'Error',message: 'Please provide exp_year of card'});
      }
      if (!card_number)
      {
          return res.json({'code':200,Status: 'Error',message: 'Please provide card_number'});
      }

      if (!card_type)
      {
          return res.json({'code':200,Status: 'Error',message: 'Please provide card_type'});
      }
      if (!cvc)
      {
          return res.json({'code':200,Status: 'Error',message: 'Please provide cvc'});
      }
      pool.getConnection(function(err,connection){
        if(!err)
        {
            email=req.user.email
            connection.query('select * from users where email=?',[email],
            function(err,professionals){
                if(!err)
                {
                    user_id=professionals[0].id
                    name=professionals[0].firstname+" "+professionals[0].lastname
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
                            //Create Professional Customer
                            stripe.customers.create({
                                description: 'Customer for '+req.user.email,
                                email: req.user.email,
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

                                    //create stripe card and save card id as professional
                                                  //query=insert
                                    console.log('Create professional accout and cusomer aaccount');
                                    //update professional_stripe_account and add customer_id
                                    connection.query('update professional_stripe_account set customer_id=? where user_id=?',[customer_id,user_id],
                                      function (err, insertion) {
                                        if (err)
                                        {
                                                console.log("Error Occurred",err);
                                                res.json({'code':200,'Status': 'Error ',message: 'User has already registered stripe account '});
                                                return
                                        }
                                        if (!insertion)
                                        {
                                                console.log('No value row updated');
                                                res.json({'code':200,Status: 'Error',message: 'No value row updated'});
                                                return;
                                        }
                                        else
                                        {
                                                console.log("Success")
                                                res.json({'code':200,Status: 'Success',message: 'Customer Account Created Successfully',Data: insertion});
                                                return
                                        }
                                      });
                                }
                                else
                                {
                                    console.log('Error for creating Professional account',err);
                                    res.json({'code':200,'status':'Error','message':'Error for creating Professional customer'});
                                    return;
                                }
                          });
                        }
                        else
                        {
                            console.log('Error for create token using card details',err);
                            res.json({'code':200,'status':'Error','message':'Error for create token using card details'});
                            return;
                        }
                    });
                }
                else
                {
                    console.log('Error for selecting user details',err);
                    res.json({'code':200,'status':'Error','message':'Error for selecting user details'});
                    return;
                }
            });
            connection.release();
        }
        else
        {
            console.log('connection Error',err);
            res.json({'code':200,'status':'Error','message':'connection Error'});
            return;
        }
    });
}


exports.ProfessionalCharge=function(req,res)
{
  console.log("*** Staging Requested for ProfessionalCharge ***");
  logger.info('*** Staging Requested for ProfessionalCharge ***');

  pool.getConnection(function(err,connection){
      if(!err)
      {
          email=req.user.email
          connection.query('select * from users where email=?',[email],
          function(err,rows){
              if(!err)
              {
                  professional_id=rows[0].id

                  connection.query('select * from professional_dues where professional_id=? and paid_status!=1',[professional_id],
                  function(err,duesDetails){
                      if(!err)
                      {
                          if(duesDetails!=0)
                          {
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
                                  amount=(penalty-amount_due)
                                  console.log('amount for Charge',amount);

                                    connection.query('select * from professional_stripe_account where user_id=?',[professional_id],
                                    function(err,stripeDetails){
                                        if(!err)
                                        {
                                            console.log('stripe Details',stripeDetails);
                                            customer_id=stripeDetails[0].customer_id
                                            console.log('Professional have customer account');
                                            UseOldCard=req.body.UseOldCard

                                            if(customer_id!="" && UseOldCard==1)
                                            {
                                                stripe.customers.listCards(customer_id,
                                                    function(err, cards) {
                                                     if(!err)
                                                     {
                                                         card_id=cards.data[0].id
                                                         console.log('card id Selected',card_id);
                                                         //  Charge Professional
                                                       stripe.charges.create({
                                                           amount: Math.round(amount*100),
                                                           currency: stripeDetails[0].currency_type,
                                                           customer:customer_id,
                                                           card:card_id,
                                                           description: "Charge for "+email
                                                         },function(err, charge) {
                                                             if(!err)
                                                             {
                                                                   console.log('Charge Successfully');
                                                                   //insert data into transaction_history
                                                                   date=new Date();
                                                                   chargeData=[professional_id,charge.id,'charged',amount,date]
                                                                   connection.query('insert into transaction_history(professionalId,chargeId,status,balance_transaction,date) values(?)',[chargeData],
                                                                   function(err,ChargeIns){
                                                                       if(!err)
                                                                       {
                                                                           console.log('Data inserted into transaction_history');
                                                                           //Remove professional_dues
                                                                           connection.query('delete from professional_dues where professional_id=? and paid_status!=1',[professional_id],
                                                                           function(err,professionalDelete){
                                                                               if(!err)
                                                                               {
                                                                                   console.log('data Remove From professional_dues');
                                                                                   connection.query('select * from transaction_history where id=?',[ChargeIns.insertId],
                                                                                   function(err,data){
                                                                                       if(!err)
                                                                                       {
                                                                                           console.log('Transaction data',data);
                                                                                           res.json({'code':200,'status':'Success','message':'Transaction data','Penalty':amount});
                                                                                           customer_name=rows[0].firstname
                                                                                           return;
                                                                                       }
                                                                                       else
                                                                                       {
                                                                                           console.log('Error for selecting data',err);
                                                                                           res.json({'code':200,'status':'Error','message':'Error for selecting data'});
                                                                                           return;
                                                                                       }
                                                                                   });
                                                                               }
                                                                               else
                                                                               {
                                                                                   console.log('Error for deleting data',err);
                                                                                   res.json({'code':200,'status':'Error','message':'Error for deleting data'});
                                                                                   return;
                                                                               }
                                                                           });

                                                                       }
                                                                       else
                                                                       {
                                                                           console.log('Error for insert data into transaction_history',err);
                                                                           res.json({'code':200,'status':'Error','message':'Error for insert data into transaction_history'});
                                                                           return;
                                                                       }
                                                                   });
                                                             }
                                                             else
                                                             {
                                                                 console.log('Error for creating Charge',err);
                                                                 res.json({'code':200,'status':'Error','message':'Error for creating Charge'});
                                                                 return;
                                                             }
                                                           });
                                                     }
                                                     else
                                                     {
                                                         console.log('Error for selecting card ');
                                                         res.json({'code':200,'status':'Error','message':'Error for selecting card'});
                                                         return;
                                                     }
                                                   });

                                            }
                                            else
                                            {
                                                console.log('Professional have no customer account create one');

                                                if(customer_id!="" && UseOldCard==0)
                                                {
                                                    customer_id=stripeDetails[0].customer_id
                                                    //create card and save with old customer id
                                                    CreateCardOnly(customer_id);
                                                }
                                                else
                                                {
                                                    CreateCustomerAccount();
                                                }
                                            }

                                            function CreateCustomerAccount()
                                            {
                                                var cvc = req.body.cvc;
                                                var exp_month = req.body.exp_month;
                                                var card_number = req.body.card_number;
                                                var exp_year = req.body.exp_year;
                                                var card_type=req.body.card_type;
                                                var save=req.body.save;

                                                if (!exp_month)
                                                {
                                                    return res.json({'code':200,code:200,Status: 'Error',message: 'Please provide exp_month of card'});
                                                }
                                                if (!exp_year)
                                                {
                                                    return res.json({'code':200,Status: 'Error',message: 'Please provide exp_year of card'});
                                                }
                                                if (!card_number)
                                                {
                                                    return res.json({'code':200,Status: 'Error',message: 'Please provide card_number'});
                                                }

                                                if (!card_type)
                                                {
                                                    return res.json({'code':200,Status: 'Error',message: 'Please provide card_type'});
                                                }
                                                if (!cvc)
                                                {
                                                    return res.json({'code':200,Status: 'Error',message: 'Please provide cvc'});
                                                }




                                                  name=rows[0].firstname+" "+rows[0].lastname
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
                                                        //Create Professional Customer
                                                        stripe.customers.create({
                                                            description: 'Customer for '+req.user.email,
                                                            email: req.user.email,
                                                            source: token_id
                                                        }, function (err, customer) {
                                                            if (!err)
                                                            {
                                                                customer_id=customer.id
                                                                card_id=token.card.id
                                                                stripe.charges.create({
                                                                    amount: Math.round(amount*100),
                                                                    currency: stripeDetails[0].currency_type,
                                                                    customer:customer_id,
                                                                    card:card_id,
                                                                    description: "Charge for "+email
                                                                  },function(err, charge) {
                                                                      if(!err)
                                                                      {
                                                                        console.log('Charge Successfully');
                                                                        //insert data into transaction_history
                                                                        date=new Date();
                                                                        chargeData=[professional_id,charge.id,'charged',amount,date]
                                                                        connection.query('insert into transaction_history(professionalId,chargeId,status,balance_transaction,date) values(?)',[chargeData],
                                                                        function(err,ChargeIns){
                                                                            if(!err)
                                                                            {
                                                                                appointment_request_id=req.body.appointment_request_id
                                                                                charge_id=charge.id
                                                                                if(save==1)
                                                                                {
                                                                                    console.log('update professional_stripe_account with cusomer_id');
                                                                                    connection.query('update professional_stripe_account set customer_id=? where user_id=?',[customer_id,professional_id],
                                                                                    function (err, insertion) {
                                                                                      if (!err)
                                                                                      {
                                                                                            InsertTransactionHistory(professional_id,charge_id,amount,appointment_request_id);
                                                                                      }
                                                                                      else
                                                                                      {
                                                                                            console.log("Error Occurred",err);
                                                                                            res.json({'code':200,'status':'Error','message':'Error Occurred'});
                                                                                            return;
                                                                                      }
                                                                                    });
                                                                                }
                                                                                else if(save==0)
                                                                                {
                                                                                    console.log('do not update professional_stripe_account');
                                                                                    InsertTransactionHistory(professional_id,charge_id,amount,appointment_request_id);
                                                                                }
                                                                                else
                                                                                {
                                                                                    console.log('Please select save for Save card or not');
                                                                                    res.json({'code':200,'status':'Error','message':'Please select save for Save card or not'});
                                                                                    return;
                                                                                }

                                                                                function InsertTransactionHistory(user_id,charge_id,amount,appointment_request_id)
                                                                                {
                                                                                        console.log('charged');
                                                                                        //insert into transaction_history
                                                                                        connection.query('delete from professional_dues where professional_id=? and paid_status!=1',[professional_id],
                                                                                              function(err,professionalDelete){
                                                                                                  if(!err)
                                                                                                  {
                                                                                                      console.log('data Remove From professional_dues');
                                                                                                      connection.query('select * from transaction_history where id=?',[ChargeIns.insertId],
                                                                                                      function(err,data){
                                                                                                          if(!err)
                                                                                                          {
                                                                                                              console.log('Transaction data',data);
                                                                                                              res.json({'code':200,'status':'Success','message':'Transaction Successfully...'});
                                                                                                              return;
                                                                                                          }
                                                                                                          else
                                                                                                          {
                                                                                                              console.log('Error for selecting data',err);
                                                                                                              res.json({'code':200,'status':'Error','message':'Error for selecting data'});
                                                                                                              return;
                                                                                                          }
                                                                                                      });
                                                                                                  }
                                                                                                  else
                                                                                                  {
                                                                                                      console.log('Error for deleting data',err);
                                                                                                      res.json({'code':200,'status':'Error','message':'Error for deleting data'});
                                                                                                      return;
                                                                                                  }
                                                                                                });

                                                                                }

                                                                            }
                                                                            else
                                                                            {
                                                                                console.log('Error for insert data into transaction_history',err);
                                                                                res.json({'code':200,'status':'Error','message':'Error for insert data into transaction_history'});
                                                                                return;
                                                                            }
                                                                        });
                                                                      }
                                                                      else
                                                                      {
                                                                          console.log('Error for creating charge',err);
                                                                          res.json({'code':200,'status':'Error','message':'Error for charge'});
                                                                          return;
                                                                      }
                                                                    });
                                                            }
                                                            else
                                                            {
                                                                console.log('Error for creating customer',err);
                                                                res.json({'code':200,'status':'Error','message':'Error for creating customer','Error':err});
                                                                return;
                                                            }
                                                          });
                                                    }
                                                    else
                                                    {
                                                        console.log('Error for create token',err);
                                                        res.json({'code':200,'status':'Error','message':'Error for create token'});
                                                        return;
                                                    }
                                                  });

                                            }

                                            function CreateCardOnly(customer_id)
                                            {
                                              var cvc = req.body.cvc;
                                              var exp_month = req.body.exp_month;
                                              var card_number = req.body.card_number;
                                              var exp_year = req.body.exp_year;
                                              var card_type=req.body.card_type;
                                              var save=req.body.save;

                                              if (!exp_month)
                                              {
                                                  return res.json({'code':200,code:200,Status: 'Error',message: 'Please provide exp_month of card'});
                                              }
                                              if (!exp_year)
                                              {
                                                  return res.json({'code':200,Status: 'Error',message: 'Please provide exp_year of card'});
                                              }
                                              if (!card_number)
                                              {
                                                  return res.json({'code':200,Status: 'Error',message: 'Please provide card_number'});
                                              }

                                              if (!card_type)
                                              {
                                                  return res.json({'code':200,Status: 'Error',message: 'Please provide card_type'});
                                              }
                                              if (!cvc)
                                              {
                                                  return res.json({'code':200,Status: 'Error',message: 'Please provide cvc'});
                                              }


                                                name=rows[0].firstname+" "+rows[0].lastname
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

                                                      stripe.customers.createSource(
                                                      customer_id,
                                                      {source: token_id},
                                                      function(err, customer) {
                                                        if(!err)
                                                        {
                                                              card_id=token.card.id
                                                              stripe.charges.create({
                                                                  amount: Math.round(amount*100),
                                                                  currency: stripeDetails[0].currency_type,
                                                                  customer:customer_id,
                                                                  card:card_id,
                                                                  description: "Charge for "+email
                                                                },function(err, charge) {
                                                                    if(!err)
                                                                    {
                                                                      console.log('Charge Successfully');
                                                                      //insert data into transaction_history
                                                                      date=new Date();
                                                                      chargeData=[professional_id,charge.id,'charged',amount,date]
                                                                      connection.query('insert into transaction_history(professionalId,chargeId,status,balance_transaction,date) values(?)',[chargeData],
                                                                      function(err,ChargeIns){
                                                                          if(!err)
                                                                          {
                                                                              appointment_request_id=req.body.appointment_request_id
                                                                              charge_id=charge.id

                                                                              console.log('do not update professional_stripe_account');
                                                                              InsertTransactionHistory(professional_id,charge_id,amount,appointment_request_id);

                                                                              function InsertTransactionHistory(user_id,charge_id,amount,appointment_request_id)
                                                                              {
                                                                                      console.log('charged');
                                                                                      //insert into transaction_history
                                                                                      connection.query('delete from professional_dues where professional_id=? and paid_status!=1',[professional_id],
                                                                                            function(err,professionalDelete){
                                                                                                if(!err)
                                                                                                {
                                                                                                    console.log('data Remove From professional_dues');
                                                                                                    connection.query('select * from transaction_history where id=?',[ChargeIns.insertId],
                                                                                                    function(err,data){
                                                                                                        if(!err)
                                                                                                        {
                                                                                                            console.log('Transaction data',data);
                                                                                                            res.json({'code':200,'status':'Success','message':'Transaction Successfully...'});
                                                                                                            return;
                                                                                                        }
                                                                                                        else
                                                                                                        {
                                                                                                            console.log('Error for selecting data',err);
                                                                                                            res.json({'code':200,'status':'Error','message':'Error for selecting data'});
                                                                                                            return;
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else
                                                                                                {
                                                                                                    console.log('Error for deleting data',err);
                                                                                                    res.json({'code':200,'status':'Error','message':'Error for deleting data'});
                                                                                                    return;
                                                                                                }
                                                                                              });

                                                                              }

                                                                          }
                                                                          else
                                                                          {
                                                                              console.log('Error for insert data into transaction_history',err);
                                                                              res.json({'code':200,'status':'Error','message':'Error for insert data into transaction_history'});
                                                                              return;
                                                                          }
                                                                      });
                                                                    }
                                                                    else
                                                                    {
                                                                        console.log('Error for creating charge',err);
                                                                        res.json({'code':200,'status':'Error','message':'Error for charge'});
                                                                        return;
                                                                    }
                                                                  });
                                                          }
                                                          else
                                                          {
                                                              console.log('Error for creating customer',err);
                                                              res.json({'code':200,'status':'Error','message':'Error for creating customer','Error':err});
                                                              return;
                                                          }
                                                        });
                                                  }
                                                  else
                                                  {
                                                      console.log('Error for create token',err);
                                                      res.json({'code':200,'status':'Error','message':'Error for create token'});
                                                      return;
                                                  }
                                                });
                                            }
                                        }
                                        else
                                        {
                                            console.log('Error for selecting stripe Details',err);
                                            res.json({'code':200,'status':'Error','message':'Error for selecting stripe Details'});
                                            return;
                                        }
                                    });



                              }
                              else
                              {
                                  console.log('Can not accept appointment, Not enough balance message');
                                  res.json({'code':200,'status':'Error','message':'Can not accept appointment, Not enough balance message'});
                                  return;
                              }
                          }
                          else
                          {
                              console.log('There is no any Negative Balance for Current Professional');
                              res.json({'code':200,'status':'Error','message':'Ther is no any Transcation for Current Professional'});
                              return;
                          }
                      }
                    });


              }
              else
              {
                  console.log('user select Error',err);
                  res.json({'code':200,'status':'Error','message':'user select Error'});
                  return;
              }
          });
          connection.release();
      }
      else
      {
          console.log('Connection Error',err);
          res.json({'code':200,'status':'Error','message':'Connection Error'});
          return;
      }
  });
}


exports.createProfessionalStripeAccount = function (req, res)
{
  console.log("*** Staging Requested for createProfessionalStripeAccount ***");
  logger.info('*** Staging Requested for createProfessionalStripeAccount ***');

  var professionalId = req.body.professionalId;
  var countryCode = String(req.body.countryCode); // either US OR CA
  var currency = String(req.body.currency);  // currency can either be 'USD ' or 'CAD'
  var business_name = String(req.body.business_name);
  var business_url = String(req.body.business_url);
  var account_number = String(req.body.Bank_account_number);
  var routing_number = String(req.body.Bank_routing_number);
  var product_description = String(req.body.product_description);
  var isCard = req.body.isCard; /// 0 or 1


  var cvc = req.body.cvc;
  var exp_month = req.body.exp_month;
  var card_number = req.body.card_number;
  var exp_year = req.body.exp_year;

  // personal details
  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var city = req.body.last_name;
  var addressLine1 = req.body.addressLine1;
  var postal_code = req.body.postal_code;
  var state = req.body.state;
  var day = req.body.day;
  var month = req.body.month;
  var year = req.body.year;
  var SIN = req.body.SIN;
  var SSN = req.body.SSN;

  // legal verification details

  var personal_id_number =0;

  if (!countryCode)
  {
      return res.json({Status: 'Error',message: 'Country code should either US OR CA', statusCode: 200});
  }


  if (!business_name)
  {
      return res.json({Status: 'Error',message: 'business_name number cannot be empty',statusCode: 200});
  }

  if(isCard && currency ==='cad' ){

      return res.json({Status: 'Error',message: 'Canadian debit card is not supported yet by stripe',statusCode: 200});
  }

  if (!first_name)
  {
      return res.json({Status: 'Error',message: 'First_name cannot be empty',statusCode: 200  });
  }
  if (!last_name)
  {
    return res.json({Status: 'Error',message: 'last_name cannot be empty',statusCode: 200});
  }
  if (!city)
  {
    return res.json({Status: 'Error',message: 'City cannot be empty',statusCode: 200});
  }

  if (!addressLine1)
  {
    return res.json({Status: 'Error',message: 'Please provide address',statusCode: 200});
  }
  if (!postal_code)
  {
    return res.json({Status: 'Error',message: 'Please provide postal code',statusCode: 200});
  }

  if (!state)
  {
    return res.json({Status: 'Error',message: 'Please provide state',statusCode: 200});
  }

  if (!day)
  {
    return res.json({Status: 'Error',message: 'Please provide day of birth',statusCode: 200});
  }

  if (!month)
  {
    return res.json({Status: 'Error',message: 'Please provide month of birth',originalError: err,statusCode: 200});
  }
  if (!year)
  {
      return res.json({Status: 'Error',message: 'Please provide year of birth',statusCode: 200});
  }



  var source = {};

  if (isCard)
  {
      if (!exp_month)
      {
          return res.json({Status: 'Error',message: 'Please provide exp_month of card',statusCode: 200});
      }
      if (!exp_year)
      {
          return res.json({Status: 'Error',message: 'Please provide exp_year of card',statusCode: 200});
      }
      if (!card_number)
      {
          return res.json({Status: 'Error',message: 'Please provide card  number',statusCode: 200});
      }

      if (!cvc)
      {
          return res.json({Status: 'Error',message: 'Please provide personal id number',statusCode: 200});
      }
      source = {
          object: "card",
          exp_month: exp_month,
          exp_year: exp_year,
          number: String(card_number),
          currency: currency,
          cvc: cvc

      }

  }
  else
  {
      if (!routing_number)
      {
          return res.json({Status: 'Error',message: 'Routing_number cannot be empty',statusCode: 200});
      }
      if (!account_number)
      {
          return res.json({Status: 'Error',message: 'Account_number number cannot be empty',statusCode: 200});

      }
      source = {
          object: "bank_account",
          country: countryCode,
          currency: currency,
          routing_number: routing_number,
          account_number: account_number,
      };
      /*cardSource = {
          number: req.body.card_number,
          exp_month: req.body.exp_month,
          exp_year: req.body.exp_year,
          card_type: req.body.card_type,
          cvc: req.body.cvc,
          name: req.body.name
      };*/
  }
 var legal_entity = {};
  if(countryCode == 'CA'){
      if (!SIN)
      {
          return res.json({Status: 'Error',message: 'SIN cannot be empty',statusCode: 200});
      }
      else
      {
          personal_id_number = SIN;
          legal_entity = {
              address: {
                  city: city,
                  line1: addressLine1,
                  postal_code: postal_code,
                  state: state
              },
              personal_id_number: personal_id_number,
              business_name: business_name,
              dob: {
                  day: day,
                  month: month,
                  year: year
              }, //
              first_name: first_name,
              last_name: last_name,
              type: "individual",        // Either Individual or company
          }
      }
  }
  if(countryCode == 'US')
  {
      if (!SSN)
      {
          return res.json({Status: 'Error',message: 'SSN cannot be empty',statusCode: 200});
      }
      else
      {
          personal_id_number = SSN;
          var ssnStirng = String(SSN);
          var length = ssnStirng.length;
          var ssn4 = ssnStirng.slice(length-4);
          ssn4 = Number(ssn4);

          legal_entity = {
              address: {
                  city: city,
                      line1: addressLine1,
                      postal_code: postal_code,
                      state: state
              },
              ssn_last_4: ssn4,
              personal_id_number: personal_id_number,
                  business_name: business_name,
                  dob: {
                  day: day,
                      month: month,
                      year: year
              }, //
              first_name: first_name,
                  last_name: last_name,
                  type: "individual",        // Either Individual or company
          }


      }
  }

  //establish database connection
  pool.getConnection(function (err, connection) {

      if (err)
      {
          //connection.release();
          res.json({Status: 'Error',message: 'database connection failed',originalError: err,statusCode: 200});
          return;
      }
      else
      {
          // get user Detail from database
          var query = "SELECT * FROM users WHERE id = '" + professionalId + "'";
          connection.query(query,
            function (err, professionals) {
              if (err)
              {
                  res.json({Status: 'Error',message: 'Some error occurred while getting data ',originalError: err,statusCode: 200});
                  return;
              }
              if (!professionals)
              {
                  res.json({Status: 'Error',message: 'No user found',originalError: err,statusCode: 200});
                  return;
              }
              // verify that person is professional
              if (professionals[0].is_professional)
              {
                  professionalId = professionals[0].id;
                  // verify if user has already stripe Account
                  query = "SELECT * FROM `professional_stripe_account` WHERE user_id = '" + professionalId + "'";

                  connection.query(query,
                    function (err, stripeAccounts) {
                      if (err)
                      {
                          //connection.release();
                          res.json({Status: 'Error',message: 'Some error occurred while getting manage account details ',originalError: err,statusCode: 200});
                          return;
                      }
                      else if (!stripeAccounts || stripeAccounts.length === 0)
                      {
                          var time = moment.utc().valueOf();;

                          // create managed Stripe Account
                          var stripeObject = {
                              managed: true,
                              country: countryCode, //'US'
                              email: professionals[0].email,
                              product_description: product_description,
                              default_currency: currency,
                              business_name: business_name,
                              business_url: business_url,
                              external_account: source,
                              legal_entity: legal_entity,
                              tos_acceptance: {
                                  date: Math.floor(time / 1000),
                                  ip: req.connection.remoteAddress
                              }
                          };
                          winston.info(chalk.green('Creating stripe manage  account ...'));
                          stripe.accounts.create(stripeObject,
                            function (err, account) {
                              // asynchronously called
                              if (err)
                              {

                                  winston.info(chalk.red("Error occurred while creating stripe account"),err);
                                  return res.json({Status: 'Error',  message: 'Account creation failed',originalError: err,statusCode: 200});
                              }
                              else
                              {
                                  winston.info(chalk.green(" Stripe Account Created Successfully "));
                                  var secret = account.keys.secret;
                                  var publishable = account.keys.publishable;
                                  var stripeId = account.id;
                                  var bank_account_last4=account_number%1000;

                                  var insertionQuery = 'Insert Into professional_stripe_account (stripe_id, secret, publishable, user_id, currency_type,account_number ) ' +
                                      'Values ("' + stripeId + '" , "' + secret + '", "' + publishable + '" , ' + professionalId +', "'+ currency+ '" ,"'+ bank_account_last4 +'")';

                                  connection.query(insertionQuery,
                                    function (err, insertion) {
                                      if (err)
                                      {
                                          console.log("Error Occurred",err);
                                          //connection.release();
                                          res.json({Status: 'Error ',message: 'User has already registered stripe account ',originalError: err,statusCode: 200});
                                          return
                                      }
                                      if (!insertion)
                                      {
                                          //connection.release();
                                          res.json({Status: 'Error',message: 'No value row updated',originalError: "Failed to save values of managed Account in database",statusCode: 200});
                                          return;
                                      }
                                      else
                                      {
                                          //connection.release();
                                          console.log("Success")
                                          res.json({Status: 'Success',message: 'Manage account create Successfully',Data: insertion,statusCode: 200});
                                          return
                                      }
                                  })
                              }
                          });
                      }
                      else
                      {
                          winston.info(chalk.green('Manage Account already exist'));
                          res.json({Status: 'Error',message: 'Manage Account already exist',originalError: err,statusCode: 200});
                          return
                      }
                  });
              }
          });
          connection.release();
      }
  })
}

exports.updateManageAccount = function (req, res)
{
  console.log("*** Staging Requested for updateManageAccount ***");
  logger.info('*** Staging Requested for updateManageAccount ***');

    // will be manged further on clients request

    // var userId = req.body.userId;
    var city = req.body.city;
    var postal_code = req.body.postal_code;
    var addressLine1 = req.body.addressLine1;
    var state = req.body.state;
    var email = req.user.email;
    var selectQuery;


    // var stripe ='';


    pool.getConnection(function (err, connection) {
        if (err)
        {
            return res.json({'code':200,Status: 'Error',message: 'database connection failed',originalError: err});
        }
        else
        {
            connection.query("select * from users where email=?",[email],
              function (err, UserFound) {
                if (err)
                {
                    //connection.release();
                    res.json({'code':200,Status: 'Error',message: 'Professional not found',originalError: "Failed to find such professional's record"});
                    return
                }
                else
                {
                    selectQuery = 'Select * from professional_stripe_account Where user_id = ' + UserFound[0].id;

                    connection.query(selectQuery,
                      function (err, selectedUser) {

                        if (err)
                        {
                            // MANAGE ACCOUNT DOSE NOT EXIST
                            //connection.release();
                            res.json({'code':200,Status: 'Error',message: 'Professional not found',originalError: "Failed to find such professional's record"});
                            return
                        }
                        else
                        {

                            // MANAGE ACCOUNT FOUND, retrieve ITS STRIPE ACCOUNT DETAILS
                            connectStripeAccount = selectedUser[0].stripe_id;

                            stripe.accounts.update(connectStripeAccount, {
                                    legal_entity: {
                                        address: {
                                            city: city,
                                            line1: addressLine1,
                                            postal_code: postal_code,
                                            state: state
                                        }
                                    }
                                },
                                function (err, updatedAccount) {
                                    if (err)
                                    {
                                        //connection.release();
                                        res.json({'code':200,Status: 'Error',message: 'Failed To update mange account',originalError: err});
                                        return
                                    }
                                    else
                                    {
                                        //connection.release();
                                        res.json({'code':200,Status: 'Success',message: 'Updated Successfully'});
                                        return
                                    }
                                })
                        }
                    });
                }
            });
            connection.release();
        }
    });
};

exports.retrieveTransactionHistory = function (req, res)
{
  console.log("*** Staging Requested for retrieveTransactionHistory ***");
  logger.info('*** Staging Requested for retrieveTransactionHistory ***');

    console.log('Request for Transaction History');
      pool.getConnection(function (err, connection) {
        if (!err)
        {
            var email = req.user.email;
            connection.query('select * from users where email=?',[email],
            function (err, user) {
              if (err)
              {
                console.log('Error for selecting User Details',err);
                res.json({Code: 200,Status: 'Error',message: 'Error occurred while searching for login user'});
                return
              }
              else
              {
                user_id=user[0].id
                if(user[0].is_professional)
                {
                      console.log('Professional');
                      connection.query('select u.firstname,u.lastname, t.*,a.service_id,a.user_id ,a.schedule_date,s.description,s.gender,s.servicename ,s.name from transaction_history  t left join appointment_request a on a.appointment_request_id=t.appointment_request_id left join users u on  (u.id= a.user_id ) left join (select s.id,s.name,s.description,s.gender,sc.name as servicename from service s,service_category sc where sc.id=s.service_category_id) as s on a.service_id=s.id where t.professionalId=? and t.status!="uncaptured"',[user_id],
                      function(err,rows){
                        if(!err)
                        {
                            if(rows!="")
                            {
                                UserName=rows[0].firstname+" "+rows[0].lastname
                                var result = [], index = {};
                                OutPut(UserName,rows,function(result){
                                  res.json({'code':200,status: 'Success',message: 'Updated Successfully',data:result});
                                });
                                return;
                            }
                            else
                            {
                                res.json({'code':200,'status':'Error','message':'There is no any transaction'});
                                return;
                            }
                        }
                        else
                        {
                          console.log('Error for selecting appointment Data',err);
                          res.json({'code':200,'status':'Error','message':'Error for selecting appointment Data'});
                          return;
                        }
                      });
                }
                else
                {
                    console.log('Customer');
                    connection.query('select u.firstname,u.lastname, t.*,a.service_id,a.user_id ,a.schedule_date,s.description,s.gender,s.servicename,s.name from transaction_history  t left join appointment_request a on a.appointment_request_id=t.appointment_request_id left join users u on  (u.id= a.professional_id ) left join (select s.id,s.name,s.description,s.gender,sc.name as servicename from service s,service_category sc where sc.id=s.service_category_id) as s on a.service_id=s.id where t.customerId=? and t.status!="uncaptured"',[user_id],
                    function(err,rows){
                      if(!err)
                      {
                          if(rows!="")
                          {
                              UserName=rows[0].firstname+" "+rows[0].lastname
                              var result = [], index = {};
                              OutPut(UserName,rows,function(result){
                                res.json({'code':200,status: 'Success',message: 'Updated Successfully',data:result});
                              });
                              return;
                          }
                          else
                          {
                              res.json({'code':200,'status':'Error','message':'There is no any Transaction'});
                              return;
                          }
                      }
                      else
                      {
                        console.log('Error for selecting appointment Data',err);
                        res.json({'code':200,'status':'Error','message':'Error for selecting appointment Data'});
                        return;
                      }
                    });
                }

                function OutPut(UserName,rows,callback)
                {
                  var result = [], index = {};
                  rows.forEach(function (row)
                  {
                    if ( !(row.id in index) )
                    {
                      index[row.id] =
                      {
                        appointment_request_id: row.appointment_request_id,
                        id:row.id,
                        customerId:row.customerId,
                        professionalId:row.professionalId,
                        chargeId:row.chargeId,
                        status:row.status,
                        application_fee:row.application_fee,
                        balance_transaction:row.balance_transaction,
                        penalty:row.penalty,
                        debited_credited:row.debited_credited,
                        date:row.date,
                        userData: []

                      };
                      result.push(index[row.id]);
                          index[row.id].userData.push({
                            name:row.firstname+" "+row.lastname,
                            appodate:row.schedule_date,
                            servicecategory:row.servicename,
                            service:row.name,
                            description:row.description,
                            gender:row.gender,
                            service_category:row.service_category
                          });
                    }
                  });
                  callback(result);

                }

              }
            });
            connection.release();

        }
        else
        {
          console.log('Error for Connection',err);
          res.json({Code: 200,Status: 'Error',message: 'database connection failed'});
          return;

        }
    });
}

exports.refund = function (req, res)
{
  console.log("*** Staging Requested for refund ***");
  logger.info('*** Staging Requested for refund ***');

    var chargeId = req.body.chargeId;

    stripe.refunds.create(
        {charge: chargeId},
        function (err, refund) {
            if (err)
            {
                return res.json({'code':200,Status: 'Error',message: 'Error Occurred while refunding',data: err});
            }
            else
            {
                return res.json({'code':200,  Status: 'Success',data: refund});
            }
        });
}

//   make seprate api call for this to transfer funds

exports.transferFunds = function (res)
{
  console.log("*** Staging Requested for transferFunds ***");
  logger.info('*** Staging Requested for transferFunds ***');

      var token = req.body.stripeToken;
      var cardNumber = req.body.cardNumber;
     var exp_month = req.body.exp_month;
      var exp_year = req.body.exp_year;
      var cvc = req.body.cvc;
      var moneyToTransfer = req.body.moneyToTransfer;
      var professionalId = req.body.professionalId;
     var connectStripeAccount = '';
      var customerId = '';
      var SelectQuery = 'Select * from professional_stripe_account Where user_id = ' + professionalId;
      var amountToTransfer = req.body.moneyToTransfer;
      var application_fee = moneyToTransfer * req.body.application_fee / 100;

     if (!moneyToTransfer) {
         res.json({
             Status: 'Error',
             message: 'Please provide the amount of money to be transferred',
             statusCode: 200
         });
         return
     }


     // MAKE CONNECTION
     pool.getConnection(function (err, connection) {
         if (err)
         {
             //connection.release();
             return res.json({
                 Status: 'Error',
                 message: 'database connection failed',
                 originalError: err,
                 statusCode: 200
             });
         }
         else
         {
             // var currentLoginUsersId = 'Select * from users Where email = "' + req.user.email + '"';

             connection.query(currentLoginUsersId, function (err, customer) {
                 if (err) {
                     //connection.release();
                     res.json({
                         Status: 'Error',
                         message: 'Some Error occured searching for LogedIn user',
                         originalError: err,
                         statusCode: 200
                     })
                 }
                 else {
                     customerId = customer[0].id;
                     // FIND USER'S MANAGE ACCOUNT
                     connection.query(SelectQuery, function (err, selectedUser) {

                         if (err) {
                             // MANAGE ACCOUNT DOSE NOT EXIST
                             //connection.release();
                             res.json({
                                 Status: 'Professional not found',
                                 message: 'Professional not found',
                                 originalError: "Failed to find such professional's record",
                                 statusCode: 200

                             });
                             return
                         }
                         else if (!selectedUser || selectedUser.length === 0) {
                             console.log(req.user.email,"selectedUser",selectedUser);
                             res.json({
                                 Status: 'Professional not found',
                                 message: 'Professional not found',
                                 statusCode: 200

                             });
                             return
                         }
                         else {
                             // MANAGE ACCOUNT FOUND, retrieve ITS STRIPE ACCOUNT DETAILS
                             console.log("selectedUser:", selectedUser);
                             connectStripeAccount = selectedUser[0].stripe_id;

                             // var source = {
                             //     object: "card",
                             //     number: cardNumber,
                             //     exp_month: exp_month,
                             //     exp_year: exp_year,
                             //     cvc: cvc
                             // };
                             stripe.transfers.create({
                                 amount: amountToTransfer,
                                 recipient: "self"
                             }, {
                                 stripe_account: connectStripeAccount
                             }, function(err, charge) {
                                 // asynchronously called
                             // });

                             // stripe.charges.create({
                             //         amount: 1000,
                             //         currency: 'usd',
                             //         source: source,
                             //         application_fee: application_fee,
                             //         destination: connectStripeAccount
                             //
                             //     },
                             //     function (err, charge) {
                                     if (err) {
                                         //connection.release();
                                         return res.json({
                                             Status: 'failed to charge ',
                                             message: 'No value row updated',
                                             originalError: err,
                                             statusCode: 200
                                         });
                                         return
                                     }
                                     else {
                                         var transactionHistoryInsertion = 'Insert Into transaction_history (customerId, professionalId, chargeId, status, application_fee,balance_transaction)' +
                                             'VALUES (' + customerId + ', ' + professionalId + ', "' + charge.id + '","' + charge.status + '",' + application_fee + ', ' + moneyToTransfer + ')';

                                         connection.query(transactionHistoryInsertion, function (err, historyCreated) {
                                             if (err) {
                                                 //connection.release();
                                                 return res.json({
                                                     Status: 'failed  to create transaction history ',
                                                     message: 'No value row updated',
                                                     originalError: err,
                                                     statusCode: 200
                                                 });
                                                 return
                                             }
                                             else {

                                                 // console.log("Charge Successfully", charge);
                                                 //connection.release();
                                                 res.json({
                                                     Status: 'Account charged Successfully ',
                                                     message: 'Account charged Successfully ',
                                                     statusCode: 200
                                                 })
                                             }

                                         });

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


/*
stripe.accounts.retrieve(
  'acct_18le7IHyBKSCqjXs',
  function(err, account) {
    if(!err)
    {
      var result = [], index = {};
      for (var i in account)
      {
          if ( !(account.id in index) )
          {
            index[account.id] =
            {
              id:account.id,
              first_name:account.legal_entity.first_name,
              last_name:account.legal_entity.last_name,
              business_name:account.business_name,
              currency:account.external_accounts.data[0].currency,
              last4:account.external_accounts.data[0].last4,
              address:account.legal_entity.address
            }
            result.push(index[account.id]);
          }

      }
      console.log('result',result);
    }
    else
    {
        console.log('Err',err);
    }
  });
*/

exports.Account_Detail=function(req,res)
{
  console.log('*** Staging Request for Select Professionals Account details ***');
  logger.info('*** Staging Requested for Select Professionals Account details ***');

  pool.getConnection(function(err,connection){

    if(!err)
    {

          email=req.user.email
          connection.query('select * from users where email=?',[email],
          function(err,user_detail){
              if(!err)
              {
                  user_id=user_detail[0].id
                  connection.query('select * from professional_stripe_account where user_id=?',[user_id],
                  function(err,account_detail){
                      if(!err)
                      {
                          if(account_detail=="")
                          {
                              console.log('No Account Found');
                              res.json({'code':200,'status':'Success','message':'No Account Found'});
                              return;
                          }
                          else
                          {
                            stripe_id=account_detail[0].stripe_id
                            stripe.accounts.retrieve(
                              stripe_id,
                              function(err, account) {
                                if(!err)
                                {
                                  var result = [], index = {};
                                  for (var i in account)
                                  {
                                      if ( !(account.id in index) )
                                      {
                                        index[account.id] =
                                        {
                                          id:account.id,
                                          first_name:account.legal_entity.first_name,
                                          last_name:account.legal_entity.last_name,
                                          business_name:account.business_name,
                                          currency:account.external_accounts.data[0].currency,
                                          last4:account_detail[0].account_number,
                                          address:account.legal_entity.address
                                        }
                                        result.push(index[account.id]);
                                      }

                                  }
                                  console.log('Account details selected');
                                  res.json({'code':200,'status':'Success','message':'Account details selected','Account_detail':result});
                                  return;
                                }
                                else
                                {
                                    console.log('Error for selecting account detail',err);
                                    res.json({'code':200,'status':'Error','message':'Error for selecting accouynt detail'});
                                    return;
                                }
                              });
                          }
                      }
                      else
                      {
                          console.log('Error for selecting account details',err);
                          res.json({'code':200,'status':'Error','message':'Error for selecting account details'});
                          return;
                      }
                  });
              }
              else
              {
                  console.log('Error for select user details',err);
                  res.json({'code':200,'status':'Error','message':'Error for select user details'});
                  return;
              }
          });
            connection.release();
      }
      else
      {
          console.log('Connection Error',err);
          res.json({'code':200,'status':'Error','message':'Connection Error'});
          return;
      }
  });

}
