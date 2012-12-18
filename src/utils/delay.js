/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var utils = global.theatre.crews.swf.utils;

  utils.Delay = Delay;

  /**
   * @constructor
   * @name utils.Delay
   * @classdesc 
   * This class provides a flexible way of executing callbacks asynchronously.
   */
  function Delay() {
    this._l = new Object();
    this._r = false;
    this._f = false;
    this.value = null;
  };


  Delay.prototype = /** @lends utils.Delay# */ {
    /**
     * Registers a callback to be invoked 
     *    when this Delay object is resolved.
     * @param {function} pCallback Callback to be called.
     * @return {utils.Delay} This.
     * @see utils.Delay#resolve
     */
    then: function(pCallback) {
      if (this._r) {
        pCallback(this.value);
      }

      this.on('resolved', pCallback);

      return this;
    },

    /**
     * Registers a callback to be invoked 
     *    when this Delay object fails.
     * @param {function} pCallback Callback to be called.
     * @return {utils.Delay} This.
     * @see utils.Delay#fail
     */
    or: function(pCallback) {
      if (this._f) {
        pCallback(this.value);
      }

      this.on('failure', pCallback);
      return this;
    },

    /**
     * Registers a named callback to be invoked 
     *    when an event with the same name occurs.
     * @param {string} pName Name of the event.
     * @param {function} pCallback Callback to be called.
     * @return {utils.Delay} This.
     * @see utils.Delay#notify
     */
    on: function(pName, pCallback) {
      if (this._l[pName] === void 0) {
        this._l[pName] = [pCallback];
      } else {
        this._l[pName].push(pCallback);
      }
      return this;
    },

    /**
     * Unregisters a callback with given name that was previously
     *    registered via {@link utils.Delay#on}
     * @param {string} pName Name of the event.
     * @param {function} pCallback Callback to be called.
     * @return {utils.Delay} This.
     */
    onNot: function(pName, pCallback) {
      var tListeners = this._l[pName];
      if (tListeners !== void 0) {
        tListeners.some(function(pListener, pIndex) {
          if (pListener === pCallback) {
            tListeners.splice(pIndex, 1);
            return true;
          }
        });
      }
      return this;
    },

    /**
     * Resolves this Delay object with the given value. 
     *    Use this to trigger callbacks registered via {@link utils.Delay#then}
     * @param {*} pValue The value resolved.
     * @return {utils.Delay} This.
     * @see utils.Delay#then
     */
    resolve: function(pValue) {
      this._r = true;
      this.value = pValue;
      this.notify('resolved', pValue);
      return this;
    },


    /**
     * Causes failure on this Delay object. 
     *    Use this to trigger callbacks registered via {@link utils.Delay#or}
     * @param {*} pReason The reason for failure.
     * @return {utils.Delay} This.
     * @see utils.Delay#or
     */
    fail: function(pReason) {
      this._f = true;
      this.value = pReason;
      this.notify('failure', pReason);
      return this;
    },


    /**
     * Notifies all listeners registered with the given name.
     *    Use this to trigger callbacks registered via {@link utils.Delay#on}
     * @param {string} pName The name of the event to send.
     * @param {*} pData The data to send with this event.
     * @return {utils.Delay} This.
     * @see utils.Delay#on
     */
    notify: function(pName, pData) {
      var tListeners = this._l[pName];
      if (tListeners !== void 0) {
        tListeners.forEach(function(pListener) {
          pListener(pData);
        });
      }
      return this;
    }
  };

}(this));
