/**
 * Controls the REST queries and emits the result by event.
 * 
 * @author Zsolt Lengyel
 */
app.controller('QueryCtrl', [ '$element', '$scope', '$http', function($element, $scope, $http) {

    // for cross domain requests
    delete $http.defaults.headers.common['X-Requested-With'];

    // HTTP methods
    $scope.methods = ['GET','POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

    // Defaults
    $scope.server = 'http://index.hu';
    $scope.path = '/';
    $scope.method = 'GET';
    $scope.headers = [{}];
    
    $scope.hasResult = false;

    /**
     * Sends the query.
     */
    $scope.send = function() {
     
        var request = new XMLHttpRequest({mozSystem : true});
        var url = $scope.server + $scope.path;
        request.open($scope.method, url, true);
        
        angular.forEach(this.headers, function(header){            
             var name = header.name;
             
             if(name){
                 var value = header.value || '';             
                 request.setRequestHeader(name, value);
             }
         });
        
        
        request.onreadystatechange = function() {
            if(this.readyState != 4) return; // wait for full response
            
            $scope.statusCode = this.status;
            $scope.queryResult = this.responseText;
            
            $scope.hasResult = true;
            $scope.$apply();
        };
    
        request.send();
          
    };
    
    $scope.addHeader = function(){
      
       var hasEmptyHeader = false;
       angular.forEach(this.headers, function(header){
           if(!header.name) hasEmptyHeader = true;
           
           return false;
       });
       
       if(!hasEmptyHeader){
           this.headers.push({});
       }        
    };
    
    $scope.makeEmpty = function(index){
      
        this.headers[index] = {};
    };
    
    $scope.removeHeader = function(index){
        if(this.headers.length == 1) return;
        
        this.headers.splice(index, 1);
    };

    // View controls
    // ---------------------------------------------------------
    // TODO do with ng-view
    var btnSettings = document.querySelector("#settings-btn");
    var viewSettings = document.querySelector("#settings-view");
    btnSettings.addEventListener('click', function() {
        viewSettings.classList.remove('move-down');
        viewSettings.classList.add('move-up');
    });

} ]);

/**
 * Settings page conrtoller. - language settings
 */
app.controller('SettingsCtrl', [ '$element', '$scope', '$translate', 'supportedLanguages',
        function($element, $scope, $translate, supportedLanguages) {

            $scope.supportedLanguages = supportedLanguages;
            $scope.language = $translate.uses()  || 'en';

            /** Language change handler */
            $scope.changeLanguage = function() {
                $translate.uses(this.language);
            };

            // View controls
            // ---------------------------------------------------------
            var view = $element[0];

            $scope.closeSettings = function() {
                view.classList.remove('move-up');
                view.classList.add('move-down');
            };

        } ]);