app.controller('appointment1', ['$scope', '$window', '$aside','$http', 'PlaceholderTextService', 
  function($scope, $window, $aside,$http, PlaceholderTextService){
 var token = $window.sessionStorage.getItem("token");
    var params = {
            "token":token
        }
        var postReq={
            method: "POST",
            url: "http://callvabo.com/api/appointments",
            data: angular.toJson(params),
            headers: {
                //'Content-Type': 'application/json'
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        var onSuccess = function (data, status, headers, config) {
                if(data.status=="Success")
                {
					    var appointment_request_id=data.appointment[0].appointment_request_id;
						var schedule_date=data.appointment[0].schedule_date;
						var notes=data.appointment[0].notes;
						var rate_by_cust=data.appointment[0].rate_by_cust;
						var rate_by_prof=data.appointment[0].rate_by_prof;
						var status=data.appointment[0].status;
					    var payment_status=data.appointment[0].payment_status;
						
						
						
						$scope.appointment_request_id=appointment_request_id;
						$scope.schedule_date=schedule_date;
						$scope.notes=notes;
					    $scope.rate_by_cust=rate_by_cust;
						$scope.rate_by_prof=rate_by_prof;
						$scope.status=status;
					    $scope.payment_status=payment_status;
					
					
						 // settings
						  $scope.settings = {
                        singular: 'Item',
                        plural: 'Items',
                        cmd: 'Add'
                      };
                    totaldata = data.appointment.length
					console.log('totaldata',totaldata);
					$scope.totalappo = totaldata;
                      // adding demo data
                       var userData = [];
                        for (var i = 0; i<totaldata; i++)
						{
                            userData.push({
							appointment_request_id:data.appointment[i].appointment_request_id,
							schedule_date:data.appointment[i].schedule_date,
							notes:data.appointment[i].notes,
							rate_by_cust:data.appointment[i].rate_by_cust,
							rate_by_prof:data.appointment[i].rate_by_prof,
							status:data.appointment[i].status,
							payment_status:data.appointment[i].payment_status,
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
