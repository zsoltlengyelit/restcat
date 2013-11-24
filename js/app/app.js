/** Instantiate the angular module for REST Cat */
var app = angular.module('restcat', [ 'ngCookies', 'pascalprecht.translate', 'xc.indexedDB' ]);

app.config(function($compileProvider, $translateProvider, $indexedDBProvider) {

    // $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|app):/);   // ng 1.1
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|app):/); // ng 1.1+
    $translateProvider.useLoader('translationLoader', {});

    $translateProvider.preferredLanguage('en');
    $translateProvider.useLocalStorage();
    
    $indexedDBProvider
    .connection('RestCATIndexedDB')
    .upgradeDatabase(1, function(event, db, tx){
        
      var objStore = db.createObjectStore('history', {keyPath: 'date'});
      objStore.createIndex('path_idx', 'path', {unique: false});
      
    });
});



app.value('supportedLanguages', {
    'en' : 'english',
    'hu' : 'magyar'
});

// TODO map response headers to highligth.js code class
//app.value('httpHeadersHljs', {
//
//});

app.run(function() {

});


//
// app.run(['$rootScope', function($rootScope) {
//
// // is the device capable of installing this app?
// $rootScope.hasMozApps = !!navigator.mozApps;
//
// // if we do, check if we're already installed
// if ('mozApps' in navigator) {
// var checkIfInstalled = navigator.mozApps.getSelf();
// checkIfInstalled.onsuccess = function() {
// $rootScope.isInstalled = !!checkIfInstalled.result;
// $rootScope.$apply();
// };
// }
//
// // this is installation logic
// $rootScope.install = function() {
// var host = location.href.substring(0, location.href.lastIndexOf('/'));
// var manifestURL = host + '/manifest.webapp';
// // you point mozApps.install to a manifest file
// var installApp = navigator.mozApps.install(manifestURL);
// installApp.onsuccess = function() {
// $rootScope.isInstalled = true;
// $rootScope.$apply();
// };
// installApp.onerror = function() {
// alert('Install failed\n\n:' + installApp.error.name);
// };
// };
//
// }]);

