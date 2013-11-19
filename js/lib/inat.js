/**
 * Created by lzsolt on 2013.11.07..
 */

define(['jquery'], function($){

    var Inat = function(){
        this.dictionary = {};
        var localLang = localStorage.getItem('restcat.settings.lang');
        this.lang = localLang != "undefined" ? localLang : 'en';
        localStorage.setItem('restcat.settings.lang', this.lang);
        this.dictionariesPath = 'js/inat';

    };

    Inat.prototype = {

        start : function(){
            var self = this;

            this.loadDictionary(function(){
               self.translatePage();
            });
        },

        translatePage : function(){
            var self = this;

            $('[inat]').each(function(){
               $elem = $(this);
               var text = $elem.attr('inat-base') ? $elem.attr('inat-base') : $elem.text();
               var data = $elem.attr('inat-data');
               var translated = self.translate(text, data);
               $elem.text(translated);

               $elem.attr('inat-base', text);
            });
        },

        translate : function(text, data){
            if(this.dictionary[text]){
                // TODO
                return this.dictionary[text];
            }
            return text;
        },

        changeLang : function(lang, cb){
            var self = this;

            if(lang == 'undefined'){
                return;
            }

            this.lang = lang;
            localStorage.setItem('restcat.settings.lang', this.lang);
            this.loadDictionary(function(lang, data){
                self.translatePage();
                if(cb) cb(lang, data);
            });
        },

        loadDictionary : function(cb){
            var self = this;
            var dictPath = this.dictionariesPath + '/' + this.lang + '.json';

            $.ajax({
                type : 'GET',
                url : dictPath,
                success : function(data){
                    self.dictionary = data;
                    if(cb) cb(self.lang, data);
                },
                error : function(xhr){
                    var data = JSON.parse(xhr.responseText.trim('"'));
                    self.dictionary = data;
                    if(cb) cb(self.lang, data);
                }
            });
        }
    };

    return new Inat();
});
