var myModule = angular.module('materialism', []);
 
     myModule.controller("MainController",function($scope,$window,$http,$location){
		 
		 $scope.login = function(){
		 
		 var params = {
			 
			 "token":$scope.token
		     };
			 
	   	 var postReq ={
			
			 method:"POST",
			 url:"http://callvabo.com/user/signin",
			 data:angular.toJson(params),
			 headers:{'Content-Type':'application/json;charset=utf-8'}
		             } ;
		 var onSuccess = function(data,status,headers,config)
         {
			
				  var token=data.token;
				  
				 console.log('userdetails',data);
				  
				 console.log('username',data.userData[0].firstname);
				 console.log('email',data.userData[0].email);
				//$window.location.href="http://localhost:9000/index.dev.html#/"
				$scope.username=data.data[0].firstname;
		 }	;
		 
		  var onError = function(data,status,headers,config)
		  {
			  console.log("Error",data);
		  };
		   $http(postReq).success(onSuccess).error(onError);
		 };
	 });