
/**
 * Rest CAT AngularJS factories are located in this file.
 */

app.factory('translationLoader', function($http, $q) {
    return function(options) {
        var deferred = $q.defer();

        $http({
            method : 'GET',
            url : 'translations/' + options.key + '.json'
        }).success(function(data) {
            deferred.resolve(data);
        }).error(function() {
            deferred.reject(options.key);
        });

        return deferred.promise;
    };
});

app.factory('httpRequestHeaderParser', function() {

    /**
     * XmlHttpRequest's getAllResponseHeaders() method returns a string of
     * response headers according to the format described here:
     * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
     * This method parses that string into a user-friendly key/value pair
     * object.
     */
    function parseResponseHeaders(headerStr) {
        var headers = {};
        if (!headerStr) {
            return headers;
        }
        var headerPairs = headerStr.split('\u000d\u000a');
        for (var i = 0; i < headerPairs.length; i++) {
            var headerPair = headerPairs[i];
            // Can't use split() here because it does the wrong thing
            // if the header value has the string ": " in it.
            var index = headerPair.indexOf('\u003a\u0020');
            if (index > 0) {
                var key = headerPair.substring(0, index);
                var val = headerPair.substring(index + 2);
                headers[key] = val;
            }
        }
        return headers;
    }

    return parseResponseHeaders;
    
});

app.factory('requestHistoryStore', ['$indexedDB', function($indexedDB){
   
    const OBJECT_STORE_NAME = "history";
    
    return $indexedDB.objectStore(OBJECT_STORE_NAME);
}]);
