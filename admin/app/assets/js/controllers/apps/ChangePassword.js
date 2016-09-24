
	
	app.controller('ChangePassword', function($scope, $window, $http) {
	$scope.saveItem = function() {
		
		 var token = $window.sessionStorage.getItem("token");

    var params = {
            "token" : token,
			"oldpassword": $scope.oldpassword,
	        "newpassword": $scope.newpassword
        }
		
		
	//var params = {
	//"oldpassword": $scope.oldpassword,
	//"newpassword": $scope.newpassword
	//}
	var postReq={
	method: "POST",
	url: "http://callvabo.com/api/user/changePassword",
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
		console.log('changepasswordData',data);
		console.log('newpassword',data.changepasswordData[0].newpassword);
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
	

	
	
	