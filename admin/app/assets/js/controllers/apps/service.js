app.controller('serviceController', ['$scope', '$window', '$aside','$http', 'PlaceholderTextService', 
  function($scope, $window, $aside,$http, PlaceholderTextService){
	var token = $window.sessionStorage.getItem("token");
    var params = {
            "token":token
        }
        var postReq={
            method: "POST",
            url: "http://callvabo.com/api/service/services",
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
				
					
						
						
					
							  
							  
					    var id=data.ServiceData[0].id;
						var name=data.ServiceData[0].name;
						var description=data.ServiceData[0].description;
						var price=data.ServiceData[0].price;
						var duration=data.ServiceData[0].duration;
						var gender=data.ServiceData[0].gender;
						var category_id=data.ServiceData[0].category_id;
						var category_name=data.ServiceData[0].category_name;
						$scope.id=id;
						$scope.name=name;
						$scope.description=description;
						$scope.price=price;
						$scope.duration=duration;
						$scope.gender=gender;
						$scope.category_id=category_id;
					   $scope.category_name=category_name;
							  
					
						 // settings
						  $scope.settings = {
                        singular: 'Item',
                        plural: 'Items',
                        cmd: 'Add'
                      };
                    totaldata = data.ServiceData.length
					$scope.totalservice = totaldata;
					console.log('totaldata',totaldata);
                      // adding demo data
                       var ServiceData = [];
                        for (var i = 0; i<totaldata; i++)
						{
                            ServiceData.push({
											 
							  id:data.ServiceData[i].id,
							  name:data.ServiceData[i].name,
							  description:data.ServiceData[i].description,
								 price:data.ServiceData[i].price,
								 duration:data.ServiceData[i].duration,
								 gender:data.ServiceData[i].gender,
								
								category_name:data.ServiceData[i].category_name
                              
                               
                            });
                       
						}
                      $scope.data = ServiceData;

                      // defining template
                     var formTpl = $aside({
                        scope: $scope,
                        templateUrl: 'assets/tpl/apps/service-form.html',
                        show: false,
                        placement: 'left',
                        backdrop: false,
                        animation: 'am-slide-left'
                      });

                     

                      $scope.editItem = function(item){
                            item.editing = true;
                            $scope.item = item;
                            $scope.settings.cmd = 'Edit';
                            showForm();
                      };
						
						
						  $scope.createItem = function(){
							var item = 
							{
							  icon: PlaceholderTextService.createIcon(true),
							  editing: true
							};
							$scope.item = item;
							$scope.settings.cmd = 'New';
							showForm();
						  };

                      /*
					  $scope.saveItem = function(){
                        var params = {
                            "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXNzd29yZCI6InFxcXFxcXFxIiwiZW1haWwiOiJxQHEuY29tIiwiaWF0IjoxNDc0MzU4NTg2LCJleHAiOjE0NzY5NTA1ODZ9.wTmQvHb5vvpXCp8lliPbirwiLOfcGO52_sAmBMlvmQM"
                        }
                        var postReq={
                            method: "POST",
                            url: "http://callvabo.com/api/service/create",
                            data: $scope.data,
                            headers: {
                                //'Content-Type': 'application/json'
                                'Content-Type': 'application/json; charset=utf-8'
                            }
                        };
						
						
						 $http(postReq).success(onSuccess).error(onError);
                        hideForm();
                      };*/

                      showForm = function(){
                        angular.element('.tooltip').remove();
                        formTpl.show();
                      };

                      hideForm = function(){
                        formTpl.hide();
                      };

                      $scope.$on('$destroy', function() {
                        hideForm();
                      });

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
