app.controller('customerController', ['$scope', '$window', '$aside','$http', 'PlaceholderTextService', 
  function($scope, $window, $aside,$http, PlaceholderTextService){
 var token = $window.sessionStorage.getItem("token");
    var params = {
            "token":token
        }
        var postReq={
            method: "POST",
            url: "http://callvabo.com/api/user/CustomerDetails",
            data: angular.toJson(params),
            headers: {
                //'Content-Type': 'application/json'
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        var onSuccess = function (data, status, headers, config) {
                if(data.status=="Success")
                {					  
					    var id=data.userData[0].id;
						var firstname=data.userData[0].firstname;
						var lastname=data.userData[0].lastname;
						var phone=data.userData[0].phone;
					    var email=data.userData[0].email;
						var city=data.userData[0].city;
						$scope.id=id;
						$scope.firstname=firstname;
						$scope.lastname=lastname;
						$scope.phone=phone;
					    $scope.email=email;
						$scope.city=city;
					   $scope.settings = {
                        singular: 'Item',
                        plural: 'Items',
                        cmd: 'Add'
                      };
                    totaldata = data.userData.length
					console.log('totaldata',totaldata);
					$scope.totalcustomer=totaldata;
                      // adding demo data
                       var userData = [];
                        for (var i = 0; i<totaldata; i++)
						{
                            userData.push({
							id:data.userData[i].id,
							firstname:data.userData[i].firstname,
							lastname:data.userData[i].lastname,
							phone:data.userData[i].phone,
							email:data.userData[i].email,
							city:data.userData[i].city,												  						 
							});
						}
                      $scope.data = userData;
                }
                else
                {
                    console.log('Error',data.Message);
                }
            };
        var onError = function (data, status, headers, config) {
                //$scope.myWelcome = data;
                console.log('Error',data.message);
            };


         $http(postReq).success(onSuccess).error(onError);
            
   
      

}]);
