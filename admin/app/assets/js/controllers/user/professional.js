app.controller('proff', ['$scope', '$window', '$aside','$http', 'PlaceholderTextService', 
  function($scope, $window, $aside,$http, PlaceholderTextService){
 var token = $window.sessionStorage.getItem("token");
    var params = {
            "token":token
        }
        var postReq={
            method: "POST",
            url: "http://callvabo.com/api/user/ProfessionalDetails",
            data: angular.toJson(params),
            headers: {
                //'Content-Type': 'application/json'
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        var onSuccess = function (data, status, headers, config) {
                if(data.status=="Success")
                {
					//var data=data.ServiceData[0];
					//$scope.data = ServiceData[0].records;

					//totaldata=data.ServiceData.length
					  
					    var id=data.userData[0].id;
						var firstname=data.userData[0].firstname;
						var lastname=data.userData[0].lastname;
						//var dob=data.userData[0].dob;
						//var gender=data.userData[0].gender;
						var phone=data.userData[0].phone;
					    var email=data.userData[0].email;
						//var is_social=data.userData[0].is_social;
						//var is_professional=data.userData[0].is_professional;
						var city=data.userData[0].city;
						/*var country=data.userData[0].country;
						var address=data.userData[0].address;
						var zip=data.userData[0].zip;
						var img_path=data.userData[0].img_path;
						var Q1=data.userData[0].Q1;
						var Q2=data.userData[0].Q2;
						var Q3=data.userData[0].Q3;
						var Q4=data.userData[0].Q4;
						var Q5=data.userData[0].Q5;
						var Q6=data.userData[0].Q6;
						var is_available=data.userData[0].is_available;
						var province=data.userData[0].province;*/
						
						
						$scope.id=id;
						$scope.firstname=firstname;
						$scope.lastname=lastname;
					  //  $scope.dob=dob;
						//$scope.gender=gender;
						$scope.phone=phone;
					    $scope.email=email;
						//$scope.is_social=is_social;
					   // $scope.is_professional=is_professional;
						$scope.city=city;
						/*$scope.country=country;
						$scope.address=address;
						$scope.zip=zip;
					    $scope.img_path=img_path;
					    $scope.Q1=Q1;
					    $scope.Q2=Q2;
					    $scope.Q3=Q3;
						$scope.Q4=Q4;
						$scope.Q5=Q5;
						$scope.Q6=Q6;
						$scope.is_available=is_available;
					    $scope.province=province;*/
							  
					
						 // settings
						  $scope.settings = {
                        singular: 'Item',
                        plural: 'Items',
                        cmd: 'Add'
                      };
                    totaldata = data.userData.length
					console.log('totalprofessional',totaldata);
					$scope.totalprofessional = totaldata;
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
