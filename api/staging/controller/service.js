var config = require('../config/config'); //For App configuration
var bcrypt = require('bcrypt-nodejs');    //For encryption
var jwt = require("jsonwebtoken");
var fs = require("fs");
var busboy = require('connect-busboy');
var email = require('email-validation');
var logger = require('./log');
var URL = require('../../app.js');
var Tokens = require('./getFCMtokens.js');

//CONFIGURATION FOR CREATING POOL
var constants = require('../constants/constants.json');
var pool = require('../config/db');
var Errors = require('../constants/functions.js');
//FOR Testing purpose

exports.create=function(req, res)
{
    console.log("*** Staging Requested for Creating New Service... ***");
    logger.info('*** Staging Requested for Creating New Service... ***');


 receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        console.log("*** Validating User Details... ");
        usercolumns = ["name","description","price","duration","gender",'service_category_id'];
        var dbValues = [];
        for(var iter=0;iter<usercolumns.length;iter++)
        {
            columnName=usercolumns[iter];
            console.log("columnName",columnName);
            var data=receivedValues[columnName];
            if(data = undefined && (columnName=='name'))
            {
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                logger.error('*** Redirecting: ',columnName,' field is required');
                return;
            }
            else if(receivedValues[columnName] == undefined || receivedValues[columnName] == "")
            {
                receivedValues[columnName]=receivedValues[columnName];
            }
            else if(data !== undefined || data !== "")
            {
                if(columnName=="name")
                {
                    var notvalidname = req.checkBody('name','name does not appear to be valid').notEmpty();
                    if(notvalidname=false)
                    {
                        console.log("*** Redirecting : Name does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"Name does not appear valid"});
                        return;
                    }
                }
                else if(columnName=="price")
                {
                    var notvalidprice = req.checkBody('price','price does not appear to be valid').notEmpty();
                    if(notvalidprice=false)
                    {
                        console.log("*** Redirecting : price does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"price does not appear valid"});
                        return;
                    }
                }
                else if(columnName=="duration")
                {
                    var notvalidduration = req.checkBody('duration','duration does not appear to be valid').notEmpty();
                    if(notvalidduration=false)
                    {
                        console.log("*** Redirecting : duration does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"duration does not appear valid"});
                        return;
                    }
                }
                else if(columnName=="gender")
                {
                    var notvalidgender = req.checkBody('gender','price does not appear to be valid').notEmpty();
                    if(notvalidgender=false)
                    {
                        console.log("*** Redirecting : gender does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"gender does not appear valid"});
                        return;
                    }
                }
            }
            dbValues[iter] = receivedValues[columnName];
        }

        //CREATING POOL CONNECTION
        pool.getConnection(function(err,connection){
            if(err)
            {
                Errors.Connection_Error(res);
            }
            else
            {

                var tableName="service";
                connection.query('INSERT INTO ?? (??) VALUES (?)',[tableName,usercolumns,dbValues],
                    function(err,rows){
                        if(err)
                        {
                            console.log('*** Redirecting: Error Creating Service...',err);
                            res.json({"code" : 200, "status" : "Error", "message" : "Error in connection database"});
                            logger.error('URL=',URL.url, 'Responce=','*** Redirecting: Error Creating Service...');
                            return;
                        }
                        else
                        {
                            console.log('New Service Created');
                            res.json({"status" : "OK", "message" : "New Service Created","serviceData":rows.insertId});
                            logger.info('URL=',URL.url,'Responce=','New Service Created');
                            return;
                        }
                    });
                      connection.release();
            }
        });
    }
}


exports.SelectId=function(req, res)
{
    console.log("*** Staging Requested for Selecting Service ***");
    logger.info('*** Staging Requested for Selecting Service ***');
    pool.getConnection(function(err,connection){
        if(err)
        {
            Errors.Connection_Error(res);
        }
        else
        {
            var email=req.user.email;
            connection.query('select * from users where email =?',[email],
                function(err,rows){
                    if(err)
                    {
                        Errors.SelectUserError(res,err);
                    }
                    else
                    {
                        connection.query('select service.id as id,service.name as name,service.description as description,service.price as price,service.duration as duration,service.gender as gender, service_category.id as category_id,service_category.name as category_name from service , service_category  where service.id=?',[rows[0].id],
                            function(err,servicedata){
                                if(err)
                                {
                                    console.log('*** Redirecting: can not select data from ',err);
                                    res.json({"code" : 200,"status" : "Error","message" : 'Error for selecting data from table'});
                                    logger.error('URL=',URL.url, 'Responce=','*** Redirecting: can not select data from ','Email=',email);
                                    return;
                                }
                                else
                                {
                                    if(servicedata=[])
                                    {
                                        console.log('there is no service ');
                                        res.json({'code':200,'message':'There is no service for current user'});
                                        logger.info('URL=',URL.url, 'Responce=','there is no service ','Email=',email);
                                        return;
                                    }
                                    else
                                    {
                                        console.log('Service data found',servicedata);
                                        res.json({'code':200,"status" : "Success","message" : "Service data Found",'ServiceData':servicedata});
                                        logger.info('URL=',URL.url,'Responce=','Service data found ','Email=',email);
                                        return;
                                    }
                                }
                            });
                    }
                });
                connection.release();
        }
    });
}


//For Select all Service
exports.services=function(req, res)
{
    console.log("*** Staging Requested for Listing Service ***");
    logger.info('*** Staging Requested for Listing Service ***');
    pool.getConnection(function(err,connection){
        if(err)
        {
            Errors.Connection_Error(res);
        }
        else
        {
            var tableName="service";
            var selectquery="select service.id as id,service.name as name,service.description ,service.price as price,service.duration as duration,service.gender as gender, service_category.id as category_id,service_category.name as category_name from service , service_category  where service_category.id = service.service_category_id";
            connection.query(selectquery,
                function(err,rows){

                    if(err)
                    {
                        console.log('*** Redirecting: can not select data ',err	);
                        res.json({"code" : 200,"status" : "Error","message" : 'can not select data from '+tableName +' of selected id=' +id});
                        logger.error('URL=',URL.url, 'Responce=','can not select data');
                        return;
                    }
                    else
                    {
                        console.log('All Service Data',rows);
                        res.json({"status" : "Success",	"message" : "All Service Data",'ServiceData':rows});
                        logger.info('URL=',URL.url,'Responce=','All Service Data');
                        return;
                    }
                });
                connection.release();
        }
    });
}

//Edit Service Data

exports.edit=function(req, res)
{
    console.log("*** Staging Requesting for Editing Service ***");
    logger.info('*** Staging Requesting for Editing Service ***');
    receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        console.log("*** Validating Services Details... ");
        usercolumns = ["name","description","price","duration","gender"];
        var dbValues = [];
        var updateString="";
        for(var iter=0;iter<usercolumns.length;iter++)
        {
            columnName=usercolumns[iter];
            var data=receivedValues[columnName];

            if(data = undefined && (columnName=='name'))
            {
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                return;
            }
            else if(data == undefined || data == "")
            {
                receivedValues[columnName]=receivedValues[columnName];
            }
            else if(data !== undefined || data !== "")
            {
                if(columnName=="name")
                {
                    var notvalidname = req.checkBody('name','name does not appear to be valid').notEmpty();
                    if(notvalidname=false)
                    {
                        console.log("*** Redirecting : name does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"name does not appear valid"});
                        return;
                    }
                }
                else if(columnName=="price")
                {
                    var notvalidprice = req.checkBody('price','price does not appear to be valid').notEmpty();
                    if(notvalidprice=false)
                    {
                        console.log("*** Redirecting : price does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"price does not appear valid"});
                        return;
                    }
                }
                else if(columnName=="duration")
                {
                    var notvalidduration = req.checkBody('duration','duration does not appear to be valid').notEmpty();
                    if(notvalidduration=false)
                    {
                        console.log("*** Redirecting : duration does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"duration does not appear valid"});
                        return;
                    }
                }
                else if(columnName=="gender")
                {
                    var notvalidgender = req.checkBody('gender','price does not appear to be valid').notEmpty();
                    if(notvalidgender=false)
                    {
                        console.log("*** Redirecting : gender does not appear valid  ***");
                        res.json({"code":200,"status":"Error","message":"gender does not appear valid"});
                        return;
                    }
                }
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

        //CREATING POOL CONNECTION
        pool.getConnection(function(err,connection){
            if(err)
            {
                Errors.Connection_Error(res);
            }
            else
            {

                var tableName="service";
                var id=req.body.id;

                selectQuery="SELECT count( id ) as count FROM ?? WHERE id = ?";
                connection.query(selectQuery,[tableName,[req.body.id]],
                    function(err,rows){
                        if(!err)
                        {
                            if(rows[0].count==1)
                            {
                                console.log('Update string',updateString);
                                updateQuery = "UPDATE ?? set "+updateString+"where id="+id;
                                connection.query(updateQuery,[tableName],
                                    function(err,rows){
                                        if(err)
                                        {
                                            console.log('*** Redirecting: Error Creating Service...',err);
                                            res.json({"code" : 500, "status" : "Error", "message" : "Error in connection database"});
                                            logger.error('URL=',URL.url, 'Responce=','Error Creating Service...');
                                            return;
                                        }
                                        else
                                        {
                                            console.log("Service Data updated");
                                            console.log("New Data",updateString);
                                            res.json({"code":200,"status" : "Success", "message" : "Service data updated",'serviceData':updateString});
                                            logger.info('URL=',URL.url,'Responce=','Service Data updated');
                                            return;
                                        }
                                    });
                            }
                        }
                        else
                        {
                            console.log('*** Redirecting: Username not registered');
                            res.json({"code" : 200, "status" : "Error","message" : "Username not registered"});
                            logger.error('URL=',URL.url, 'Responce=','Username not registered');
                            return;
                        }
                    });
                      connection.release();
            }
        });
    }
}


//Service api Delete
exports.deleteServices = function(req,res)
{
    console.log("*** Staging Requesting for Deleting Service ***");
    logger.info('*** Staging Requesting for Deleting Service ***');

    receivedValues=req.body

    if(JSON.stringify(receivedValues)=== '{}')
    {
        Errors.EmptyBody(res);
    }
    else
    {
        var data=req.body ;
        console.log("*** Received Data!");
        var value;
        if(data.id !== undefined && data.id !== 0)
        {
            deleteQuery = "DELETE FROM ?? WHERE id = ?";
            value = data.id;
        }
        else
        {
            console.log("*** Redirecting: No appropriate data available for Deleting Service!")
            res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Deleting Service"});
            logger.error('URL=',URL.url, 'Responce=','No appropriate data available for Deleting Service!');
            return;
        }

        pool.getConnection(function(err,connection){
            if(err)
            {
                Errors.Connection_Error(res);
            }
            else
            {
                var tableName="service";
                connection.query(deleteQuery,[tableName,value],
                  function(err,rows){

                    if(err)
                    {
                        console.log("can not delete service ",err);
                        res.json({'code':200,'status':'Error','message':'can not delete service'});
                        logger.error('URL=',URL.url, 'Responce=','can not delete service ');
                        return;
                    }
                    else
                    {
                        console.log("Service Deleted Successfully..");
                        res.json({'code':200,'status':'Error','message':'Service Deleted Successfully..'});
                        logger.info('URL=',URL.url,'Responce=','Service Deleted Successfully..');
                        return;
                    }
                });
                connection.release();
            }
        });

    }
}
