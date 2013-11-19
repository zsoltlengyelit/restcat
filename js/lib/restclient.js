/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

if (typeof (restclient) === "undefined") {

  var restclient = {
    init : function () {
      restclient.importModules();
    },
    importModules : function () {
      Components.utils.import("resource://restclient/modules/StringBundle.js", restclient);
      Components.utils.import("resource://restclient/modules/Preferences.js", restclient);

      Components.utils.import("resource://gre/modules/NetUtil.jsm", restclient);
      Components.utils.import("resource://gre/modules/FileUtils.jsm", restclient);
    },
    setPref : function (name, value) {
      return restclient.Preferences.set("extension.restclient." + name, value);
    },
    getPref : function (name, value) {
      return restclient.Preferences.get("extension.restclient." + name, value);
    },
    i18n : function (n, arg) {
        i18nStrings = new restclient.StringBundle("chrome://restclient/locale/restclient.properties");
      try {
        return i18nStrings.get(n, arg);
      } catch (e) {
        console.error(n);
        console.error(JSON.stringify(arg));
        console.error(e.message);
      }
    },
    convertStringToUTF8: function(aStr)
    {
      var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
          getService(Components.interfaces.nsIUTF8ConverterService);
    
      try {
        return utf8Converter.convertStringToUTF8 (aStr, "UTF-8"); //utf8Converter.convertStringToUTF8(aStr, "utf-8", false); 
      }
      catch(e) {
        console.error(e);
        return aStr;
      }
    },
    log: function(str) {
      try{
        console.log(str);
      }catch(e){}
    },
    error: function(o) {
      try{
        console.error(o);
      }catch(e){}
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////

/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.main = {
  headerLabelMaxLength: 35,
  headerMenuMaxLength: 25,
  uniqueHeaders: ['authorization'],
  navTop: null,
  hotkey: {
    send:     's',
    url:      'u',
    method:   'm',
    reqBody:  'b',
    rep1:     '1',
    rep2:     '2',
    rep3:     '3',
    rep4:     '4',
    toggleRequest: 'alt+q',
    toggleResponse: 'alt+s'
  },
  init: function () {
    restclient.init();
    this.initSkin();

    restclient.main.navTop = $('.subnav').length && $('.subnav').offset().top - $('.navbar').first().height();
    $(window).on('scroll', restclient.main.processScroll).scroll();

    $('.modal .btnClose').live('click', function () {
      $(this).parents('.modal').modal('hide');
      return false;
    });

    this.initHotKeys();
    this.initModal();
    this.initOAuthWindow();
    this.initRequestMethod();
    this.initRequestUrl();
    this.updateFavoriteHeadersMenu();
    this.updateFavoriteRequestMenu();


    $('#request-button').bind('click', restclient.main.sendRequest);
    $('#request-url').bind('keyup', restclient.main.requestUrlInputed).focus().select();
    $('#request-url').bind('change', restclient.main.updateFavoriteUrlIcon);

    if ($('#overrideMimeType').attr('checked') == 'checked')
      $('.overrideMimeType').show();

    $('[name="saved-request-name"]').bind('keyup', function () {
      if ($(this).val() == $('#modal-save-request .btnOkay').attr('request-name') ) {
        $('#modal-save-request .btnOkay').attr('overwrite', '1').val('Overwrite');
      }
      else
      {
        $('#modal-save-request .btnOkay').attr('overwrite', '0').val('Save');
      }
    });

    $('#window-manage-request .btnClose').bind('click', function () {
      $('#window-manage-request').hide();
    });

    $('input, textarea').focus(function () {
      $(this).select();
    });

    $('.favorite-icon').click(restclient.main.favoriteUrl);
    $('.toggle-request').click(restclient.main.toggleRequest);
    $('.toggle-response').click(restclient.main.toggleResponse);
    $('.toggle-page-layout').click(restclient.main.toggleLayout);
    $('.toggle-header-layout').click(restclient.main.toggleRequestHeaderLayout);
    $('.toggle-request-timer').click(restclient.main.toggleRequestTimer);
    $('#request-body').focus(function () {
      if ($(this).innerHeight() < 200 )
        $(this).css('height', '200px');
    }).blur(function () {
      if ($(this).innerHeight() > 60 )
        $(this).css('height', '60px');
    });

    $('#modal-oauth-view .btnAutoRefresh').bind('click', function () {
      var headerId = $('#modal-oauth-view').data('source-header-id');
      $('#modal-oauth-view .btnAutoRefresh').toggleClass('active');
      restclient.main.setOAuthAutoRefresh(headerId, $('#modal-oauth-view .btnAutoRefresh').hasClass('active'));
    });

    $('#modal-oauth-view .btnRefresh').bind('click', function () {
      var headerId = $('#modal-oauth-view').data('source-header-id');
      restclient.error('#modal-oauth-view .btnRefresh clicked:' + headerId);
      headerId = restclient.main.updateOAuthSign(headerId);
      restclient.error('#modal-oauth-view .btnRefresh refreshed:' + headerId);
      $('#modal-oauth-view').data('source-header-id', headerId);
      $('#modal-oauth-view textarea').val($('span[data-header-id="' + headerId + '"]').attr('header-value'));
    });
  },
  changeSkin: function (cssFileName) {
    $("link").remove();
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/" + cssFileName
    }).appendTo("head");

    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/restclient.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/XMLPrettyPrint.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/prettify.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/KelpJSONView.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/animate.css"
    }).appendTo("head");
  },
  initSkin: function () {
    var pageLayout = restclient.getPref('pageLayout', 'fixed'),
        requestHeaderLayout = restclient.getPref('requestHeaderLayout', 'tag'),
        requestTimer = restclient.getPref('requestTimer', false);
        
    if (pageLayout === 'percentage') {
      $('.container').addClass('container-fluid').removeClass('container');
      $('.toggle-page-layout').attr('data-layout', 'percentage');
      $('.toggle-page-layout').text('Switch to fixed page layout');
    }

    if (requestHeaderLayout === 'table') {
      $('#request-headers .tag').hide();
      $('#request-headers .table').show();
      $('.toggle-header-layout').attr('data-layout', 'table');
      $('.toggle-header-layout').text('List request headers in tag');
    }
    
    if (requestTimer === true) {
      $('.toggle-request-timer').attr('data-timer', 'enable');
      $('.toggle-request-timer').text('Disable request execution timer');
    }
    
    var defaultCSS = restclient.getPref('defaultSkin', 'bootstrap.simplex.css');
    restclient.main.changeSkin(defaultCSS);
    $('a[css]').click(function () {
      restclient.main.changeSkin($(this).attr('css'));
      restclient.setPref('defaultSkin', $(this).attr('css'));
    });
    //wait for css load
    setTimeout(function () { $('.showForStartup').show(); }, 200);
  },
  initHotKeys: function () {
    $('#request-button').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.send);
    $(document).bind('keydown', restclient.main.hotkey.send, function () {
      $('#request-button').click();
      return false;
    });

    $('#request-url').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.url);
    $(document).bind('keydown', restclient.main.hotkey.url, function () {
      $('#request-url').focus().select();
      return false;
    });

    $('.request-method-dropdown a.dropdown-toggle').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.method);
    $(document).bind('keydown', restclient.main.hotkey.method, function () {
      $('.request-method-dropdown a.dropdown-toggle').click();
      return false;
    });

    $('#request-body').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.reqBody);
    $(document).bind('keydown', restclient.main.hotkey.reqBody, function () {
      $('#request-body').focus().select();
      return false;
    });

    $('.nav-tabs li a').eq(0).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep1);
    $(document).bind('keydown', restclient.main.hotkey.rep1, function () {
      $('.nav-tabs li a').eq(0).click();
      return false;
    });

    $('.nav-tabs li a').eq(1).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep2);
    $(document).bind('keydown', restclient.main.hotkey.rep2, function () {
      $('.nav-tabs li a').eq(1).click();
      return false;
    });

    $('.nav-tabs li a').eq(2).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep3);
    $(document).bind('keydown', restclient.main.hotkey.rep3, function () {
        $('.nav-tabs li a').eq(2).click();
    });

    $('.nav-tabs li a').eq(3).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep4);
    $(document).bind('keydown', restclient.main.hotkey.rep4, function () {
        $('.nav-tabs li a').eq(3).click();
    });

    $(document).bind('keydown', restclient.main.hotkey.toggleRequest, function () {
      restclient.main.toggleRequest();
      return false;
    });
    $(document).bind('keydown', restclient.main.hotkey.toggleResponse, function () {
      restclient.main.toggleResponse();
      return false;
    });
  },
  toggleRequest: function (e) {
    var toggle = $('.toggle-request');
    $('#request-container').slideToggle('slow', function () {
        toggle.text(toggle.text() == '-' ? '+' : '-');
    });
    if (e) e.preventDefault();
    return false;
  },
  toggleResponse: function (e) {
    var toggle = $('.toggle-response');
    $('#response-container').slideToggle('slow', function () {
        toggle.text(toggle.text() == '-' ? '+' : '-');
    });
    if (e) e.preventDefault();
    return false;
  },
  toggleExpander: function (e) {
    var toggle = $(this),
        content = toggle.next().find('.expander-content').first();
    //restclient.log(toggle.text());
    //restclient.log(content);

    content.slideToggle('slow', function () {
      toggle.text(toggle.text() == '+' ? '-' : '+');
      /*  content.after($())
        if (!content.data('origin-data')) {
          content.data('origin-data', content.html());
          content.text('...').show();
        }
        else
        {
          content.html(content.data('origin-data'));
          content.data('origin-data', null);
        }*/
    });
    if (e) e.preventDefault();
    return false;
  },
  toggleLayout: function (e) {

    if ($(this).attr('data-layout') == 'fixed')
    {
      $('.container').addClass('container-fluid').removeClass('container');
      $(this).attr('data-layout', 'percentage');
      $(this).text('Switch to fixed page layout');
      restclient.setPref('pageLayout', 'percentage');
    }
    else
    {
      $('.container-fluid').removeClass('container-fluid').addClass('container');
      $(this).attr('data-layout', 'fixed');
      $(this).text('Switch to percentage page layout');
      restclient.setPref('pageLayout', 'fixed');
    }
  },
  toggleRequestHeaderLayout: function (e) {
    $('#request-headers').show();
    if ($(this).attr('data-layout') == 'tag')
    {
      $('#request-headers .tag').hide();
      $('#request-headers .table').show();
      $(this).attr('data-layout', 'table');
      $(this).text('List request headers in tags');
      restclient.setPref('requestHeaderLayout', 'table');
    }
    else
    {
      $('#request-headers .tag').show();
      $('#request-headers .table').hide();
      $(this).attr('data-layout', 'tag');
      $(this).text('List request headers in table');
      restclient.setPref('requestHeaderLayout', 'tag');
    }
  },
  toggleRequestTimer: function() {
    if ($(this).attr('data-timer') == 'disabled')
    {
      $(this).attr('data-timer', 'enable');
      $(this).text('Disable request execution timer');
      restclient.setPref('requestTimer', true);
    }
    else
    {
      $(this).attr('data-timer', 'disabled');
      $(this).text('Enable request execution timer');
      restclient.setPref('requestTimer', false);
    }
  },
  initRequestUrl: function () {
    var urls = restclient.main.getCachedUrls();
    $('#request-url-list li').remove();
    for(var i=0, url; url = urls[i]; i++) {
      $('#request-url-list').append($('<li></li>').data('url', url).append($('<a></a>').text(url)));
    }
    $('#request-url-list li').click(function () {
      $('#request-url').val($(this).data('url'));
      restclient.main.updateFavoriteUrlIcon();
    });
  },
  getCachedUrls: function () {
    if (restclient.main.cachedUrls)
      return restclient.main.cachedUrls;
    var urls = restclient.getPref('cachedUrls', '');
    if (urls == '')
      return [];
    else{
      restclient.main.cachedUrls = JSON.parse(urls);
      return restclient.main.cachedUrls;
    }
  },
  saveUrlToCache: function (url) {
    var urls = restclient.main.getCachedUrls();
    if (urls.indexOf(url) !== -1)
      return false;
    urls.push(url);
    restclient.setPref('cachedUrls', JSON.stringify(urls));
    restclient.main.cachedUrls = null;
    restclient.main.initRequestUrl();
    return false;
  },
  removeUrlFromCache: function (url) {
    var urls = restclient.main.getCachedUrls();
    var pos = urls.indexOf(url);
    if (pos === -1)
      return true;
    urls = urls.slice(0,pos).concat( urls.slice(pos+1) );
    restclient.setPref('cachedUrls', JSON.stringify(urls));
    restclient.main.cachedUrls = null;
    restclient.main.initRequestUrl();
  },
  updateFavoriteUrlIcon: function (url) {
    var url = (typeof url == 'string') ? url : $('#request-url').val();
    //restclient.log(url);
    var urls = restclient.main.getCachedUrls();

    //restclient.log(urls.indexOf(url));
    if (urls.indexOf(url) > -1)
      $('.favorite-icon').removeClass('icon-star-empty').addClass('icon-star');
    else
      $('.favorite-icon').addClass('icon-star-empty').removeClass('icon-star');
  },
  favoriteUrl: function () {
    var url = $('#request-url').val();
    if (url == '')
      return false;
    if ($('.favorite-icon').hasClass('icon-star-empty'))
    {
      restclient.main.saveUrlToCache(url);
      $(this).removeClass('icon-star-empty').addClass('icon-star');
    }
    else
    {
      restclient.main.removeUrlFromCache(url);
      $(this).addClass('icon-star-empty').removeClass('icon-star');
    }
  },
  requestUrlInputed: function (evt) {
    if (evt.keyCode == 13) {
      $('#request-button').click();
      return false;
    }
    else{
      var url = $(this).val();// + String.fromCharCode(evt.keyCode);
      //restclient.log(url);
      restclient.main.updateFavoriteUrlIcon(url);
    }

  },
  processScroll: function () {
    var scrollTop = $(window).scrollTop();

    if (scrollTop >= restclient.main.navTop && !$('.subnav').hasClass('subnav-fixed'))
      $('.subnav').addClass('subnav-fixed')
    else
      if (scrollTop <= restclient.main.navTop && $('.subnav').hasClass('subnav-fixed'))
        $('.subnav').removeClass('subnav-fixed');
  },
  initRequestMethod: function () {
    $('#request-method').attr('data-source', JSON.stringify(restclient.http.methods));

    for(var i=0, m; m = restclient.http.methods[i]; i++)
    {
      $('#request-method-list').append($('<li></li>').append(
          $('<a></a>').text(m)
        ).bind('click', function () {
          $('#request-method').val($(this).text());
        })
      );
    }
  },
  initModal: function () {
    $('#modal-basic-authorization').on('show', function () {
      var user = '', pass = '', checked = false,
          basicAuth = restclient.getPref('basicAuth', "");
      if (typeof basicAuth === "string" && basicAuth != "") {
        basicAuth = JSON.parse(basicAuth);
        user = basicAuth.user,
        pass = basicAuth.pass,
        checked = true;
      }

      $("#modal-basic-authorization [name='username']").val(user);
      $("#modal-basic-authorization [name='password']").val(pass);
      if ( checked ) {
        $("#modal-basic-authorization [name='remember']").attr('checked', true);
      }
      else {
        $("#modal-basic-authorization [name='remember']").removeAttr('checked');
      }
    });

    $('#modal-custom-header').on('show',  function () {
      var inputName = $('#modal-custom-header [name="name"]'),
          inputValue = $('#modal-custom-header [name="value"]'),
          headerNames = [];

      var headerId = $(this).data('source-header-id');
      //restclient.log(header);
      if (headerId) {
        //restclient.log(headerId);
        inputName.val($('span[data-header-id="' + headerId + '"]').attr("header-name"));
        inputValue.val($('span[data-header-id="' + headerId + '"]').attr("header-value"));
      }

      for ( var name in restclient.headers ) {
        headerNames.push(name);
      }
      //restclient.log(headerNames);
      inputName.attr("data-source", JSON.stringify(headerNames));
      inputName.bind('keypress', function () {
        var name = $(this).val();
        //restclient.log(name);
        if (name != '' && typeof(restclient.headers[name]) == 'object')
          inputValue.attr("data-source", JSON.stringify(restclient.headers[name]));
      }).keypress();
    }).on('shown', function () {
      $('#modal-custom-header [name="name"]').focus();
      $('#modal-custom-header [name="value"]').bind('focus', function () {
        $(this).select();
      });
      $('#modal-custom-header [name="remember"]').removeAttr('checked');
    }).on('hidden', function () {
      $(this).data('source', null);
    });

    $('#modal-save-request').on('show', function () {
      var savedRequest = restclient.getPref('savedRequest', '');
      $('[name="saved-request-name"]').val('');
      if (savedRequest != '') {
        savedRequest = JSON.parse(savedRequest);
        var names = [];
        for(var name in savedRequest) {
          if (!savedRequest.hasOwnProperty(name))
            continue;
          names.push(name);
        }
        $('[name="saved-request-name"]').attr('data-source', JSON.stringify(names));
        $('#modal-save-request .btnOkay').val('Save').attr('overwrite', '0').removeAttr('request-name');
      }
    });

    $('#modal-oauth-view').on('shown', function () {
      var headerId = $(this).data('source-header-id'),
          text     = $('#modal-oauth-view textarea'),
          tag      = $('span[data-header-id="' + headerId + '"]'),
          autoRefresh = $('#modal-oauth-view .btnAutoRefresh');

      text.val(tag.attr('header-value'));

      if (tag.attr('auto-refresh') === 'yes')
        autoRefresh.addClass('active');
      else
        autoRefresh.removeClass('active');
    });
  },
  showModal: function (modalId) {
    $('#' + modalId).modal('show').on('shown', function () {
      $(this).find('input').first().focus();
    });
    return false;
  },
  addBasicAuthorization: function () {
    var username = $("#modal-basic-authorization [name='username']"),
        password = $("#modal-basic-authorization [name='password']");
    if (username.val() == '') {
      username.next().text('Please input the username for authorization').show();
      username.focus();
      return false;
    }
    if (password.val() == '') {
      password.next().text('Please input the password for authorization').show();
      password.focus();
      return false;
    }
    var strValue = username.val() + ":" + password.val(),
        strBase64 = btoa(strValue).replace(/.{76}(?=.)/g,'$&\n');

    //restclient.log(strBase64);
    restclient.main.addHttpRequestHeader('Authorization', "Basic " + strBase64);
    if ( $("#modal-basic-authorization [name='remember']").attr('checked') === 'checked') {
      var basicAuth = JSON.stringify({'user': username.val(), 'pass': password.val()});
      //restclient.log(basicAuth);
      restclient.setPref("basicAuth", basicAuth);
    }
    else {
      restclient.setPref("basicAuth", "");
    }
    $("#modal-basic-authorization").modal('hide');
  },
  removeHttpRequestHeaderByName: function (name) {
    if (typeof name !== 'string')
      return false;
    $('#request-headers [header-name]').each(function () {
      if ($(this).attr('header-name').toLowerCase() === name.toLowerCase())
        $(this).remove();
    })
  },
  removeHttpRequestHeader: function (evt) {
    evt.preventDefault();
    var id = $(this).parents('[data-header-id]').attr('data-header-id');
    $('[data-header-id="' + id + '"]').remove();
    if ( $('#request-headers span.label').length == 0 ) {
      $('#request-headers').hide();
    }
    return false;
  },
  removeHttpRequestHeaders: function () {
    $('#request-headers span.label').remove();
    $('#request-headers table tbody').empty();
    if ( $('#request-headers span.label').length == 0 ) {
      $('#request-headers').hide();
    }
  },
  editHttpRequestHeader: function () {
    var id        = $(this).attr('data-header-id') || $(this).parents('[data-header-id]').attr('data-header-id'),
        header    = $('#request-headers .tag span[data-header-id="' + id + '"]'),
        attrName  = header.attr('header-name'),
        attrValue = header.attr('header-value');
    
    restclient.log(attrName);
    if(attrName.toLowerCase() === 'authorization') {
      //OAuth 2.0
      if(attrValue.toLowerCase().indexOf('oauth2 ') === 0) {
        var oauth2 = header.attr('oauth2');
        try{
          oauth2 = JSON.parse(oauth2);
          restclient.oauth2.setAuthorize(oauth2.authorize);
          restclient.oauth2.setTokens(oauth2.tokens);
          $('#window-oauth2').show();
          $('#window-oauth2 .nav-tabs li a').eq(1).click();
        }catch(e) {}
        return;
      }
      //OAuth 1.0
      if (typeof header.attr('oauth-secrets') !== 'undefined') {
        $('#modal-oauth-view').data('source-header-id', id);
        $('#modal-oauth-view').modal('show');
        return;
      }
      attrValue = $.trim(attrValue);
      if(attrValue.length > 5 && attrValue.substr(0, 5).toLowerCase() === 'basic')
      {
        var hashed = header.attr('header-value'),
            basic = atob(hashed.substring(6)),
            user = basic.split(':');
        $('#modal-basic-authorization [name="username"]').val(user[0]);
        $('#modal-basic-authorization [name="password"]').val(user[1]);
        $('#modal-basic-authorization').modal('show');
        return;
      }
    }
    
    $('#modal-custom-header').data('source-header-id', id);
    $('#modal-custom-header').modal('show');
  },
  addHttpRequestHeader: function (name, value, param) {
    if (this.uniqueHeaders.indexOf(name.toLowerCase()) >= 0)
      restclient.main.removeHttpRequestHeaderByName(name);

   var text = name + ": " + value,
       id   = restclient.helper.sha1(text);

   if (text.length > restclient.main.headerLabelMaxLength)
     text = text.substr(0, restclient.main.headerLabelMaxLength - 3) + "...";

   var tag = $('<span />').addClass('label').text(text).attr('data-header-id', id)
              .attr("title", name + ": " + value)
              .attr('header-name', name)
              .attr('header-value', value)
              .append($('<a />').addClass('close').text('×').bind('click', restclient.main.removeHttpRequestHeader));
    tag.bind('click', restclient.main.editHttpRequestHeader);
    $('#request-headers .tag').append(tag);

    var tr = $('<tr class="headers"></tr>').attr('header-name', name)
    .attr('header-value', value)
    .attr('data-header-id', id)
    .append(
      $('<td></td>').text(name).bind('click', restclient.main.editHttpRequestHeader)
    ).append(
      $('<td></td>').text(value).bind('click', restclient.main.editHttpRequestHeader)
      .append(
        $('<input class="btn btn-mini btn-danger hide" style="float:right;" type="button" value="Remove">').bind('click', restclient.main.removeHttpRequestHeader)
      )
    );

    $('#request-headers table tbody').append(tr);

    if ( $('#request-headers span.label').length > 0 ) {
      $('#request-headers').show();
    }

    if (param)
      for(var n in param) {
        if (!param.hasOwnProperty(n))
          continue;
        tag.attr(n, (typeof param[n] === 'string') ? param[n] : JSON.stringify(param[n]));
        tr.attr(n, (typeof param[n] === 'string') ? param[n] : JSON.stringify(param[n]));
      }

    $('.table .headers').mouseover(function () {
      $(this).find('input.btn').show();
    }).mouseout(function () {
      $(this).find('input.btn').hide();
    });
    return id;
  },
  replaceHttpRequestHeader: function (oldId, name, value, param) {
    try{
      var text    = name + ": " + value,
          newId   = restclient.helper.sha1(text);
      
      if (text.length > restclient.main.headerLabelMaxLength)
         text = text.substr(0, restclient.main.headerLabelMaxLength-3) + "...";
      
      var tag = $('span[data-header-id="' + oldId + '"]');
      tag.attr('header-name', name)
      .attr('header-value', value)
      .attr("title", name + ": " + value)
      .attr('data-header-id', newId)
      .text(text);
      
      var tr = $('tr[data-header-id="' + oldId + '"]');
      tr.attr('data-header-id', newId)
      .attr('header-name', name)
      .attr('header-value', value);
      tr.find('td').first().text(name);
      tr.find('td').last().text(value);
      
      if (param)
        for(var n in param) {
          if (!param.hasOwnProperty(n))
            continue;
          tag.attr(n, (typeof param[n] === 'string') ? param[n] : JSON.stringify(param[n]));
          tr.attr(n, (typeof param[n] === 'string') ? param[n] : JSON.stringify(param[n]));
        }
      return newId;
    } catch(e) {
      restclient.error('restclient.replaceHttpRequestHeader');
      restclient.error(e);
    }
  },
  addCustomHeader: function () {
    var remember = $('#modal-custom-header [name="remember"]'),
        inputName = $('#modal-custom-header [name="name"]'),
        inputValue = $('#modal-custom-header [name="value"]');
    if (inputName.val() == '') {
      inputName.next().text('Please input the http request header name').show();
      inputName.focus();
      return false;
    }
    if (inputValue.val() == '') {
      inputValue.next().text('Please input the http request header value').show();
      inputValue.focus();
      return false;
    }
    inputName.next().hide();
    inputValue.next().hide();

    if (remember.attr('checked') == 'checked') {
      var favoriteHeaders = restclient.getPref('favoriteHeaders', '');
      if (favoriteHeaders == '')
        favoriteHeaders = [];
      else
        favoriteHeaders = JSON.parse(favoriteHeaders);

      var favorited = false;
      for(var i=0, header; header = favoriteHeaders[i]; i++) {
        if (header[0].toLowerCase() == inputName.val().toLowerCase()
          && header[1].toLowerCase() == inputValue.val().toLowerCase()) {
          favorited = true;
          break;
        }
      }
      if (!favorited) {
        favoriteHeaders.push([inputName.val(), inputValue.val()]);
        restclient.setPref('favoriteHeaders', JSON.stringify(favoriteHeaders));
        restclient.main.updateFavoriteHeadersMenu();
      }
    }
    var oldId = $('#modal-custom-header').data('source-header-id');
    if (!oldId)
      this.addHttpRequestHeader(inputName.val(), inputValue.val());
    else
      this.replaceHttpRequestHeader(oldId, inputName.val(), inputValue.val());

    $('#modal-custom-header').modal('hide');
  },
  updateFavoriteHeadersMenu: function () {
    $('ul.headers .favorite').remove();
    var favoriteHeaders = restclient.getPref('favoriteHeaders', '');
    if (favoriteHeaders == '')
      return false;
    else
      favoriteHeaders = JSON.parse(favoriteHeaders);
    for(var i=0, header; header = favoriteHeaders[i]; i++) {
      var text = header[0] + ": " + header[1];

      if (text.length > restclient.main.headerMenuMaxLength)
        text = text.substr(0, restclient.main.headerMenuMaxLength -3) + "...";
      var a =   $('<a class="favorite" href="#"></a>').text(text)
        .attr('header-name', header[0])
        .attr('header-value', header[1]);
      $('.custom-header').after($('<li></li>').append(a));
    }
    $('.headers a.favorite').bind('click', function (evt) {
      restclient.main.addHttpRequestHeader($(this).attr('header-name'), $(this).attr('header-value'));
      evt.preventDefault();
    })
    $('.custom-header').after($('<li class="divider favorite"></li>'));
  },
  clearFavoriteHeaders: function () {
    restclient.setPref('favoriteHeaders', '');
    this.updateFavoriteHeadersMenu();
  },
  getRequest: function () {
    var request = {};
        request.method = $.trim($('#request-method').val());
        request.url = $.trim($('#request-url').val());
        request.body = $('#request-body').val();
        request.overrideMimeType = ($('#overrideMimeType').attr('checked') == 'checked') ? $('#overrideMimeType').val() : false;
    var headers = [];
    $('#request-headers .label').each(function () {
      headers.push([$(this).attr('header-name'), $(this).attr('header-value')]);
      if ($(this).attr('oauth-secrets'))
      {
        request.oauth = {};
        request.oauth.oauth_secrets = $(this).attr('oauth-secrets');
        request.oauth.oauth_parameters = $(this).attr('oauth-parameters');
        request.oauth.auto_refresh = $(this).attr('auto-refresh');
        if(typeof $(this).attr('realm') !== 'undefined')
          request.oauth.realm = $(this).attr('realm');
        restclient.log($(this));
        if($(this).attr('auto-realm') === 'true')
            request.oauth.auto_realm = true;
      }
      if ($(this).attr('oauth2'))
      {
        try{
          request.oauth2 = JSON.parse($(this).attr('oauth2'));
        }catch(e) {
          request.log(e);
        }
      }
    });
    request.headers = headers;
    return request;
  },
  wrapText: function (str, len) {
    var result = "";
    if (str.length > len)
    {
      for (var j = 0, np = ''; j < str.length; j += len, np = '\n') {
        var line = str.substr(j, len);
        if (line.indexOf('\n') > -1 || line.indexOf(' ') > -1)
          result += line;
        else
        {
          np += line;
          result += np;
        }
      }
      return result;
    }
    else
      return str;
  },
  setResponseHeader: function (headers, line) {
    //restclient.log(headers);
    if (!headers) {
      $('#response-headers pre').text('');
      return false;
    }
    if (typeof line === 'boolean' && line == false) {
      var text = (typeof headers == 'object' && headers.length > 0) ? headers.join("\n") : '';
      $('#response-headers pre').text(text);
    }
    else
    {
      var ol = $('<ol class="linenums"></ol>');
      var keys = [];

      for(var key in headers)
        if (headers.hasOwnProperty(key) && key != 'Status Code')
          keys.push(key);

      keys.sort(); //sort response header
      keys.unshift('Status Code'); //put status code on the first line
      for(var n=0, name; name = keys[n]; n++) {
        if (!headers.hasOwnProperty(name))
          continue;
        var val     = headers[name],
            valHtml = null;

        if (typeof val == 'string') {
          val = restclient.main.wrapText(val, 120);
          valHtml = $('<span class="header-value"></span>').text(val)
        }
        else
        {
          valHtml = $('<ul class="multivalues"></ul>');
          for(var k=0, value; value = val[k]; k++) {
            valHtml.append($('<li></li>').text(value));
          }
          valHtml = $('<span class="header-value"></span>').append(valHtml);
        }
        var headerName = $('<span class="header-name"></span>').text(name);
        var li = $('<li></li>');
        li.append(
          $('<span class="line"></span>').append(headerName)
          .append($('<span class="header-split"></span>').text(': '))
          .append(valHtml)
        );

        ol.append(li);
      }
      $('#response-headers pre').empty().append(ol);
      var maxWidth = 120;
      $('#response-headers .header-name').each(function () {
        maxWidth = ($(this).outerWidth(true) > maxWidth) ? $(this).outerWidth(true) : maxWidth;
      });
      $('#response-headers .header-name').width(maxWidth + 10);
      //$('#response-headers .header-value').css('margin-left', maxWidth + 20 + 'px');
    }
  },
  updateProgressBar: function (idx, status) {
    if (idx > 0 && idx <=100)
    {
      $('.mainOverlay').show();
      $('.mainOverlay .bar').css('width', idx + "%");
    }
    else
    {
      $('.mainOverlay').hide();
      $('.mainOverlay .bar').css('width', "0%");
    }
    if (status) {
      $('.mainOverlay .status').text(status);
    }
  },
  showRequest: function (e) {
    window.scrollTo(0,0);
    if (e)
      e.preventDefault();
    return false;
  },
  showResponse: function () {

    $("#response").show();

    //document.getElementById('response').scrollIntoView(true);
    //alert(top);
    document.getElementById('response').scrollIntoView(true);
    //$('html, body').animate({scrollTop: top}, 1000);
    return false;
  },
  clearResult: function () {
    $("#response-body-preview div.pre").html('');
    $('#response-body-raw pre').text('');
    $('#response-body-highlight pre').text('');
    restclient.main.setResponseHeader();
    $("#response-body-preview div.pre").addClass('overflow');
    $('#response-body-highlight pre').empty().removeClass('KelpJSONView').addClass('prettyprint linenums');
  },
  checkMimeType: function () {
    var contentType = this.xhr.getResponseHeader("Content-Type");
    if (contentType && contentType.indexOf('image') >= 0) {
      if ($('#overrideMimeType').attr('checked') !== 'checked' && restclient.getPref('imageWarning', true))
        restclient.message.show({
          id: 'alertOverrideMimeType',
          type: 'warning',
          title: 'Cannot preview image',
          message: 'Your response is an image, but we need to override the mime type to preview this image. Would you like to override the mime type to "text/xml; charset=x-user-defined" and re-send this request?',
          buttons: [
            {title: 'Yes, please continue', class: 'btn-danger', callback: restclient.main.overrideMimeType},
            [
              {title: 'No, thanks', class: 'btn-warning', callback: function () { $('#alertOverrideMimeType').alert('close'); }},
              {title: 'No, and please don\'t remind me again', callback: function () { $('#alertOverrideMimeType').alert('close'); restclient.setPref('imageWarning', false); }}
            ]
          ],
          parent: $('.overrideMimeTypeMessage'),
          exclude: true
        });
    }
    else
      if ($('#overrideMimeType').attr('checked') == 'checked' && restclient.getPref('textMimeWarning', true))
        restclient.message.show({
          id: 'alertUnOverrideMimeType',
          type: 'warning',
          title: 'You\'ve overrided MIME type',
          message: 'Please notice that you enabled MIME override in this request, it could cause some charset/encoding issues. Would you like to disable this override and try again?',
          buttons: [
            {title: 'Yes, please continue', class: 'btn-danger', callback: restclient.main.unOverrideMimeType},
            [
              {title: 'No, thanks', class: 'btn-warning', callback: function () { $('#alertUnOverrideMimeType').alert('close'); }},
              {title: 'No, and please don\'t remind me again', callback: function () { $('#alertUnOverrideMimeType').alert('close'); restclient.setPref('textMimeWarning', false); }}
            ]
          ],
          parent: $('.overrideMimeTypeMessage'),
          exclude: true
        });
  },
  formatXml: function (xml) {
    var formatted = '';
    try{
      var reg = /(>)(<)(\/*)/g;
      xml = xml.replace(reg, '$1\r\n$2$3');
      var pad = 0;
      jQuery.each(xml.split('\r\n'), function (index, node) {
        //restclient.log(node);
        var indent = 0;
        if (node.match( /.+<\/\w[^>]*>$/ )) {
          indent = 0;
        } else if (node.match( /^<\/\w/ )) {
          if (pad != 0) {
            pad -= 1;
          }
        } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
          indent = 1;
        } else {
          indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
          padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
      });
      return formatted;
    }
    catch(e)
    {
      //console.error(e);
      return xml;
    }
  },
  display: function () {
    var responseData = this.xhr.responseText;
    $('#response-body-raw pre').text(responseData);
    window.prettyPrint && prettyPrint();
  },
  displayHtml: function () {
    var responseData = this.xhr.responseText;

    if (responseData.length > 0) {

      var target = document.getElementById('response-body-preview'),
          fragment = Components.classes["@mozilla.org/feed-unescapehtml;1"]
                               .getService(Components.interfaces.nsIScriptableUnescapeHTML)
                               .parseFragment(responseData, false, null, target);
      //restclient.log(responseData);
      $("#response-body-preview div.pre").append(fragment);
      $("#response-body-preview div.pre").removeClass('overflow');

      $('#response-body-highlight pre').text(responseData);
    }

    $('#response-body-raw pre').text(responseData);
    window.prettyPrint && prettyPrint();
  },
  displayXml: function () {
    var responseData = this.xhr.responseText,
        responseXml  = this.xhr.responseXML;

    if (responseXml != null) {
      var xslDocument = document.implementation.createDocument("", "dummy", null);
      xslDocument.onload = function (evt) {
          var xsltProcessor = new XSLTProcessor();
          xsltProcessor.importStylesheet(xslDocument);
          var resultFragment = xsltProcessor.transformToFragment(responseXml, document);
          $("#response-body-preview div.pre").append(resultFragment);
          $('#response-body-preview .expander').click(restclient.main.toggleExpander);
      };
      xslDocument.load("chrome://restclient/content/xsl/XMLPrettyPrint.xsl");

      /*var xslDoc = document.implementation.createDocument("", "dummy", null);
      xslDoc.onload = function (evt) {
          var xsltProcessor = new XSLTProcessor();
          xsltProcessor.importStylesheet(xslDoc);
          var resultFragment = xsltProcessor.transformToFragment(responseXml, document);

          //$("#response-body-highlight pre").append(resultFragment);
          //$("#response-body-highlight pre").text($('<p></p>').append(resultFragment).html());
          //$('#response-body-preview .expander').click(restclient.main.toggleExpander);
          window.prettyPrint && prettyPrint();
      };
      xslDoc.load("chrome://restclient/content/xsl/XMLIndent.xsl");*/
    }

    //$("#response-body-preview div.pre").append(iframe);
    $('#response-body-raw pre').text(responseData);
    var indentXml = restclient.main.formatXml(responseData);
    //restclient.log(indentXml);
    $('#response-body-highlight pre').text(indentXml);
    window.prettyPrint && prettyPrint();
  },
  displayJson: function () {
    var responseData = this.xhr.responseText;

    $('#response-body-raw pre').text(responseData);
    var reformatted = responseData;
    try{
      reformatted = JSON.stringify(JSON.parse(responseData), null, "  ");
    }catch(e) {}
    $('#response-body-highlight pre').empty().removeClass('prettyprint linenums');
    $.JSONView(reformatted, $('#response-body-highlight pre'));
    //$('#response-body-highlight pre').text(reformatted);
    $("#response-body-preview div.pre").removeClass('overflow').append($('<textarea></textarea>').text(reformatted));
  },
  displayImage: function () {
    var responseData = this.xhr.responseText,
        contentType = this.xhr.getResponseHeader("Content-Type");
    var toConvert = "";
    for(var i = 0; i < responseData.length; i++) {
      toConvert += String.fromCharCode(responseData.charCodeAt(i) & 0xff);
    }
    var base64encoded = btoa(toConvert);
    var imgSrc = "data:" + contentType + ";base64," + base64encoded;
    /*var base64encoded = restclient.base64(responseData),
        imgSrc = "data:" + contentType + ";base64," + base64encoded,*/
    var image = $("<img>").attr("src", imgSrc);

    $("#response-body-preview div.pre").append(image);
    $('#response-body-raw pre').text(imgSrc);
  },
  displayImageRaw: function () {
    var responseData = this.xhr.responseText,
        contentType = this.xhr.getResponseHeader("Content-Type");

    $('#response-body-raw pre').text(responseData);
  },
  saveCurrentRequest: function () {
    var name = $('[name="saved-request-name"]');
    if (name.val() == '') {
      name.next().text('Please give this request a name for future usage.').show();
      name.focus();
      return false;
    }
    var savedRequest = restclient.getPref('savedRequest', '');
    if (savedRequest != '')
    {
      //restclient.log(savedRequest);
      savedRequest = JSON.parse(savedRequest);
      //restclient.log(typeof savedRequest[name.val()]);
      if (typeof $('#modal-save-request .btnOkay').attr('request-name') == 'undefined' &&
              typeof savedRequest[name.val()] != 'undefined') {
        name.next().text('Name existed, you can either change a name or overwrite it.').show();
        $('#modal-save-request .btnOkay').val('Overwrite').attr('overwrite', '1').attr('request-name', name.val());
        name.focus();
        return false;
      }
    }
    else
      savedRequest = {};

    var request = restclient.main.getRequest();
    savedRequest[name.val()] = request;
    restclient.setPref('savedRequest', JSON.stringify(savedRequest));
    $('#modal-save-request').modal('hide');
    this.updateFavoriteRequestMenu();
    $('.request-menu').click();
  },
  updateFavoriteRequestMenu: function () {
    $('ul.savedRequest .favorite').remove();
    var savedRequest = restclient.getPref('savedRequest', '');
    if (savedRequest == '')
      return false;
    else
      savedRequest = JSON.parse(savedRequest);

    for(var name in savedRequest) {
      if (!savedRequest.hasOwnProperty(name))
        continue;
      if (name.length > restclient.main.requestMenuMaxLength)
        name = name.substr(0, restclient.main.requestMenuMaxLength -3) + "...";

      var a =   $('<a class="favorite" href="#"></a>').text(name)
        .data('request', savedRequest[name])
        .data('request-name', name);
      $('.savedRequest').prepend($('<li></li>').append(a));
    }
    if ( $('.savedRequest a.favorite').length > 0 )
      $('li.manage-request').show();
    else
      $('li.manage-request').hide();

    $('.savedRequest a.favorite').bind('click', function (evt) {
      restclient.main.applyFavoriteRequest($(this).data('request-name'));
      evt.preventDefault();
    })
    $('.savedRequest .favorite:last').after($('<li class="divider favorite"></li>'));
  },
  overrideMimeType: function () {
    $('label.overrideMimeType').show().find('input').attr('checked', true);
    $('#request-button').click();
    $('#alertOverrideMimeType').alert('close');
  },
  unOverrideMimeType: function () {
    $('label.overrideMimeType').show().find('input').removeAttr('checked');
    $('#request-button').click();
    $('#alertUnOverrideMimeType').alert('close');
  },
  loadRequest: function () {
    var nsIFilePicker = Components.interfaces.nsIFilePicker,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Please select a exported text file to load", nsIFilePicker.modeOpen);
    fp.appendFilter("Plain text","*.txt");
    var res = fp.show();
    if (res == nsIFilePicker.returnOK) {
      restclient.NetUtil.asyncFetch(fp.file, function (inputStream, status) {
        if (!Components.isSuccessCode(status)) {
          alert('Failed to open this request file.');
          return;
        }

        var data = restclient.NetUtil.readInputStreamToString(inputStream, inputStream.available());

        var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
            getService(Components.interfaces.nsIUTF8ConverterService);
        var request = utf8Converter.convertURISpecToUTF8(data, "UTF-8");
        try{
          if (request == '') {
            alert('This is an empty file.');
            return;
          }
          request = JSON.parse(request);
          request.method  = (request.requestMethod) ? request.requestMethod : 'GET';
          request.url     = (request.requestUrl)    ? request.requestUrl : false;
          request.body    = (request.requestBody)   ? request.requestBody : false;
          var headers     = (request.headers && typeof request.headers == 'object')
                                                    ? request.headers : false;
          //restclient.log(headers);
          request.headers = [];
          if (headers)
            for(var i=0; i < headers.length; i++)
            {
              request.headers.push([headers[i], headers[++i]]);
            }
          //restclient.log(request);
          restclient.main.applyRequest(request);
        }catch(e) { alert('Cannot load this request.'); }
      });
    }
  },
  importFavoriteRequests: function () {
    var nsIFilePicker = Components.interfaces.nsIFilePicker,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Please select a exported JSON file to import", nsIFilePicker.modeOpen);
    fp.appendFilter("JSON","*.json");
    var res = fp.show();
    if (res == nsIFilePicker.returnOK) {
      restclient.NetUtil.asyncFetch(fp.file, function (inputStream, status) {
        if (!Components.isSuccessCode(status)) {
          alert('Cannot import the json file.');
          return;
        }

        var data = restclient.NetUtil.readInputStreamToString(inputStream, inputStream.available());

        var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
            getService(Components.interfaces.nsIUTF8ConverterService);
        var setting = utf8Converter.convertURISpecToUTF8(data, "UTF-8");
        try{
          if (setting == '') {
            alert('This is an empty file.');
            return;
          }
          restclient.setPref('savedRequest', setting);
        }catch(e) { alert('Cannot import the json file.'); }
      });
      restclient.main.updateFavoriteRequestMenu();
      alert('import requests succeed');
    }
    return false;
  },
  exportFavoriteRequests: function () {
    var savedRequest = restclient.getPref('savedRequest', ''),
        nsIFilePicker = Components.interfaces.nsIFilePicker,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Please select a export directory", nsIFilePicker.modeSave);
    fp.appendFilter("JSON","*.json");
    var res = fp.show();
    if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
      var targetFile = fp.file, path = fp.file.path;
      if (path.match("\.json$") != ".json") {
          targetFile = Components.classes["@mozilla.org/file/local;1"]
              .createInstance(Components.interfaces.nsILocalFile);
          targetFile.initWithPath(path + ".json")
      }
      var ostream = restclient.FileUtils.openSafeFileOutputStream(targetFile),
          converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";
      var istream = converter.convertToInputStream(savedRequest);

      restclient.NetUtil.asyncCopy(istream, ostream, function (status) {
        if (!Components.isSuccessCode(status)) {
          alert('Cannot export favorite request.');
          return;
        }
      });
    }
    return false;
  },
  manageFavoriteRequests: function () {
    $('#favorite-request-list .accordion-group').remove();
    var favoriteRequest = restclient.getPref('savedRequest', '');
    if (favoriteRequest != '') {
      favoriteRequest = JSON.parse(favoriteRequest);
      var i = 0;
      for(var name in favoriteRequest) {
        if (!favoriteRequest.hasOwnProperty(name))
          continue;

        var html = this.getFavoriteRequestHtml("favorite-request-" + (++i), name, favoriteRequest[name]);
        $('#favorite-request-list').append(html);
      }
    }

    $('#window-manage-request').show();

  },
  getFavoriteRequestHtml: function (id, name, request) {
    var group = $('<div class="accordion-group"></div>'),
      heading = $('<div class="accordion-heading"></div>')
                  .append(
                    $('<a class="accordion-toggle" data-toggle="collapse" data-parent="#favorite-request-list"></a>').attr('href', '#' + id)
                    .text(name)
                  ),
      body = $('<div class="accordion-body collapse"></div>').attr('id', id),
      inner = $('<div class="accordion-inner"></div>');

    inner.append($('<h5></h5>').text('Request'));
    inner.append($('<p></p>').text(request.method + ' ' + request.url));
    var ul = $('<ul></ul>');
    if (request.overrideMimeType)
      ul.append( $('<li class="overrideMimeType"></li>').text('overrideMimeType: ' + request.overrideMimeType) );
    for(var i=0, header; header = request.headers[i]; i++) {
      ul.append( $('<li></li>').text(header[0] + ': ' + header[1]) );
    }
    inner.append(ul);
    inner.append($('<h5></h5>').text('Body'));
    inner.append($('<div class="body pre-scrollable"></div>').text(request.body));

    var buttons = $('<div class="buttons"></div>');
    buttons.append($('<button class="btn btn-success"></button>').text('Apply this request').bind('click', function () {
      restclient.main.applyFavoriteRequest(name);
      $('#window-manage-request').hide();
    }));
    buttons.append($('<button class="btn btn-danger"></button>').text('Remove from favorite').bind('click', function () {
      var result = restclient.main.removeFavoriteRequest(name);
      if (result) {
        $(this).parents('div.accordion-group').hide().remove();
        restclient.main.updateFavoriteRequestMenu();
      }
    }));

    inner.append(buttons);
    body.append(inner);

    group.append(heading).append(body);

    return group;
  },
  removeFavoriteRequest: function (name) {
    var favorites = restclient.getPref('savedRequest', '');
    if (favorites == '')
      return false;
    favorites = JSON.parse(favorites);
    if (name in favorites) {
      delete favorites[name];
      restclient.setPref('savedRequest', JSON.stringify(favorites));
      return true;
    }
    return false;
  },
  applyRequest: function (request) {

    $('#request-body').val('');
    $('#request-url').val('');
    $('#request-method').val('GET');
    restclient.main.removeHttpRequestHeaders();

    if (typeof request.method == 'string') {
      $('#request-method').val(request.method.toUpperCase());
    }

    if (request.url) {
      $('#request-url').val(request.url);
    }

    if (request.overrideMimeType) {
      $('#overrideMimeType').attr('checked', true);
      $('.overrideMimeType').show();
    }
    else
      $('#overrideMimeType').removeAttr('checked');

    if (request.body) {
      $('#request-body').val(request.body);
    }

    if (request.headers)
      for(var i = 0, header; header = request.headers[i]; i++) {
        if (header[0].toLowerCase() == 'authorization' && request.oauth)
        {
          var param = {
            'oauth-secrets': request.oauth.oauth_secrets,
            'oauth-parameters': request.oauth.oauth_parameters,
            'auto-refresh': request.oauth.auto_refresh
          };
          if (typeof request.oauth.realm === 'string')
            param.realm = request.oauth.realm;
          if (typeof request.oauth.auto_realm !== 'undefined')
            param['auto-realm'] = true;
          restclient.main.addHttpRequestHeader(header[0], header[1], param);
        }
        else
          if (header[0].toLowerCase() == 'authorization' && request.oauth2)
            restclient.main.addHttpRequestHeader(header[0], header[1], {'oauth2': request.oauth2});
          else
            restclient.main.addHttpRequestHeader(header[0], header[1]);
    }
    return true;
  },
  applyFavoriteRequest: function (name) {
    var favorites = restclient.getPref('savedRequest', '');
    if (favorites == '')
      return false;
    favorites = JSON.parse(favorites);
    if (name in favorites) {
      var request = favorites[name];
      restclient.main.applyRequest(request);
      return true;
    }
    return false;
  },
  initOAuthWindow: function () {
    var auto_oauth_timestamp    = $('#oauth-setting [name="auto_oauth_timestamp"]'),
        oauth_timestamp         = $('#oauth-setting [name="oauth_timestamp"]'),
        auto_oauth_nonce        = $('#oauth-setting [name="auto_oauth_nonce"]'),
        oauth_nonce             = $('#oauth-setting [name="oauth_nonce"]'),
        oauth_signature_method  = $('#oauth-setting [name="oauth_signature_method"]'),
        oauth_version           = $('#oauth-setting [name="oauth_version"]'),
        auto_oauth_realm        = $('#oauth-setting [name="auto_oauth_realm"]'),
        oauth_realm             = $('#oauth-setting [name="oauth_realm"]'),
        disable_oauth_realm     = $('#oauth-setting [name="disable_oauth_realm"]'),
        setting                 = restclient.getPref('OAuth.setting', '');
    
    //$('#get-access-token .btnOkay').bind('click', restclient.main.oauthAuthorize);
    $('#oauth-setting .help-block').hide();
    
    function autoRealm(checked) {
      if(typeof checked === 'boolean')
        if(checked)
          auto_oauth_realm.attr('checked', true);
        else
          auto_oauth_realm.removeAttr('checked');
      
      if (disable_oauth_realm.attr('checked') !== 'checked' && auto_oauth_realm.attr('checked') !== 'checked') 
        oauth_realm.removeClass('disabled').removeAttr('disabled');
      else 
        oauth_realm.addClass('disabled').attr('disabled', true);
    }
    function disableRealm(disabled) {
      if(typeof disabled === 'boolean')
        if(disabled)
          disable_oauth_realm.attr('checked', true);
        else
          disable_oauth_realm.removeAttr('checked');
          
      if (disable_oauth_realm.attr('checked') === 'checked')
        auto_oauth_realm.addClass('disabled').attr('disabled',true);
      else
        auto_oauth_realm.removeClass('disabled').removeAttr('disabled');
      
      autoRealm();
    }
    function autoTimeStamp(auto) {
      if(typeof auto === 'boolean')
        if(auto)
          auto_oauth_timestamp.attr('checked', true);
        else
          auto_oauth_timestamp.removeAttr('checked');
          
      if (auto_oauth_timestamp.attr('checked') == 'checked') {
        oauth_timestamp.val('').addClass('disabled').attr('disabled',true);
        oauth_timestamp.parent().next().hide();
      }
      else {
        var ts = restclient.oauth.getTimeStamp();
        oauth_timestamp.val(ts).removeClass('disabled').removeAttr('disabled');
        oauth_timestamp.parent().next().text(new Date(ts*1000)).show();
      }
    }
    function autoNonce(auto) {
      if(typeof auto === 'boolean')
        if(auto)
          auto_oauth_nonce.attr('checked', true);
        else
          auto_oauth_nonce.removeAttr('checked');
          
      if (auto_oauth_nonce.attr('checked') == 'checked') {
        oauth_nonce.val('').addClass('disabled').attr('disabled',true);
      }
      else
        oauth_nonce.val(restclient.oauth.getNonce()).removeClass('disabled').removeAttr('disabled');
    }
    
    //Load setting from preferences
    if (setting != '') {
      setting = JSON.parse(setting);
      
      autoTimeStamp (setting.auto_oauth_timestamp === true);
      autoNonce (setting.auto_oauth_nonce === true);
      disableRealm (setting.disable_oauth_realm === true);
      autoRealm (setting.auto_oauth_realm === true);
      
      oauth_realm.val((typeof (setting.oauth_realm) === 'string') ? setting.oauth_realm : '');
      $('#oauth-setting [name="oauth_version"] option[value="' + setting.oauth_version + '"]').attr('selected', true);
      $('#oauth-setting [name="oauth_signature_method"] option[value="' + setting.oauth_signature_method + '"]').attr('selected', true);
    }
    else
    {
      autoTimeStamp(true);
      autoNonce(true);
      disableRealm(true);
      autoRealm(true);
    }
    
    $('#oauth-setting .btnOkay').click(function () {
      
      if (!oauth_realm.hasClass('disabled') 
            && (oauth_realm.val().indexOf('?') > -1 || oauth_realm.val().indexOf('#') > -1))
      {
        oauth_realm.parents('.control-group').addClass('error');
        oauth_realm.nextAll('.help-block').show();
        return false;
      }
      var param = {};
      param.auto_oauth_timestamp    = (auto_oauth_timestamp.attr('checked') === 'checked');
      param.oauth_timestamp         = oauth_timestamp.val();
      param.auto_oauth_nonce        = (auto_oauth_nonce.attr('checked') === 'checked');
      param.oauth_nonce             = oauth_nonce.val();
      param.oauth_signature_method  = oauth_signature_method.val();
      param.oauth_version           = oauth_version.val();
      param.auto_oauth_realm        = (auto_oauth_realm.attr('checked') === 'checked');
      param.disable_oauth_realm     = (disable_oauth_realm.attr('checked') === 'checked');
      param.oauth_realm             = oauth_realm.val();
      
      restclient.setPref('OAuth.setting', JSON.stringify(param));
      
      var message = restclient.message.show({
        id: 'alert-oauth-setting-saved',
        parent: $('#oauth-setting .infobar'),
        exclude: true,
        type: 'message',
        title: 'OAuth settings saved!',
        message: 'Your OAuth settings have been successfully saved. Enjoy.',
        buttons: [
          {title: 'Close', class: 'btn-danger', 'timeout': 5000, callback: function () { $('#alert-oauth-setting-saved').alert('close'); }}
        ]
      });
    });

    disable_oauth_realm.click(disableRealm);
    auto_oauth_realm.click(autoRealm);
    auto_oauth_timestamp.click(autoTimeStamp);
    auto_oauth_nonce.click(autoNonce);


    //Load authorize from preferences
    /*var authorize_consumer_key      = $('#get-access-token [name="consumer_key"]'),
        authorize_consumer_secret   = $('#get-access-token [name="consumer_secret"]'),
        authorize_request_token_url = $('#get-access-token [name="request_token_url"]'),
        authorize_authorize_url     = $('#get-access-token [name="authorize_url"]'),
        authorize_access_token_url  = $('#get-access-token [name="access_token_url"]'),
        authorize_callback_url      = $('#get-access-token [name="callback_url"]'),
        authorize_remember          = $('#get-access-token [name="remember"]');

    var authorize = restclient.getPref('OAuth.authorize', '');
    if (authorize != '') {
      authorize = JSON.parse(authorize);
      authorize_consumer_key.val(authorize.consumer_key);
      authorize_consumer_secret.val(authorize.consumer_secret);
      authorize_request_token_url.val(authorize.request_token_url);
      authorize_authorize_url.val(authorize.authorize_url);
      authorize_access_token_url.val(authorize.access_token_url);
      authorize_callback_url.val(authorize.callback_url);
      (authorize.remember === true) ? authorize_remember.attr('checked', true) : authorize_remember.removeAttr('checked');
    }
    else
    {

    }*/

    //Load oauth keys from preferences
    var sign_consumer_key         = $('#signature-request [name="consumer_key"]'),
        sign_consumer_secret      = $('#signature-request [name="consumer_secret"]'),
        sign_access_token         = $('#signature-request [name="access_token"]'),
        sign_access_token_secret  = $('#signature-request [name="access_token_secret"]'),
        sign_remember             = $('#signature-request [name="remember"]'),
        sign = restclient.getPref('OAuth.sign', '');
        
    if (sign != '') {
      sign = JSON.parse(sign);
      if (sign.consumer_key)
        sign_consumer_key.val (           sign.consumer_key);
      if (sign.consumer_secret)
        sign_consumer_secret.val (        sign.consumer_secret);
      if (sign.access_token)
        sign_access_token.val (           sign.access_token);
      if (sign.access_token_secret)
        sign_access_token_secret.val (    sign.access_token_secret);
      
      (sign.remember === true) ? sign_remember.attr('checked', true) : sign_remember.removeAttr('checked');
    }

    $('#signature-request .btnInsertAsHeader').bind('click', restclient.main.oauthSign);
  },
  /*oauthAuthorize: function () {
    var authorize_consumer_key      = $('#get-access-token [name="consumer_key"]'),
        authorize_consumer_secret   = $('#get-access-token [name="consumer_secret"]'),
        authorize_request_token_url = $('#get-access-token [name="request_token_url"]'),
        authorize_authorize_url     = $('#get-access-token [name="authorize_url"]'),
        authorize_access_token_url  = $('#get-access-token [name="access_token_url"]'),
        authorize_callback_url      = $('#get-access-token [name="callback_url"]'),
        authorize_remember          = $('#get-access-token [name="remember"]'),
        oauth_signature_method      = $('#oauth_signature_method'),
        oauth_version               = $('#oauth_version'),
        oauth_nonce                 = $('#oauth_nonce'),
        oauth_timestamp             = $('#oauth_timestamp'),
        authorize_okay              = $('#get-access-token .btnOkay'),
        errors = [];

    if (authorize_consumer_key.val() == '') {
      authorize_consumer_key.parents('.control-group').addClass('error');
      errors.push(authorize_consumer_key);
    }

    if (authorize_consumer_secret.val() == '') {
      authorize_consumer_secret.parents('.control-group').addClass('error');
      errors.push(authorize_consumer_secret);
    }

    if (authorize_request_token_url.val() == '') {
      authorize_request_token_url.parents('.control-group').addClass('error');
      errors.push(authorize_request_token_url);
    }

    if (authorize_authorize_url.val() == '') {
      authorize_authorize_url.parents('.control-group').addClass('error');
      errors.push(authorize_authorize_url);
    }

    if (authorize_access_token_url.val() == '') {
      authorize_access_token_url.parents('.control-group').addClass('error');
      errors.push(authorize_access_token_url);
    }

    if (errors.length > 0) {
      var el = errors.shift();
      el.focus();
      //console.error(el);
      return false;
    }

    authorize_okay.button('loading');
    if (authorize_remember.attr('checked') == 'checked') {
      var setting = {
        consumer_key      : authorize_consumer_key.val(),
        consumer_secret   : authorize_consumer_secret.val(),
        request_token_url : authorize_request_token_url.val(),
        authorize_url     : authorize_authorize_url.val(),
        access_token_url  : authorize_access_token_url.val(),
        callback_url      : authorize_callback_url.val(),
        remember          : true
      };
      //restclient.log(setting);
      restclient.setPref('OAuth.authorize', JSON.stringify(setting));
    }
    else
      restclient.setPref('OAuth.authorize', '');

    var secrets = {
      consumer_key: authorize_consumer_key.val(),
      consumer_secret: authorize_consumer_secret.val()
    };

    var parameters = {
      oauth_version: oauth_version.val(),
      oauth_signature_method: oauth_signature_method.val()
    };
    (oauth_nonce.val() == '') ? null : parameters.oauth_nonce = oauth_nonce.val();
    (oauth_timestamp.val() == '') ? null : parameters.oauth_timestamp = oauth_timestamp.val();

    //restclient.log(secrets);
    //restclient.log(parameters);

    var signature = restclient.oauth.sign({
      action: 'GET',
      path: authorize_request_token_url.val(),
      signatures: secrets,
      parameters: parameters
    });

    $('#window-oauth').hide();
    var message = restclient.message.show({
      id: 'alert-oauth-authorize',
      type: 'message',
      title: 'Start to do OAuth authorize',
      message: 'Try to getting a request Token from: ',
      buttons: [
        {title: 'Close', class: 'btn-danger', callback: function () { $('#alert-oauth-authorize').alert('close'); }}
      ],
      closed: function () { $('#window-oauth').show(); }
    });

    restclient.message.appendCode(message,signature.signed_url);

    var oauth_token, oauth_token_secret;
    $.ajax({
      url: signature.signed_url,
      action: 'GET',
      async: false,
      success: function (data, textStatus, jqXHR) {
        //restclient.log(data);
        var params = restclient.oauth.parseParameterString(data);
        if (typeof params['oauth_token'] != 'undefined')
          oauth_token = params['oauth_token'];
        if (typeof params['oauth_token_secret'] != 'undefined')
          oauth_token_secret = params['oauth_token_secret'];
        restclient.message.appendMessage(message,'Get result:');
        restclient.message.appendCode(message,data);
      },
      error: function () {

      }
    });
    if (!oauth_token || !oauth_token_secret)
    {
      restclient.message.appendMessage(message,'Unable to parse oauth_token or oauth_token_secret from request token url response.');
      authorize_okay.button('reset');
      return false;
    }

    secrets.oauth_token = oauth_token;
    secrets.oauth_token_secret = oauth_token_secret;
    parameters['oauth_callback'] = authorize_callback_url.val();
    restclient.oauth.reset();
    signature = restclient.oauth.sign({
      action: 'GET',
      path: authorize_authorize_url.val(),
      signatures: secrets,
      parameters: parameters
    });

    restclient.message.appendButton(message,{title: 'Open authorize page for authorize your key', href: signature.signed_url});
    //restclient.log(signature);
    authorize_okay.button('reset');
  },*/
  oauthSign: function () {
    var sign_consumer_key         = $('#signature-request [name="consumer_key"]'),
        sign_consumer_secret      = $('#signature-request [name="consumer_secret"]'),
        sign_access_token         = $('#signature-request [name="access_token"]'),
        sign_access_token_secret  = $('#signature-request [name="access_token_secret"]'),
        sign_remember             = $('#signature-request [name="remember"]'),

        auto_oauth_timestamp      = $('#oauth-setting [name="auto_oauth_timestamp"]'),
        oauth_timestamp           = $('#oauth-setting [name="oauth_timestamp"]'),
        auto_oauth_nonce          = $('#oauth-setting [name="auto_oauth_nonce"]'),
        oauth_nonce               = $('#oauth-setting [name="oauth_nonce"]'),
        oauth_signature_method    = $('#oauth-setting [name="oauth_signature_method"]'),
        oauth_version             = $('#oauth-setting [name="oauth_version"]'),
        auto_oauth_realm          = $('#oauth-setting [name="auto_oauth_realm"]'),
        oauth_realm               = $('#oauth-setting [name="oauth_realm"]'),
        disable_oauth_realm       = $('#oauth-setting [name="disable_oauth_realm"]'),
            
        sign_okay                 = $('#signature-request .btnOkay'),

        errors = [];

    if (sign_consumer_key.val() == '') {
      sign_consumer_key.parents('.control-group').addClass('error');
      errors.push(sign_consumer_key);
    }

    if (sign_consumer_secret.val() == '') {
      sign_consumer_secret.parents('.control-group').addClass('error');
      errors.push(sign_consumer_secret);
    }

    if (errors.length > 0) {
      var el = errors.shift();
      el.focus();
      //console.error(el);
      return false;
    }
    else
    {
      $('#signature-request .control-group').removeClass('error');
      $('#signature-request .error-info').hide();
    }

    sign_okay.button('loading');
    
    if (sign_remember.attr('checked') == 'checked') {
      var setting = {
        consumer_key        : sign_consumer_key.val(),
        consumer_secret     : sign_consumer_secret.val(),
        access_token        : sign_access_token.val(),
        access_token_secret : sign_access_token_secret.val(),
        remember            : true
      };
      restclient.setPref('OAuth.sign', JSON.stringify(setting));
    }
    else
      restclient.setPref('OAuth.sign', '');

    var secrets = {
      consumer_key        : sign_consumer_key.val(),
      consumer_secret     : sign_consumer_secret.val(),
      access_token        : sign_access_token.val(),
      access_secret       : sign_access_token_secret.val()
    };

    var parameters = {
      oauth_version: oauth_version.val(),
      oauth_signature_method: oauth_signature_method.val()
    };
    
    (oauth_nonce.val() === '') ? null : parameters.oauth_nonce = oauth_nonce.val();
    (oauth_timestamp.val() === '') ? null : parameters.oauth_timestamp = oauth_timestamp.val();

    //restclient.log(secrets);
    //restclient.log(parameters);
    restclient.oauth.reset();
    var requestUrl = $.trim($('#request-url').val()),
        requestMethod = $.trim($('#request-method').val()),
        requestBody = $('#request-body').val(),
        param = parameters;

    if (requestUrl !== '') {
      var paths = restclient.helper.parseUrl(requestUrl);
      if (typeof paths['search'] === 'string')
      {
        var queryString = paths['search'].substring(1);
        $.extend(parameters, restclient.oauth.parseParameterString(queryString));
      }
      requestUrl = paths['hrefNoSearch'];
    }

    if (["put", "post"].indexOf(requestMethod.toLowerCase()) > -1) {
      if (requestBody != '' && requestBody.indexOf('=') > -1) {
        param = $.extend(parameters, restclient.oauth.parseParameterString(requestBody));
      }
    }

    var sign = {
      action: requestMethod,
      path: requestUrl,
      signatures: secrets,
      parameters: param
    };
    if (disable_oauth_realm.attr('checked') !== 'checked') {
      if(auto_oauth_realm.attr('checked') === 'checked')
        sign.realm = requestUrl;
      else
        sign.realm = oauth_realm.val();
    }
    
    var signature = restclient.oauth.sign(sign),
        headerValue = signature.headerString,
        param       = {'oauth-parameters': JSON.stringify(parameters), 'oauth-secrets': JSON.stringify(secrets)};
        
    if (disable_oauth_realm.attr('checked') !== 'checked') {
      if(auto_oauth_realm.attr('checked') === 'checked')
        param['auto-realm'] = true;
      else
        param.realm = oauth_realm.val();
    }

    var headerId = restclient.main.addHttpRequestHeader('Authorization', headerValue, param);
    //restclient.log('header id of oauth header: ' + headerId);
    $('#window-oauth').css('display', 'none');

    if (restclient.getPref('sign-warning', '') == '')
      var message = restclient.message.show({
        id: 'alert-oauth-sign',
        type: 'warning',
        class: 'span5 offset3',
        title: 'Notice',
        message: 'Do you want RESTClient to refresh OAuth signature before sending your request?',
        buttons: [
          [
            {title: 'Yes, please', class: 'btn-danger', callback: function () { restclient.main.setOAuthAutoRefresh(headerId, true); $('#alert-oauth-sign').alert('close'); }},
            {title: 'Yes, and please remember my descision', callback: function () { restclient.main.setOAuthAutoRefresh(headerId, true); restclient.setPref('OAuth.refresh', "yes");  restclient.setPref('sign-warning', 'false'); $('#alert-oauth-sign').alert('close');}}
          ],
          [
            {title: 'No, thanks', class: 'btn-warning', callback: function () { restclient.main.setOAuthAutoRefresh(headerId, false); $('#alert-oauth-sign').alert('close'); }},
            {title: 'No, and please don\'t remind me again', callback: function () { restclient.main.setOAuthAutoRefresh(headerId, false); restclient.setPref('OAuth.refresh', "no"); restclient.setPref('sign-warning', 'false'); $('#alert-oauth-sign').alert('close'); }}
          ]
        ]
      });
    else
    {
      var autoRefresh = restclient.getPref('OAuth.refresh', "yes");
      restclient.main.setOAuthAutoRefresh(headerId, (autoRefresh === 'yes'));
    }
  },
  setOAuthAutoRefresh: function (headerId, auto) {
    $('[data-header-id="' + headerId + '"]').attr('auto-refresh', (auto) ? "yes" : "no");
  },
  updateOAuthSign: function (headerId) {
    try {
      restclient.log('.tag span[data-header-id="' + headerId + '"]');
      
      var headerSpan      = $('.tag span[data-header-id="' + headerId + '"]'),
          secrets         = JSON.parse(headerSpan.attr('oauth-secrets')),
          parameters      = JSON.parse(headerSpan.attr('oauth-parameters')),
          oauth_realm     = headerSpan.attr('realm'),
          auto_realm      = (typeof headerSpan.attr('auto-realm') === 'string') ? JSON.parse(headerSpan.attr('auto-realm')) : false;
          
      restclient.log('[updateOAuthSign] headerId: ' + headerId);
      restclient.log('[updateOAuthSign] oauth_realm: ' + oauth_realm);
      
      var requestMethod = $.trim($('#request-method').val()),
          requestUrl    = $.trim($('#request-url').val()),
          requestBody   = $('#request-body').val();
      
      restclient.oauth.reset();
      var param = parameters;
      
      if (requestUrl !== '') {
        var paths = restclient.helper.parseUrl(requestUrl);
        if (typeof paths['search'] === 'string')
        {
          var queryString = paths['search'].substring(1);
          $.extend(parameters, restclient.oauth.parseParameterString(queryString));
        }
        requestUrl = paths['hrefNoSearch'];
      }
      
      if (["put", "post"].indexOf(requestMethod.toLowerCase()) > -1) {
        var requestBody = $('#request-body').val();
        if (requestBody != '' && requestBody.indexOf('=') > -1) {
          var p = restclient.oauth.parseParameterString(requestBody);
          param = $.extend(parameters, p);
        }
      }
      
      var sign = {
                  action: requestMethod,
                  path: requestUrl,
                  signatures: secrets,
                  parameters: param
                 };
      if (auto_realm === true)
        sign.realm = requestUrl;
      else
        if (typeof oauth_realm === 'string')
          sign.realm = oauth_realm;
      
      restclient.log(sign);
      var signature = restclient.oauth.sign(sign);
      restclient.log(signature);
      var headerValue = signature.headerString,
          param       = {"oauth-secrets": secrets, "oauth-parameters": parameters};
      
      if (auto_realm === true)
        param.realm = true;
      else
        if (typeof oauth_realm === 'string')
          param.realm = oauth_realm;

      restclient.log('[updateOAuthSign] header Id: ' + headerId);
      restclient.log('[updateOAuthSign] headerValue: ' + headerValue);
      restclient.log(param);
      return this.replaceHttpRequestHeader(headerId, 'Authorization', headerValue, param);
    } catch(e) {
      restclient.error(e);
      restclient.error('updateOAuthSign');
    }
  },
  sendRequest: function () {
    $('.popover').removeClass('in').remove();
    if ( $('[auto-refresh="yes"]').length > 0)
    {
      var id = $('span[auto-refresh="yes"]').attr('data-header-id');
      restclient.main.updateOAuthSign(id);
      //restclient.log('resigned');
    }
    var request = restclient.main.getRequest();
    if (!restclient.helper.validateUrl(request.url))
    {
      restclient.message.show({
        id: 'alertInvalidRequestUrl',
        type: 'error',
        title: 'The request URL is invalidate',
        message: 'Please check your request URL!',
        buttons: [
          {title: 'Okay', class: 'btn-danger', callback: function () { $('#request-url').focus().select(); $('#alertInvalidRequestUrl').alert('close');  }}
        ],
        parent: $('#request-error'),
        exclude: true
      });
      return false;
    }
    restclient.http.sendRequest(request.method, request.url, request.headers, request.overrideMimeType, request.body);
  },
  donate: function () {
    $('#paypal_donate').submit();
  },
  setRequestUrl: function (url) {
    var currentUrl = $("#request-url").val();

    if (restclient.helper.isAbsoluteUrl(url))
      $("#request-url").val(url);
    else
      $("#request-url").val(restclient.helper.makeUrlAbsolute(url, currentUrl));
  },
  showStatus: function(text, type) {
    type = type || 'message';
    $('#alert-status-text').remove();
    var message = restclient.message.show({
      id: 'alert-status-text',
      parent: $('body'),
      exclude: false,
      type: type,
      timeout: 5000,
      animate: 'bounce',
      title: text
    });
  }
};

//window.addEventListener("load", function () { restclient.main.init();  }, false);
//window.addEventListener("unload", function () { }, false);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

This script is based on oAuthSimple (http://github.com/jrconlin/oauthsimple).

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.oauth = {
  _nonceRange : "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  reset: function() {
    delete this._parameters;
    delete this._path;
    delete this._secret;
    delete this._realm;
  },
  sign: function(arg) {
    //restclient.log(arg);
    if(arg.action)
      this.setAction(arg.action);
    if(arg.signatures)
      this.setSignatures(arg.signatures);
    if(arg.parameters)
      this.setParameters(arg.parameters);
    if(arg.path)
      this.setPath(arg.path);
    if(typeof arg.realm !== 'undefined')
      this._realm = arg.realm;

    var normParams = this.normalizeToString();
    //restclient.log(normParams);
    var oauth_signature = this.generateSignature(normParams);
    //console.error(oauth_signature);
    this._parameters['oauth_signature'] = oauth_signature;

    return {
        parameters: this._parameters,
        signature: this.oauthEscape(oauth_signature),
        signed_url: this._path + '?' + this.normalizeToString(),
        headerString: this.getHeaderString()
    };
  },
  setAction: function(action) {
    if (typeof action === "undefined") {
        action="GET";
    }
    action = action.toUpperCase();
    if (action.match('[^A-Z]')) {
        throw ('Invalid action specified for restclient.oauth.setAction');
    }
    this._action = action;
    return this;
  },
  setPath: function(path) {
    if (path == '') {
      throw ('path is empty for restclient.oauth.setPath');
    }
    this._path = path;
    return this;
  },
  setSignatureMethod: function(method) {
    method = (typeof method === 'undefined') ? 'PLAINTEXT' : method.toUpperCase();
    if (typeof method.match(/(PLAINTEXT|HMAC-SHA1)/) === 'undefined') {
        throw ('Signing method [' + method + '] is unsupported for restclient.oauth.setSignatureMethod');
    }
    if (!this._parameters)
      this._parameters = {};
    this._parameters['oauth_signature_method'] = method;
    return this;
  },
  setSignatures: function(signatures) {
    if(!this._secrets)
      this._secrets = {};

    if(signatures.consumer_key)
      this._secrets.consumer_key = signatures.consumer_key;
    else
      throw('Missing required consumer_key in resclient.oauth.setSignatures');

    if(signatures.consumer_secret)
      this._secrets.consumer_secret = signatures.consumer_secret;
    else
      throw('Missing required consumer_secret in resclient.oauth.setSignatures');

    if(signatures.access_token)
      this._secrets.oauth_token = signatures.access_token;

    if(signatures.access_secret)
      this._secrets.oauth_secret = signatures.access_secret;

    if(signatures.oauth_token)
      this._secrets.oauth_token = signatures.oauth_token;

    if(signatures.oauth_token_secret)
      this._secrets.oauth_secret = signatures.oauth_token_secret;

    if(typeof signatures.oauth_token == 'string' && typeof this._secrets.oauth_secret == 'undefined')
      throw('Missing required oauth_secret in resclient.oauth.setSignatures');
  },
  setConsumerKey: function() {
    if (!this._secrets['consumer_key'])
        throw('No consumer_key set for restclient.oauth.setConsumerKey');

    return this._parameters['oauth_consumer_key'] = this._secrets.consumer_key;
  },
  setAccessToken: function() {
    if (!this._secrets['oauth_secret'])
        return '';

    if (!this._secrets['oauth_token'])
        throw('No oauth_token (access_token) set for restclient.oauth.setAccessToken');
    return this._parameters['oauth_token'] = this._secrets.oauth_token;
  },
  setParameters: function(p) {
    if (!p) p = {};
    if (!this._parameters)
      this._parameters = {};

    $.extend(this._parameters, p);
    if (!p['oauth_nonce'])
      this._parameters.oauth_nonce = this.getNonce();

    if (!p['oauth_timestamp'])
      this._parameters.oauth_timestamp = this.getTimeStamp();

    if (!p['oauth_version'])
      this._parameters.oauth_version = '1.0';

    if (!p['oauth_signature_method'])
      this.setSignatureMethod();

    if (!p['oauth_consumer_key'])
        this.setConsumerKey();

    if(!p['oauth_token'])
        this.setAccessToken();
  },
  generateSignature: function(str){
    var consumer_secret = this._secrets['consumer_secret'],
        oauth_secret = this._secrets['oauth_secret'],
        encrypt = this._parameters['oauth_signature_method'] || 'PLAINTEXT';

    var secretKey = restclient.oauth.oauthEscape(consumer_secret) + '&' +
        restclient.oauth.oauthEscape(oauth_secret);
    if (encrypt == 'PLAINTEXT')
    {
      return secretKey;
    }
    if (encrypt == 'HMAC-SHA1')
    {
      //restclient.log(this._parameters);
      //restclient.log(str);
      var toSign = restclient.oauth.oauthEscape(this._action)
                        + '&' + restclient.oauth.oauthEscape(this._path)
                        + '&' + restclient.oauth.oauthEscape(str);
      //restclient.log(toSign);
      //restclient.log(secretKey);
      return this.b64_hmac_sha1(secretKey, toSign);
    }
    return null;
  },
  normalizeToString: function(parameters) {
    parameters = parameters || this._parameters;
    //restclient.log(parameters);
    var names = [], result = [];
    for(var n in parameters) {
      if(!parameters.hasOwnProperty(n))
        continue;

      names.push(n);
    }
    names = names.sort();

    for(var i=0, n; n = names[i]; i++) {
      //restclient.log(n);
      if(n.match(/\w+_secret/))
        continue;
      //restclient.log(n);
      if(Object.prototype.toString.call(parameters[n]) == '[object Array]')
      {
        var sorted = parameters[n].sort();
        for(var j=0, s; s = sorted[j]; j++) {
          result.push(
            restclient.oauth.oauthEscape(n) + "=" + restclient.oauth.oauthEscape(s)
          );
        }
        continue;
      }

      result.push(
        restclient.oauth.oauthEscape(n) + "=" + restclient.oauth.oauthEscape(parameters[n])
      );
    }

    return result.join('&');
  },
  oauthEscape: function(obj) {
    if (typeof obj === 'undefined') {
      return "";
    }
    if (obj instanceof Array)
    {
      throw('Array passed to restclient.main.oauthEscape: ' + JSON.stringify(obj));
    }
    return encodeURIComponent(obj).replace(/\!/g, "%21")
                                  .replace(/\*/g, "%2A")
                                  .replace(/'/g, "%27")
                                  .replace(/\(/g, "%28")
                                  .replace(/\)/g, "%29");
  },
  getTimeStamp: function() {
    return Math.floor(new Date().getTime()/1000);
  },
  getNonce: function(len) {
    if( typeof len === 'undefined') {
      len = 15;
    }

    var result = "";
    for (var i = 0; i < len; ++i) {
        var rnum = Math.floor(Math.random() * restclient.oauth._nonceRange.length);
        result += restclient.oauth._nonceRange.substring(rnum, rnum+1);
    }
    return result;
  },
  b64_hmac_sha1: function(k,d,_p,_z){
    // heavily optimized and compressed version of http://pajhome.org.uk/crypt/md5/sha1.js
    // _p = b64pad, _z = character size; not used here but I left them available just in case
    if(!_p){_p='=';}if(!_z){_z=8;}function _f(t,b,c,d){if(t<20){return(b&c)|((~b)&d);}if(t<40){return b^c^d;}if(t<60){return(b&c)|(b&d)|(c&d);}return b^c^d;}function _k(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}function _s(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}function _r(n,c){return(n<<c)|(n>>>(32-c));}function _c(x,l){x[l>>5]|=0x80<<(24-l%32);x[((l+64>>9)<<4)+15]=l;var w=[80],a=1732584193,b=-271733879,c=-1732584194,d=271733878,e=-1009589776;for(var i=0;i<x.length;i+=16){var o=a,p=b,q=c,r=d,s=e;for(var j=0;j<80;j++){if(j<16){w[j]=x[i+j];}else{w[j]=_r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}var t=_s(_s(_r(a,5),_f(j,b,c,d)),_s(_s(e,w[j]),_k(j)));e=d;d=c;c=_r(b,30);b=a;a=t;}a=_s(a,o);b=_s(b,p);c=_s(c,q);d=_s(d,r);e=_s(e,s);}return[a,b,c,d,e];}function _b(s){var b=[],m=(1<<_z)-1;for(var i=0;i<s.length*_z;i+=_z){b[i>>5]|=(s.charCodeAt(i/8)&m)<<(32-_z-i%32);}return b;}function _h(k,d){var b=_b(k);if(b.length>16){b=_c(b,k.length*_z);}var p=[16],o=[16];for(var i=0;i<16;i++){p[i]=b[i]^0x36363636;o[i]=b[i]^0x5C5C5C5C;}var h=_c(p.concat(_b(d)),512+d.length*_z);return _c(o.concat(h),512+160);}function _n(b){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s='';for(var i=0;i<b.length*4;i+=3){var r=(((b[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((b[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((b[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++){if(i*8+j*6>b.length*32){s+=_p;}else{s+=t.charAt((r>>6*(3-j))&0x3F);}}}return s;}function _x(k,d){return _n(_h(k,d));}return _x(k,d);
  },
  parseParameterString: function(paramString){
    var elements = paramString.split('&'),
        result={},
        element;
    for(var element = elements.shift(); element; element = elements.shift())
    {
        var keyToken = element.split('='),
            value = '';
        if (keyToken[1]) {
          value=decodeURIComponent(keyToken[1]);
        }
        if(result[keyToken[0]]) {
          if (!(result[keyToken[0]] instanceof Array))
          {
            result[keyToken[0]] = Array(result[keyToken[0]],value);
          }
          else
          {
            result[keyToken[0]].push(value);
          }
        }
        else
        {
          result[keyToken[0]]=value;
        }
    }
    return result;
  },
  getHeaderString: function() {
    var j,pName,pLength,result = 'OAuth ';
    if (typeof this._realm === 'string')
      result += 'realm="'+this.oauthEscape(this._realm)+'", ';

    for (pName in this._parameters)
    {
      if (!pName.match(/^oauth/)) {
        continue;
      }

      if ((this._parameters[pName]) instanceof Array)
      {
        pLength = this._parameters[pName].length;
        for (j=0;j<pLength;j++)
        {
          result += pName +'="'+this.oauthEscape(this._parameters[pName][j])+'", ';
        }
      }
      else
      {
        result += pName + '="'+this.oauthEscape(this._parameters[pName])+'", ';
      }
    }

    return result.replace(/,\s+$/, '');
  }
}

///////////////////////////////////////////////////////////////////////////////////////

/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.headers = {
  "Accept": ["text/plain", "text/html", "image/jpeg"],
  "Accept-Charset": ["iso-8859-5", "utf-8"],
  "Accept-Encoding": ["gzip", "compress"],
  "Accept-Language": ["en-US"],
  "Cache-Control": ["no-cache"],
  "Connection": ["close"],
  "Content-Length": [],
  "Content-Type": ["application/x-www-form-urlencoded", "text/plain", "text/html", "application/json"],
  "Expect": ["100-continue"],
  "If-Match": [],
  "If-Modified-Since": [],
  "If-None-Match": [],
  "If-Range": [],
  "If-Unmodified-Since": [],
  "Max-Forwards": [],
  "Pragma": ["no-cache"],
  "Range": [],
  "Referer": [],
  "User-Agent": ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.21 (KHTML, like Gecko) Chrome/19.0.1042.0 Safari/535.21", "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"],
  "Via": [],
  "X-Requested-With": ["XMLHttpRequest"],
  "X-Do-Not-Track": [1],
  "DNT": []
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////


/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.message = {
  show: function(arg) {
    //restclient.log(arg);
    var container = $('<div class="alert alert-block fade in"></div>'),
        id = (arg.id) ? arg.id : (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    container.attr('id', id);
    if(arg.class)
      container.addClass(arg.class);

    if(arg.type)
      container.addClass('alert-' + arg.type);
    container.append($('<a class="close" data-dismiss="alert" href="#"></a>').text('x'));

    if(arg.title)
      container.append($('<h4 class="alert-heading" style="margin-bottom: 10px; font-size: 120%;"></h4>').text(arg.title));

    if(typeof arg.message == 'string')
      container.append($('<p style="font-size: 110%;"></p>').text(arg.message));

    if(typeof arg.message == 'object' && arg.message.length > 0)
      for(var i=0, m; m = arg.message[i]; i++)
        container.append($('<p style="font-size: 110%;"></p>').text(m));

    if(arg.buttons){
      var p = $('<div class="btn-toolbar" style="margin-top: 15px; margin-bottom:0px; text-align:right;"></div>');
      for(var i=0, button; button = arg.buttons[i]; i++) {
        if(button instanceof Array)
        {
          var b = $('<div class="btn-group" style="margin-right: 5px;"></div>');
          b.append($('<button class="btn"></button>').addClass(button[0].class).text(button[0].title).bind('click', button[0].callback));
          b.append($('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>').addClass(button[0].class));
          var ul = $('<ul class="dropdown-menu pull-right"></ul>');
          for(var j=1, but; but = button[j]; j++)
          {
            ul.append($('<li></li>').append($('<a href="#"></a>').text(but.title).bind('click', but.callback)));
          }
          b.append(ul);
          p.append(b);
        }
        else
        {
          var b = $('<button class="btn" style="margin-top: -20px;margin-right: 5px;"></button>');
          b.text(button.title);
          if(button.class)
            b.addClass(button.class);
          if(button.callback)
            b.bind('click', button.callback);
          if(button.timeout)
            b.timedExecute(button.timeout, function() { b.click(); });
          p.append(b);
        }
      }
      container.append(p);
    }
    //restclient.log(container);
    
    if(arg.parent)
    {
      if(arg.exclude === true)
        arg.parent.find('.alert').alert('close').remove();
      
      if(arg.prepend)
        container.prependTo(arg.parent);
      else
        container.appendTo(arg.parent);
    }
    else{
      $('.messages-overlay').show();
      container.appendTo('.messages-overlay .container');
      $('#' + id).bind('closed', function () {
        if($('.messages-overlay .container').find('.alert').length == 1) {
          $('.messages-overlay').hide();
        }

        if(typeof arg.closed == 'function')
          arg.closed.apply(restclient.main, []);
      });
    }
    
    if(typeof arg.timeout === 'number') {
      setTimeout(function(){ container.hide(); }, arg.timeout);
    }
    var animate = arg.animate || 'shake';
    container.addClass('animated ' + animate);
    return container;
  },

  appendMessage: function(alert, message) {
    alert.find('p:last').after($('<p></p>').text(message));
  },

  appendCode: function(alert, code) {
    alert.find('p:last').after($('<p></p>').append($('<pre></pre>').text(code)));
  },

  appendButton: function(alert, button) {
    var p = $('<p></p>'),
        b = $('<a class="btn" style="margin: 5px 5px;"></a>');
    b.text(button.title);
    if(button.class)
      b.addClass(button.class);
    if(button.callback)
      b.bind('click', button.callback);

    if(button.href)
      b.attr('href', button.href).attr('target', '_blank');

    p.append(b);
    alert.find('p:last').after(p);
  }
}

/*$.fn.timedExecute = function(time, callback) {
  time = time || 3000;
  var seconds = Math.ceil(time / 1000);  // Calculate the number of seconds
  return $(this).each(function() {
    var disabledElem = $(this);
    $(this).data('original-text', $(this).text());
    $(this).text( $(this).text() + ' (' + seconds + ')'); 
    $(this).data('countdown-seconds', seconds);
    
    var interval = setInterval(function() {
      var seconds = disabledElem.data('countdown-seconds'),
          originalText = disabledElem.data('original-text');
      seconds--;
      disabledElem.data('countdown-seconds', seconds);
      disabledElem.text( originalText + ' (' + seconds + ')');  
      if (seconds === 0) {  // once seconds is 0...
        disabledElem.text(originalText);   //reset to original text
        clearInterval(interval);  // clear interval
        if (typeof callback === 'function')
          callback.apply(restclient.main, []);
      }
    }, 1000);
    
  });
};*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.helper = {
  //URL parse function and makeUrlAbosulte function are copied from jQuery Mobile
  // http://jquerymobile.com/
  urlParseRE: /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,
  //Parse a URL into a structure that allows easy access to
  //all of the URL components by name.
  parseUrl: function( url ) {
    // If we're passed an object, we'll assume that it is
    // a parsed url object and just return it back to the caller.
    if ( $.type( url ) === "object" ) {
      return url;
    }

    var matches = this.urlParseRE.exec( url || "" ) || [];

      // Create an object that allows the caller to access the sub-matches
      // by name. Note that IE returns an empty string instead of undefined,
      // like all other browsers do, so we normalize everything so its consistent
      // no matter what browser we're running on.
      return {
        href:         matches[  0 ] || "",
        hrefNoHash:   matches[  1 ] || "",
        hrefNoSearch: matches[  2 ] || "",
        domain:       matches[  3 ] || "",
        protocol:     matches[  4 ] || "",
        doubleSlash:  matches[  5 ] || "",
        authority:    matches[  6 ] || "",
        username:     matches[  8 ] || "",
        password:     matches[  9 ] || "",
        host:         matches[ 10 ] || "",
        hostname:     matches[ 11 ] || "",
        port:         matches[ 12 ] || "",
        pathname:     matches[ 13 ] || "",
        directory:    matches[ 14 ] || "",
        filename:     matches[ 15 ] || "",
        search:       matches[ 16 ] || "",
        hash:         matches[ 17 ] || "",
        scheme:       (typeof matches[4] == "string" && matches[4].indexOf(':') > -1) ? matches[4].substr(0, matches[4].indexOf(':')) : ""
      };
  },
  //Returns true for any relative variant.
    isRelativeUrl: function( url ) {
        // All relative Url variants have one thing in common, no protocol.
        return this.parseUrl( url ).protocol === "";
    },
    //Returns true for an absolute url.
    isAbsoluteUrl: function( url ) {
        return this.parseUrl( url ).protocol !== "";
    },
    //Turn relPath into an asbolute path. absPath is
    //an optional absolute path which describes what
    //relPath is relative to.
    makePathAbsolute: function( relPath, absPath ) {
        if ( relPath && relPath.charAt( 0 ) === "/" ) {
            return relPath;
        }

        relPath = relPath || "";
        absPath = absPath ? absPath.replace( /^\/|(\/[^\/]*|[^\/]+)$/g, "" ) : "";

        var absStack = absPath ? absPath.split( "/" ) : [],
            relStack = relPath.split( "/" );
        for ( var i = 0; i < relStack.length; i++ ) {
            var d = relStack[ i ];
            switch ( d ) {
                case ".":
                    break;
                case "..":
                    if ( absStack.length ) {
                        absStack.pop();
                    }
                    break;
                default:
                    absStack.push( d );
                    break;
            }
        }
        return "/" + absStack.join( "/" );
    },

    //Turn the specified realtive URL into an absolute one. This function
    //can handle all relative variants (protocol, site, document, query, fragment).
    makeUrlAbsolute: function( relUrl, absUrl ) {
        if ( !this.isRelativeUrl( relUrl ) ) {
            return relUrl;
        }

        var relObj = this.parseUrl( relUrl ),
            absObj = this.parseUrl( absUrl ),
            protocol = relObj.protocol || absObj.protocol,
            doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
            authority = relObj.authority || absObj.authority,
            hasPath = relObj.pathname !== "",
            pathname = this.makePathAbsolute( relObj.pathname || absObj.filename, absObj.pathname ),
            search = relObj.search || ( !hasPath && absObj.search ) || "",
            hash = relObj.hash;

        return protocol + doubleSlash + authority + pathname + search + hash;
    },
    setParam: function(url, name, value) {
      if ( !this.isAbsoluteUrl( url ) ) {
            return url;
        }
        var parts = this.parseUrl(url);
        var search = "?" + name + "=" + value;
        if (parts.search)
        {
          search = parts.search.substr(1);
          restclient.log(search);
          var found = false;
          var elements = search.split('&');
          for (var i=0, element; element = elements[i]; i++) {
            var keyToken = element.split('=');
            if(keyToken[0] === name) {
              elements[i] = name + "=" + value;
              found = true;
              break;
            }
          }
          if (!found)
            elements.push(name + "=" + value);
          
          search = "?" + elements.join('&');
        }
        
        return parts.protocol + parts.doubleSlash + parts.authority + parts.pathname + search;
    },
    validateUrl: function (url) {
    return this.isAbsoluteUrl(url);
  },
  sha1: function(str) {
    var converter =
      Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

    converter.charset = "UTF-8";
    var result = {};
    var data = converter.convertToByteArray(str, result);
    var ch = Components.classes["@mozilla.org/security/hash;1"]
                       .createInstance(Components.interfaces.nsICryptoHash);
    ch.init(ch.SHA1);
    ch.update(data, data.length);
    var hash = ch.finish(false);


    // return the two-digit hexadecimal code for a byte
    function toHexString(charCode)
    {
      return ("0" + charCode.toString(16)).slice(-2);
    }

    // convert the binary hash data to a hex string.
    var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");

    return s;
  }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.http = {
  mimeType : false,
  methods: ['GET','POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'],
  sendRequest: function(requestMethod, requestUrl, requestHeaders, mimeType, requestBody) {
    try{
      restclient.main.updateProgressBar(100);
      restclient.main.showResponse();
      restclient.http.mimeType = mimeType;
      //restclient.log(requestMethod);
      var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
      xhr.onerror = restclient.http.onerror;
      xhr.onload = restclient.http.onload;
      xhr.onprogress = restclient.http.onprogress;
      
      xhr.open(requestMethod, requestUrl, true);
      xhr.setRequestHeader("Accept-Language", null);

      for(var i=0, header; header = requestHeaders[i]; i++) {
        xhr.setRequestHeader(header[0], header[1]);
        
        //Override XMLHTTPRequest default charset
        if(typeof mimeType != 'string' && 
            header[0].toLowerCase() == 'content-type' && header[1].toLowerCase().indexOf('charset') > -1)
        {
          xhr.overrideMimeType(header[1]);
        }
      }

      if(typeof mimeType == 'string')
        xhr.overrideMimeType(mimeType);

      restclient.http.xhr = xhr;
      if(restclient.getPref('requestTimer', false) === true)
        restclient.http.startTime = new Date().getTime();
      else
        restclient.http.startTime = false;
        
      xhr.send(requestBody);
    } catch (e) {
      restclient.main.setResponseHeader({"Error": [
                                                  "Could not connect to server",
                                                  e.message
                                                  ]}, false);
      restclient.main.updateProgressBar(-1);
    }
  },
  onprogress: function(evt) {
    //restclient.log(evt.position * 100 / evt.totalSize + "," + evt.position + "," + evt.totalSize);
    var percentComplete = evt.position * 100 / evt.totalSize;
    restclient.main.updateProgressBar(percentComplete, 'Receving data...');
    if(evt.position == evt.totalSize)
      restclient.main.updateProgressBar(-1, 'Sending data...');
  },
  onerror: function(xhr) {
    restclient.main.clearResult();
    restclient.main.updateProgressBar(-1);
    restclient.main.setResponseHeader({"Error": "Could not connect to server"}, false);
  },
  onload: function(xhr) {
    if(restclient.http.startTime)
    {
      var requestTime = (new Date().getTime()) - restclient.http.startTime;
      restclient.main.showStatus('Execute Time : ' + requestTime + 'ms')
    }
    restclient.main.clearResult();
    xhr = xhr.target;
    var headers = {};
    headers["Status Code"] = xhr.status + " " + xhr.statusText;

    var headersText     = xhr.getAllResponseHeaders(),
        responseHeaders = headersText.split("\n"),
        key, value;

    for (var i = 0, header; header = responseHeaders[i]; i++) {
      if(header.indexOf(":") > 0) {
        key   = header.substring(0, header.indexOf(":"));
        value = xhr.getResponseHeader(key);
        if(value)
          headers[key] = value;
      }
    }
    headers["Status Code"] = xhr.status + " " + xhr.statusText;
    //restclient.log(headers);
    
    restclient.main.setResponseHeader(headers);
    var contentType = xhr.getResponseHeader("Content-Type");

    var displayHandler = 'display';
    if(contentType && contentType != '') {
      if(contentType.indexOf('html') >= 0) {
        displayHandler = 'displayHtml';
      }
      if(contentType.indexOf('xml') >= 0) {
        displayHandler = 'displayXml';
      }
      if(contentType.indexOf('json') >= 0) {
        displayHandler = 'displayJson';
      }
      if(contentType.indexOf('image') >= 0) {
        if(restclient.http.mimeType === false)
          displayHandler = 'displayImageRaw';
        else
          displayHandler = 'displayImage';
      }
    }
    
    //restclient.log(displayHandler);
    //restclient.log(contentType);
    restclient.main.checkMimeType.apply(restclient.http, []);
    restclient.main[displayHandler].apply(restclient.http, []);
    
    restclient.main.updateProgressBar(-1);
  },
  abortRequest: function(){
    if(!restclient.http.xhr)
      return false;
    restclient.http.xhr.abort();
    restclient.main.clearResult();
    restclient.main.updateProgressBar(-1);
  }
}