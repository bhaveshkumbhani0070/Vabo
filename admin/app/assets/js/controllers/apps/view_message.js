app.controller('View_MessaageController', ['$scope', '$window', '$aside','$http', 'PlaceholderTextService', 
  function($scope, $window, $aside,$http, PlaceholderTextService){
 var token = $window.sessionStorage.getItem("token");
    var params = {
            "token":token
        }
        var postReq={
            method: "POST",
            url: "http://callvabo.com/api/appointment/viewMessage",
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
					  
					    var id=data.helpquetion[0].id;
						var help_question=data.helpquetion[0].help_question;
						var help_answer=data.helpquetion[0].help_answer;
						var help_isProfessional=data.helpquetion[0].help_isProfessional;
						
						
						
						$scope.id=id;
						$scope.help_question=help_question;
						$scope.help_answer=help_answer;
					    $scope.help_isProfessional=help_isProfessional;
						
					
						 // settings
						  $scope.settings = {
                        singular: 'Item',
                        plural: 'Items',
                        cmd: 'Add'
                      };
                    totaldata = data.helpquetion.length
					console.log('totaldata',totaldata);
					
					
					$scope.total_helpquetion=totaldata;
                      // adding demo data
                       var userData = [];
                        for (var i = 0; i<totaldata; i++)
						{
                            userData.push({
													 
															  id:data.helpquetion[i].id,
															  help_question:data.helpquetion[i].help_question,
															  help_answer:data.helpquetion[i].help_answer,
															  help_isProfessional:data.helpquetion[i].help_isProfessional,
															 
																   
                               
                            });
                       
						}
                      $scope.data = userData;

                      // defining template
                      var formTpl = $aside({
                        scope: $scope,
                        templateUrl: 'assets/tpl/apps/HelpQuestions-form.html',
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
