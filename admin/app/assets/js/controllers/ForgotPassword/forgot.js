	
	var app = angular.module('ForgotApp', ['jcs-autoValidate']);
	app.controller('forgotcontroller', function($scope, $window, $http) {
		
    $scope.Forgot_password = function() {
		
	   var params = {
            "email":$scope.email
        }
	var postReq={
	method: "POST",
	url: "http://callvabo.com/user/forgotPassword",
	 data: angular.toJson(params),
	headers: {
	//'Content-Type': 'application/json'
	'Content-Type': 'application/json; charset=utf-8'
	}
	};
	var onSuccess = function (data, status, headers, config) {
	if(data.status=="Success")
	{
		
		console.log('OTP send',data.message);
	//	$scope.message = data.message;
	   $window.location.href="../../../pages/otp.html";
	}
	else
	{
	console.log('Error',data);
	}
	};
	var onError = function (data, status, headers, config) {
	//$scope.myWelcome = data;
	console.log('Error',data);
	};
	$http(postReq).success(onSuccess).error(onError);
	}
	
	});
	

	
	
	