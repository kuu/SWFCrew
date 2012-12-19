/**
 * @fileoverview This file defines the Ajax object.
 * @author Jason Parrott
 */

(function(global) {

  var theatre = global.theatre;
  var utils = theatre.crews.swf.utils;
  var PersistentCueListener = theatre.PersistentCueListener;

  /**
   * Functions for sending XMLHttpRequests (Ajax).
   * @namespace
   */
  var ajax = /** @lends utils.ajax# */ {
    /**
     * A RegExp you can use to parse an URL.
     * @type {RegExp}
     * @private
     */
    urlRegex: /^(?:([a-zA-Z]+:\/\/)((?:[^\/#]+\.?[^\/#]+)+?)?)?(\/?.*?)?(\?.*?)?(#.*)?$/,

    /**
     * Changes an object to a valid URL Query String.
     * @param {object} pParams The params to querify.
     * @param {string] [pQueryString] Optional already made query string to append to.
     * @return {string} The valid query string.
     * @private
     */
    queryify: function(pParams, pQueryString) {
      function join(pKey, pValue) {
        return global.encodeURIComponent(pKey) + '=' + global.encodeURIComponent(pValue);
      }

      var tResult = new Array();
      for (var k in pParams) {
        if (pParams.hasOwnProperty(k) === false) continue;
        var tParam = pParams[k];
        if (tParam.__proto__ === Array.prototype) {
          tParam.forEach(function(pPart) {
            tResult.push(join(k, pPart));
          });
        } else {
          tResult.push(join(k, tParam));
        }
      }

      var tQueryified = tResult.join('&').replace(/%20/g, '+');
      tResult = '';

      if (pQueryString !== void 0) {
        if (tQueryified === '') {
          return pQueryString;
        }
        tResult = pQueryString;
        if (pQueryString === '?') {
          tResult += tQueryified;
        } else {
          tResult += '&' + tQueryified;
        }
      } else {
        if (tQueryified === '') {
          return '';
        }
        tResult += '?' + tQueryified;
      }

      return tResult;
    },

    /**
     * Sends an Ajax request.
     * @param {string} pUrl URL to send to
     * @param {Object} [pOpts] An object with the following properties:<br>
     *      - method: {string} GET/POST<br>
     *      - headers: {object} An object with properties containing HTTP request header/value pairs.<br>
     *      - timeout: {number} timeout value in millisec<br>
     *      - queryData: {object} An object with properties containing URL parameters name/value pairs.<br>
     *      - overrideMimeType: {string} MIME type
     * @default pOpts={method: 'GET'}
     * @return {PersistentCueListener} A Delay object.<br>
     *    Clients are notified of the loaded event by setting a callback 
     *        via {@link PersistentCueListener#on}('success', callback) on the returned object.<br>
     *    Clients are notified of the error event by setting a callback 
     *        via {@link  PersistentCueListener#on}('error', callback) on the returned object.<br>
     *    Clients are notified of the progress events by setting a callback 
     *        via {@link PersistentCueListener#on}('progress', callback) on the returned object.<br>
     *    Each callback takes the following object as a single parameter:<br>
     *      - loaded:   An object with properties of {status, statusText, responseType, response, responseXML}<br>
     *      - error:    An object with properties of {event, options, xhr}<br>
     *      - progress: An object with properties of {percent, options, xhr}<br>
     * @see PersistentCueListener
     */
    send: function(pUrl, pOpts) {
      var tDelay = new PersistentCueListener(),
      tXhr = new XMLHttpRequest(),
      tMethod = (pOpts.method || 'GET').toUpperCase(),
      tHeaders = pOpts.headers || null,
      tTimeout = pOpts.timeout || null,
      tQueryData = pOpts.queryData || null,
      tFormData,
      tOverrideMimeType = pOpts.overrideMimeType || null;

      if (tMethod === 'POST' && tQueryData !== null) {
        if ('FormData' in global === false) {
          alert('Need to support old browsers for posting forms!');
        }
        tFormData = new FormData();
        for (var k in tQueryData) {
          tFormData.append(k, tQueryData[k]);
        }
        tQueryData = null;
      }

      if (tXhr.addEventListener === void 0) {
        // Check to see how old browsers are now-a-days.
        alert('Old XHR. Tell Jason about this and what device you are using!');
        return tDelay;
      } else {
        tXhr.addEventListener('progress', function(e) {
          if (e.lengthComputable) {
            tDelay.cue('progress', {percent: e.loaded / e.total, options: pOpts, xhr: this});
          } else {
            tDelay.cue('progress', {percent: NaN, options: pOpts, xhr: this});
          }
        }, false);

        tXhr.addEventListener('abort', function(e) {
          tDelay.cue('error', {event: e, options: pOpts, xhr: this});
        }, false);

        tXhr.addEventListener('error', function(e) {
          tDelay.cue('error', {event: e, options: pOpts, xhr: this});
        }, false);

        tXhr.addEventListener('timeout', function(e) {
          tDelay.cue('error', {event: e, options: pOpts, xhr: this});
        }, false);

        tXhr.addEventListener('load', function(e) {
          if (this.status === 200) {
            tDelay.cue('success', {
              status: this.status,
              statusText: this.statusText,
              responseType: this.responseType,
              response: this.response || this.responseText,
              responseText: this.responseText,
              responseXML: this.responseType === 'xml' ? this.responseXML : null
            });
          } else {
            tDelay.cue('success', {event: e, options: pOpts, xhr: this});
          }
        }, false);
      }

      if (tTimeout !== null) tXhr.timeout = tTimeout;
      if (tQueryData !== null) {
        var tUrlMatch = pUrl.match(ajax.urlRegex),
        tQuery = ajax.queryify(tQueryData, tUrlMatch[4]);
        pUrl = 
          (tUrlMatch[1] || '') + (tUrlMatch[2] || '') +
          (tUrlMatch[3] || '') + tQuery + (tUrlMatch[5] || '');
      }
      tXhr.open(tMethod, pUrl, true);

      tXhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      if (tHeaders !== null) {
        for (var k in tHeaders) {
          tXhr.setRequestHeader(k, tHeaders[k]);
        }
      }

      if (tOverrideMimeType !== null) {
        tXhr.overrideMimeType(tOverrideMimeType);
      }

      tXhr.send(tFormData);

      return tDelay;
    },

    /**
     * Send a GET request.
     *  Using {@link utils.ajax#send} internally.
     * @param {string} pUrl The URL to send to.
     * @param {Object} [pOpts] Options to customize the request.
     * @default pOpts={method: 'GET'}
     * @return {PersistentCueListener} A Delay object.
     * @see utils.ajax#send
     */
    get: function(pUrl, pOpts) {
      return this.send(pUrl, Object.mixin({
        method: 'GET'
      }, pOpts));
    },

    /**
     * Send a POST request with the given form.
     *  Using {@link utils.ajax#send} internally.
     * @param {string} pUrl The URL to send to.
     * @param {Object} [pOpts] Options to customize the request.
     * @default pOpts={method: 'POST'}
     * @return {PersistentCueListener} A Delay object.
     * @see utils.ajax#send
     */
    post: function(pUrl, pOpts) {
      return this.send(pUrl, Object.mixin({
        method: 'POST'
      }, pOpts));
    },

  };
  utils.ajax = ajax;

}(this));
