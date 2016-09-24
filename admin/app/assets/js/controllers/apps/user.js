app.controller('UserController', ['$scope', '$window', '$aside','$http', 'PlaceholderTextService',
  function($scope, $window, $aside,$http, PlaceholderTextService){

    var token = $window.sessionStorage.getItem("token");

    var params = {
            "token" : token
        }
        var postReq={
            method: "POST",
            url: "http://callvabo.com/api/userdetail",
            data: angular.toJson(params),
            headers: {
                //'Content-Type': 'application/json'
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        var onSuccess = function (data, status, headers, config) {
                if(data.status=="Success")
                {


                    var firstname=data.data[0].firstname;
                    var lastname=data.data[0].lastname;
                    var email=data.data[0].email;
                    var dob=data.data[0].dob;
                    var gender=data.data[0].gender;
                    var phone=data.data[0].phone;
                    var city=data.data[0].city;
                    var address=data.data[0].address;
                    var zip=data.data[0].zip;

                    $scope.firstname=firstname;
                    $scope.lastname=lastname;
                    $scope.email=email;
                    $scope.dob=dob;
                    $scope.gender=gender;
                    $scope.phone=phone;
                    $scope.city=city;
                    $scope.address=address;
                    $scope.zip=zip;
					

                      // settings
                      $scope.settings = {
                        singular: 'Item',
                        plural: 'Items',
                        cmd: 'Add'
                      };

                      // adding demo data
                       var userdata = [];

                            userdata.push({
                              firstname: firstname,
                              lastname: lastname,
                              email:email,
                              dob:dob,
                              gender:gender,
                              phone:phone,
                              city:city,
                              address:address,
                              zip:zip
                            });


                      $scope.data = userdata;

                      // defining template
                      var formTpl = $aside({
                        scope: $scope,
                        templateUrl: 'assets/tpl/apps/user-form.html',
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



                      $scope.saveItem = function(){
                        //$http.defaults.headers.common['token'] = token;
                        var postReq={
                            method: "POST",
                            url: "http://callvabo.com/api/user/edit",
                            data: angular.toJson(userdata),
                            headers: {
                              'Content-Type': 'application/json; charset=utf-8'
                            }
                        };

                        var onSuccess = function (data, status, headers, config) {
                                if(data.status=="Success")
                                {
                                    console.log('Edit Success',data);
                                    hideForm();
                                }
                                else
                                {
                                    console.log("Error",data);
                                }
                        };

                        var onError=function(data,status,headers,config){
                           console.log('Error for editing data',data);
                        };
                         $http(postReq).success(onSuccess).error(onError);



                      };

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
                    console.log('Error',data);
                }
            };
        var onError = function (data, status, headers, config) {
                //$scope.myWelcome = data;
                console.log('Error',data);
            };


         $http(postReq).success(onSuccess).error(onError);




}]);
