	
	var app = angular.module('myApp', ['jcs-autoValidate']);
	app.controller('myCtrl', function($scope, $window, $http) {
	$scope.login = function() {
	var params = {
	"email": $scope.email,
	"password": $scope.password
	}
	var postReq={
	method: "POST",
	url: "http://callvabo.com/user/signin",
	data: angular.toJson(params),
	headers: {
	//'Content-Type': 'application/json'
	'Content-Type': 'application/json; charset=utf-8'
	}
	};
	var onSuccess = function (data, status, headers, config) {
	if(data.status=="Success")
	{
		var token=data.token;
		console.log('username',data);
		console.log('email',data.userData[0].email);
		$window.location.href="http://localhost:9000/index.dev.html#/"
		$window.sessionStorage.setItem("token",data.token);
	}
	else
	{
	console.log('Error',data.message);
	}
	};
	var onError = function (data, status, headers, config) {
	//$scope.myWelcome = data;
	console.log('Error',data);
	};
	$http(postReq).success(onSuccess).error(onError);
	}
	
		});
	

	
	
	