/** Instantiate the angular module for REST Cat */
var app = angular.module('restcat', ['ngCookies', 'pascalprecht.translate' ]);

app.config(function($compileProvider, $translateProvider) {

    //$compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|app):/); // ng 1.1
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|app):/); // ng 1.1+

    $translateProvider.useLoader('translationLoader', {});

    $translateProvider.preferredLanguage('en');    
    $translateProvider.useLocalStorage();
});

app.factory('translationLoader', function ($http, $q) {
    return function (options) {
      var deferred = $q.defer();
      
      $http({
        method:'GET',
        url:'translations/' + options.key + '.json'
      }).success(function (data) {
        deferred.resolve(data);
      }).error(function () {
        deferred.reject(options.key);
      });
      
      return deferred.promise;
    };
});

app.value('supportedLanguages', {
   'en' : 'english',
   'hu' : 'magyar'
});
//
//app.run(['$rootScope', function($rootScope) {
//
//    // is the device capable of installing this app?
//    $rootScope.hasMozApps = !!navigator.mozApps;
//
//    // if we do, check if we're already installed
//    if ('mozApps' in navigator) {
//      var checkIfInstalled = navigator.mozApps.getSelf();
//      checkIfInstalled.onsuccess = function() {
//        $rootScope.isInstalled = !!checkIfInstalled.result;
//        $rootScope.$apply();
//      };
//    }
//
//    // this is installation logic
//    $rootScope.install = function() {
//      var host = location.href.substring(0, location.href.lastIndexOf('/'));
//      var manifestURL = host + '/manifest.webapp';
//      // you point mozApps.install to a manifest file
//      var installApp = navigator.mozApps.install(manifestURL);
//      installApp.onsuccess = function() {
//        $rootScope.isInstalled = true;
//        $rootScope.$apply();
//      };
//      installApp.onerror = function() {
//        alert('Install failed\n\n:' + installApp.error.name);
//      };
//    };
//
//  }]);

