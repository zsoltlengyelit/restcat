/**
 * Controls the REST queries and emits the result by event.
 * 
 * @author Zsolt Lengyel
 */
app.controller('QueryCtrl', ['$rootScope', '$element', '$scope', '$http' , 'httpRequestHeaderParser', 'requestHistoryStore', function($rootScope, $element, $scope, $http, httpRequestHeaderParser, requestHistoryStore) {

    // for cross domain requests
    delete $http.defaults.headers.common['X-Requested-With'];

    // HTTP methods
    $scope.methods = ['GET','POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];

    // Defaults
    $scope.serverPath = 'http://mozilla.org';    
    $scope.method = 'GET';
    $scope.headers = [{}];
    
    $scope.hasResult = false;

    /**
     * Sends the query.
     */
    $scope.send = function() {
     
        var request = new XMLHttpRequest({mozSystem : true});
        var url = $scope.serverPath;
        request.open($scope.method, url, true);
        
        angular.forEach(this.headers, function(header){            
             var name = header.name;
             
             if(name){
                 var value = header.value || '';             
                 request.setRequestHeader(name, value);
             }
         });
        
        
        request.onreadystatechange = function() {
            if(this.readyState == 2){
                $scope.responseHeaders = httpRequestHeaderParser(this.getAllResponseHeaders());
                return;
            }
            
            if(this.readyState != 4) return; // wait for full response
            
            $scope.statusCode = this.status;
            $scope.queryResult = this.responseText;
            $scope.fullResult = this;
            
            $scope.resultCodeType = $scope.getResultCodeType(this);
            $scope.hasResult = true;
            $scope.$apply(function(){
                
                //hljs.highlightBlock(document.getElementById('queryResultPanel'));
            });
            
            putRequestToHistory(this);
            
        };
    
        request.send();
          
    };
    
    // puts the specified XMLHttpRequest to history db
    function putRequestToHistory(req){
        
        requestHistoryStore.insert({
            date : new Date(),
            path : $scope.serverPath,
            method : $scope.method,
            headers : $scope.headers
        });
        
        $rootScope.$emit('requestHistoryChanged');
        $rootScope.$apply();        
    }
    
    $scope.addHeader = function(){
      if(this.canAddHeader())
        this.headers.push({});
             
    };
    
    $scope.canAddHeader = function(){
        var hasEmptyHeader = false;
        angular.forEach(this.headers, function(header){
            if(!header.name) hasEmptyHeader = true;
            
            return false;
        });
        
        return !hasEmptyHeader;
    };
    
    $scope.makeEmpty = function(index){
      
        this.headers[index] = {};
    };
    
    $scope.removeHeader = function(index){
        if(this.headers.length == 1) return;
        
        this.headers.splice(index, 1);
    };
    
    $scope.getResultCodeType = function(request){
        return "html";
    };
    
    // history load
    $rootScope.$on('historyItemLoad', function(event, item){
        $scope.serverPath = item.path;
        $scope.method = item.method;
        $scope.headers = item.headers;
        
    });

    // View controls
    // ---------------------------------------------------------
    var viewSettings = document.querySelector("#settings-view");
    $scope.showSettings = function(){
        viewSettings.classList.remove('move-down');
        viewSettings.classList.add('move-up');
    };
    
    var viewHistory = document.querySelector("#history-view");
    $scope.showHistory = function(){
        viewHistory.classList.remove('move-down');
        viewHistory.classList.add('move-up');
    };

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


app.controller('HistoryCtrl', ['$rootScope', '$scope', '$element', 'requestHistoryStore', '$translate', function($rootScope, $scope, $element, requestHistoryStore, $translate){
    
    $scope.items = [];
    
    $scope.init = function(){
        requestHistoryStore.getAll().then(function(historyItems){
           
            historyItems.sort(function(aItem, bItem){
                if(!aItem.date.getTime || !bItem.date.getTime) return 1;
                
                return bItem.date.getTime() - aItem.date.getTime();
            });
            
            $scope.items = historyItems;
        });
    };
    
    $scope.init();
    $rootScope.$on('requestHistoryChanged', function(){
       $scope.init(); 
    });
    
    $scope.openItem = function(item){
        $rootScope.$emit('historyItemLoad', item);
        $scope.closeHistory();
    };
    
    $scope.clearHistory = function(){
        if(confirm($translate('histroy_clear_confirm'))){
            requestHistoryStore.clear();
            $scope.items = [];
        }
    };
    
    // view control
    var view = $element[0];
    $scope.closeHistory = function() {
        view.classList.remove('move-up');
        view.classList.add('move-down');
    };
    
}]);