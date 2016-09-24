	
	var app = angular.module('OtpApp', []);
	app.controller('Otpcontroller', function($scope, $window, $http) {
		
    $scope.Change_password = function() {
		
	   var params = {
            "otp":$scope.otpcode,
			"newpassword":$scope.newpassword
        }
	var postReq={
	method: "POST",
	url: "http://callvabo.com/user/resetPassword",
	 data: angular.toJson(params),
	headers: {
	//'Content-Type': 'application/json'
	'Content-Type': 'application/json; charset=utf-8'
	}
	};
	var onSuccess = function (data, status, headers, config) {
	if(data.status=="Success")
	{
		console.log('OTP send',data);
		
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
	

	
	
	