var stripeKeys = require('../config/stripe');
var stripe = require("stripe")(stripeKeys.stripeSecretKey);
var pool = require('../config/db');
var payment = require('../config/payment');
var async = require('async');
var winston = require('winston');
var chalk = require('chalk');



exports.transferFunds = function ()
{
    var count = 0;
    var length = 0;
    stripe.balance.retrieve(function (err, balance) {
        // asynchronously called
    winston.info(chalk.blue("Balance Status :"),balance);
    // MAKE CONNECTION
    pool.getConnection(function (err, connection) {
      if (err)
      {
          console.log("failed to Connect with database");
      }
      else
      {
            var professionalDuesQuery = 'Select * From  professional_dues Where ( paid_status = 0)';
            connection.query(professionalDuesQuery,
              function (err, professionalDues) {
                if (err)
                {
                    console.log('Error for select professionalDues data',err);
                }
                else if (!professionalDues || professionalDues.length === 0)
                {
                      console.log('NO Pending Dues')
                }
                else
                {
                      length = professionalDues.length;
                      console.log(professionalDues);
                      var iteration = function (professionalDue, callbackDone) {

                      var professionalId = professionalDue.professional_id;
                      var dueAmount = professionalDue.amount_due;
                      var penaltyAmount = professionalDue.penalty;
                      var professionalDueId = professionalDue.id;
                      var getStripeAccQuery = 'Select * From professional_stripe_account where ( user_id =' + professionalId + ')';
                      connection.query(getStripeAccQuery,
                        function (err, stripeAccounts) {
                          if (err)
                          {
                              console.log("job report :Failed to query appointment_request")
                          }
                          else if (!stripeAccounts || stripeAccounts.length === 0)
                          {
                              winston.info(chalk.red("job report :stripe Account does not exist for user with Id" + professionalId));
                              callbackDone();
                          }
                          else
                          {
                                var stripeAcc = stripeAccounts[0].stripe_id;
                                var currency_type = stripeAccounts[0].currency_type;
                                var feeAmount = dueAmount * payment.FeeToCollect;
                                dueAmount = dueAmount - penaltyAmount - feeAmount;

                                if (dueAmount > 0)
                                {
                                      stripe.transfers.create({
                                      currency: currency_type,
                                      amount: Math.round(dueAmount *100),//amount in Dollar
                                      destination: stripeAcc
                                      }, function (err, transaction) {
                                      if (err)
                                      {
                                            console.log('Failed to  transfer money ,Error :', err)
                                      }
                                      else
                                      {

                                              date=new Date();
                                              appointment_request_id=professionalDues[0].appointment_request_id
                                              var transaction_historyData=[professionalId,transaction.id,"paid",feeAmount,dueAmount,appointment_request_id,date];
                                              connection.query('insert into transaction_history(professionalId,chargeId,status,application_fee,balance_transaction,appointment_request_id,date) values(?)',[transaction_historyData],
                                              function(err,historyCreated){
                                                if (err)
                                                {
                                                    console.log("job report :Failed to insert into transaction_history",err)
                                                }
                                                else
                                                {
                                                        // console.log("Charge Successfully", charge);
                                                        updatePaymentDues(transaction.id, professionalDueId);
                                                }
                                              });

                                              /*var transactionHistoryInsertion = 'Insert Into transaction_history ( professionalId, chargeId, status, application_fee,balance_transaction)' +
                                              'VALUES ('  + professionalId + ', "' + transaction.id + '"," paid ",' + feeAmount + ', ' + dueAmount + ')';
                                              connection.query(transactionHistoryInsertion,
                                                function (err, historyCreated) {
                                                if (err)
                                                {
                                                    console.log("job report :Failed to insert into transaction_history",err)
                                                }
                                                else
                                                {
                                                        // console.log("Charge Successfully", charge);
                                                        updatePaymentDues(transaction.id, professionalDueId);
                                                }
                                              });*/
                                      }
                                  });
                                }
                                    else if (dueAmount === 0)
                                    {
                                        console.log("Due balance is 0");
                                    }
                                    else if (dueAmount < 0)
                                    {
                                        var SelectQuery = 'Select * from user_payment_details Where user_id = ' + professionalId;
                                        connection.query(SelectQuery,
                                          function (err, StripeCustomersIds) {
                                            if (err)
                                            {
                                                console.log(" job report :Failed to query user_payment_details ");
                                            }
                                            else
                                            {
                                                var StripeCustomerId = StripeCustomersIds[0].customer_id;
                                                var currency_type = StripeCustomersIds[0].currency_type;
                                                dueAmount = -1 * dueAmount;
                                                stripe.charges.create({
                                                    amount: Math.round(dueAmount *100), // amount in Dollar, again
                                                    currency: currency_type,
                                                    customer: StripeCustomerId // Previously stored, then retrieved
                                                }, function (err, charged) {
                                                    if (err)
                                                    {
                                                         console.log("job report :Failed in charging professional Error :\n", err);
                                                        return
                                                    }
                                                    else
                                                    {

                                                        date=new Date();
                                                        appointment_request_id=professionalDues[0].appointment_request_id
                                                        var transaction_historyData=[professionalId,transaction.id,"paid",feeAmount,dueAmount,appointment_request_id,date];
                                                        connection.query('insert into transaction_history(professionalId,chargeId,status,application_fee,balance_transaction,appointment_request_id,date) values(?)',[transaction_historyData],
                                                        function(err,historyCreated){
                                                          if (err)
                                                          {
                                                              console.log("job report :Failed to insert into transaction_history",err)
                                                          }
                                                          else
                                                          {
                                                              winston.info(chalk.red("job report : "+professionalId +" is charged with Penalty  " ));
                                                              // console.log("Professional " + dueAmount + " cent with id is charged for penalty");
                                                              updatePaymentDues(charged.id, professionalDueId);
                                                          }
                                                        });

                                                        /*
                                                        var transactionHistoryInsertion = 'Insert Into transaction_history ( professionalId, chargeId, status, application_fee,balance_transaction,debited_credited)' +
                                                            'VALUES ('  + professionalId + ', "' + charged.id + '"," charged ",' + 0 + ', ' + dueAmount +', '+ 1 +')';
                                                        connection.query(transactionHistoryInsertion,
                                                          function (err, historyCreated) {
                                                            if (err)
                                                            {
                                                                console.log("job report :Failed to insert into transaction_history",err)
                                                            }
                                                            else
                                                            {
                                                                winston.info(chalk.red("job report : "+professionalId +" is charged with Penalty  " ));
                                                                // console.log("Professional " + dueAmount + " cent with id is charged for penalty");
                                                                updatePaymentDues(charged.id, professionalDueId);
                                                            }
                                                        });*/
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                            function updatePaymentDues(transferId, professionalDueId)
                            {
                                var currentDate = new Date();
                                var month = currentDate.getMonth() + 1;
                                var time = currentDate.getFullYear() + '-' + month + '-' + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
                                var updateQuery = 'UPDATE professional_dues SET paid_status = 1, date_paid_on = "' + time + '" , transfer_id  = "' + transferId + '" WHERE ( id = ' + professionalDueId + ')';
                                connection.query(updateQuery, function (err, updatedDues) {
                                    if (err)
                                    {
                                        console.log("job report :Failed to in updating professional_dues Error :\n", err)
                                    }
                                    else
                                    {
                                        console.log(" Balance Transferred ");
                                        count++;
                                        callbackDone();
                                    }
                                })
                            }
                        };

                        async.eachSeries(professionalDues, iteration, function (err, res) {
                            if (err)
                            {
                                winston.info(chalk.red('Error Occurred While transfering Data'));
                            }
                            else
                            {
                                connection.release;
                                winston.info(chalk.green("************* Balance Transferred To All professional ********************"));

                            }
                        });
                    }
                });

            }
        })
    })
};

exports.updateDues = function ()
{
    pool.getConnection(function (err, connection) {
    if (err)
    {
        console.log("failed to Connect with database");
    }
    else
    {
        var count = 0;
        var length = 0;
        // var currentLoginUsersId = 'Select * from users Where email = "' + req.user.email + '"';
        var currentDate = new Date();
        var oldDate = new Date(currentDate);
        oldDate.setHours(currentDate.getHours() - 24);
        oldDate.setMinutes(currentDate.getMinutes());
        var month = oldDate.getMonth() + 1;
        var time = oldDate.getFullYear() + '-' + month + '-' + oldDate.getDate() + " " + oldDate.getHours() + ":" + oldDate.getMinutes() + ":" + oldDate.getSeconds();
        var query = 'Select * From appointment_request where ( schedule_date <= "' + time + '" AND status = "complete" AND payment_status = 0 )';     //UPDATE PAYMENT STATUS IN DATABASE TOO
        connection.query(query,
          function (err, requests) {
          if (err)
          {
              console.log(" job report :Failed to query appointment_request ");
          }
          else if (!requests || requests.length === 0)
          {
                console.log(" Jobs Complete Stack Is Empty");
                // UpdateNoShowUsers();
          }
          else
          {
              length = requests.length;
              var iteration = function (requests, callbackDone) {
              var professionalId = requests.professional_id;
              var appointment_request_id = requests.appointment_request_id;
              console.log('requests',requests);
              console.log('appointment_request_id',appointment_request_id);
              var appointment_request_query = 'Select * From appointment_payment Where ( appointment_request_id = ' + appointment_request_id + ')';
              connection.query(appointment_request_query,
                  function (err, appointmentPayment) {
                    if (err)
                    {
                        console.log('Error in appointment_payment ', err);
                    }
                    else if(appointmentPayment!="")
                    {
                          // insert or update professional_dues table for user
                          var amount = appointmentPayment[0].payment_amount;
                          var SelectQuery = 'Select * from professional_dues  Where( professional_id = ' + professionalId + ' AND paid_status = 0 )';
                          connection.query(SelectQuery,
                            function (err, selectedProfessionalDue) {
                              if (err)
                              {
                                    console.log(" job report :Failed to query professional_dues ", err);
                              }
                              else if (!selectedProfessionalDue || selectedProfessionalDue.length === 0)
                              {
                                    console.log(" Entry for Professional  does not exist in Professional_dues , Creating registry in Professional_dues ");
                                    //var insertQuery = 'Insert Into professional_dues (professional_id, amount_due) Value ( ' + professionalId + ',' + amount + ')';
                                    var insertQuery = 'Insert Into professional_dues (professional_id, amount_due,appointment_request_id) Value ( ' + professionalId + ',' + amount + ','+ appointment_request_id +')';
                                    UpdateProfessionalDues(insertQuery, appointment_request_id)
                              }
                              else
                              {
                                    var totalAmount = selectedProfessionalDue[0].amount_due + amount;
                                    var professionalDueId = selectedProfessionalDue[0].id;
                                    var updateQuery = 'UPDATE professional_dues SET amount_due = ' + totalAmount + ' WHERE ( id = ' + professionalDueId + ')';
                                    UpdateProfessionalDues(updateQuery, appointment_request_id)
                              }

                              function UpdateProfessionalDues(query, appointment_request_id)
                              {
                                    connection.query(query,
                                      function (err, recordUpdated) {
                                      if (err)
                                      {
                                            console.log(" job report :there was an error updating values in professional_dues,Error Details:", err);
                                      }
                                      else
                                      {
                                            winston.info(chalk.green("Record updated in Professional_dues successfully "));
                                            var update_appointment_request = 'Update appointment_request Set  payment_status = 1 Where (appointment_request_id = ' + appointment_request_id + ')';
                                            connection.query(update_appointment_request,
                                              function (err, updatedAppointmentRequest) {
                                                if (err)
                                                {
                                                      console.log("job report :there was an error updating values in appointment_request,Error Details:", err)
                                                }
                                                else
                                                {
                                                      callbackDone();
                                                }
                                              });
                                      }
                                    });
                              }
                            });
                          }
                        })


                    };
                    async.eachSeries(requests, iteration, function (err, res) {
                        if (err)
                        {
                            console.log('Error Occurred while updateDues ', err)
                        }
                        else
                        {
                            // UpdateNoShowUsers();
                            return;
                        }
                    })
          }

                function UpdateNoShowUsers()
                {
                    // var currentLoginUsersId = 'Select * from users Where email = "' + req.user.email + '"';
                    var count = 0;
                    var length = 0;
                    var currentDate = new Date();
                    var oldDate = new Date(currentDate);
                    oldDate.setHours(currentDate.getHours());
                    oldDate.setMinutes(currentDate.getMinutes());
                    var month = oldDate.getMonth() + 1;
                    var time = oldDate.getFullYear() + '-' + month + '-' + oldDate.getDate() + " " + oldDate.getHours() + ":" + oldDate.getMinutes() + ":" + oldDate.getSeconds();
                    var query = 'Select * From appointment_request where ( schedule_date <= "' + time + '" AND status = "accept" AND payment_status = 0 )';     //UPDATE PAYMENT STATUS IN DATABASE TOO
                    connection.query(query,
                      function (err, requests) {
                        if (err)
                        {
                            console.log(err);
                            console.log(" job report :Failed to query appointment_request ");
                        }
                        else if (!requests || requests.length === 0)
                        {
                            console.log(" NOSHOW  Stack Is Empty");
                            return
                        }
                        else
                        {
                            length = requests.length;
                            var iteration = function (request, callbackDone) {
                            // length = requests.length;
                            // time query goes here
                            var scheduledDate = request.schedule_date;
                            var serviceId = request.service_id;
                            var professionalId = request.professional_id;
                            var appointment_request_id = request.appointment_request_id;
                            var findService = 'Select * from service where( id= ' + serviceId + ')';
                            // console.log(request);
                            console.log("FindService Query :", findService);
                            connection.query(findService,
                              function (err, serviceFound) {
                                if (err)
                                {
                                        console.log("There was an error querying services :", err)
                                }
                                else if (!serviceFound || serviceFound.length === 0)
                                {
                                        console.log('Service Detail not found');
                                }
                                else
                                {
                                        var serviceDuration = serviceFound[0].duration;
                                        scheduledDate.setMinutes(scheduledDate.getMinutes() + serviceDuration + 30);
                                        if (scheduledDate < currentDate)
                                        {
                                            var SelectQuery = 'Select * from professional_dues  Where( professional_id = ' + professionalId + ' AND paid_status = 0 )';
                                            console.log("SelectQuery Query :", SelectQuery);
                                            connection.query(SelectQuery,
                                              function (err, selectedProfessionalDue) {
                                                if (err)
                                                {
                                                    console.log(" job report :Failed to query professional_dues ", err);
                                                }
                                                else if (!selectedProfessionalDue || selectedProfessionalDue.length === 0)
                                                {
                                                    console.log(" job report : Professional  does not exist in Professional_dues , Creating registry in Professional_dues ");
                                                    //var insertQuery = 'Insert Into professional_dues (professional_id, penalty) Value ( ' + professionalId + ',' + 2000 + ')';
                                                    var insertQuery = 'Insert Into professional_dues (professional_id, penalty,appointment_request_id) Value ( ' + professionalId + ',' + 2000 + ','+appointment_request_id+')';
                                                    console.log("insertQuery Query :", insertQuery);
                                                    UpdateProfessionalDues(insertQuery, appointment_request_id)
                                                }
                                                else
                                                {
                                                    var totalPenalty = selectedProfessionalDue[0].penalty + 2000;
                                                    var professionalDueId = selectedProfessionalDue[0].id;
                                                    var updateQuery = 'UPDATE professional_dues SET penalty = ' + totalPenalty + ' WHERE ( id = ' + professionalDueId + ')';
                                                    UpdateProfessionalDues(updateQuery, appointment_request_id)
                                                }
                                                function UpdateProfessionalDues(query, appointment_request_id)
                                                {
                                                    connection.query(query,
                                                      function (err, recordUpdated) {
                                                        if (err)
                                                        {
                                                            console.log(" job report :there was an error updating values in professional_dues,Error Details:", err);
                                                        }
                                                        else
                                                        {
                                                            console.log("Record updated in Professional_dues successfully ");
                                                            var update_appointment_request = 'Update appointment_request Set  payment_status = 1 Where (appointment_request_id = ' + appointment_request_id + ')';
                                                            connection.query(update_appointment_request,
                                                              function (err, updatedAppointmentRequest) {
                                                                if (err)
                                                                {
                                                                    console.log("job report :there was an error updating values in appointment_request,Error Details:", err)
                                                                }
                                                                else
                                                                {
                                                                    console.log("updatedAppointmentRequest");
                                                                    count++;
                                                                    if (count === length)
                                                                    {
                                                                        console.log("updated Successfully")
                                                                    }
                                                                    callbackDone();
                                                                }
                                                            });
                                                          }
                                                    });
                                                }
                                            });
                                        }
                                        else
                                        {
                                            count++;
                                            if (count === requests.length)
                                            {
                                                callbackDone();
                                            }
                                        }
                                }
                                });

                            };
                            async.eachSeries(requests, iteration, function (err, res) {
                                if (err)
                                {
                                    console.log('Error occurred while UpdateNoShowUsers', err)
                                }
                                else
                                {
                                    winston.info(chalk.green(' ************************************ Update Dues Process Finished ***********************'));
                                    connection.release();
                                }
                            })
                        }
                    })
                }
            });

        }
    });
};

exports.updateTaskStatusToComplete = function ()
{
    pool.getConnection(function (err, connection) {
      if (err)
        {
            console.log('Connection Error',err);
            return;
        }
        else
        {
            var currentDate = new Date();
            var oldDate = new Date(currentDate);
            oldDate.setHours(currentDate.getHours());
            oldDate.setMinutes(currentDate.getMinutes());
            var month = oldDate.getMonth() + 1;
            var time = oldDate.getFullYear() + '-' + month + '-' + oldDate.getDate() + " " + oldDate.getHours() + ":" + oldDate.getMinutes() + ":" + oldDate.getSeconds();

            // find appointments where time is less then current time
            var query = 'Select * From appointment_request where ( schedule_date <= "' + time + '" AND status = "accept" AND payment_status = 0 )';     //UPDATE PAYMENT STATUS IN DATABASE TOO

            connection.query(query,
              function (err, appointments) {
                if (err)
                {
                    winston.info(chalk.red("Error :"), err);
                }
                else
                {
                    // get service time =
                    var iteration = function (appointment, done)
                    {
                        var scheduledTime = appointment.schedule_date;
                        var newTime = new Date();
                        var serviceId = appointment.service_id;
                        var serviceQuery = 'Select * from service WHERE (id  = ' + serviceId + ')';
                        connection.query(serviceQuery,
                          function (err, service) {
                            if (err)
                            {
                                winston.info('Error:', err);
                            }
                            else
                            {
                                newTime.setYear(scheduledTime.getFullYear());
                                newTime.setMonth(scheduledTime.getMonth());
                                newTime.setDate(scheduledTime.getDate());
                                newTime.setHours(scheduledTime.getHours());
                                newTime.setMinutes(scheduledTime.getMinutes() + service[0].duration + 30);
                                newTime.setSeconds(scheduledTime.getSeconds());
                                if (newTime <= currentDate)
                                {
                                    //update status to complete
                                    var update_appointment_request = 'Update appointment_request Set  status = "complete" Where (appointment_request_id = ' + appointment.appointment_request_id + ')';
                                    connection.query(update_appointment_request,
                                      function (err, updated) {
                                        if (err)
                                        {
                                            winston.info(chalk.red('Error'), err)
                                        }
                                        winston.info(chalk.green('ROW Updated'))
                                    });
                                    done();
                                }
                                else
                                {
                                    done();
                                }
                            }
                        });
                    };

                    async.eachSeries(appointments, iteration, function (err, result) {
                        if (err)
                        {
                            winston.info(chalk.red('Error'),err);
                        }
                        else
                        {
                            winston.info(chalk.green(' ************************************ Timer Checkup Finished*** ***********************'));
                            connection.release();
                            return
                        }
                    })
                }
            });
        }
    })
};
