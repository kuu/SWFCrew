/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  /**
   * A class for Actors that exist on the Display List of the SWF file.
   * @class
   * @extends {theatre.Actor}
   */
  var DisplayListActor = (function(pSuper) {
    function DisplayListActor(pPlayer) {
      pSuper.call(this);

      /**
       * The player this Actor is playing in.
       * @type {theatre.crews.swf.Player}
       */
      this.player = pPlayer;

      /**
       * Variables that are set and get in ActionScript.
       * @type {object}
       */
      this.variables = {};

      /**
       * The colour transform to apply to this Actor
       * while rendering (if any).
       * @type {quickswf.structs.CXFORM=}
       */
      this.colorTransform = null;

      /**
       * If non-zero, this Actor should start a new mask
       * with a depth of this number.
       * @type {number}
       */
      this.clipDepth = 0;

      /**
       * A flag for if this Actor is visible or not.
       * @type {boolean}
       */
      this.isVisible = true;

      /**
       * A flag for if this Actor's matrix is locked.
       * When the matrix is locked it means that the
       * matrix can only be modified via ActionScript and
       * can no longer be modified using actions such as move.
       * It get's locked when ActionScript modifies the matrix
       * in any way.
       * @type {boolean}
       */
      this.isMatrixLocked = false;

      /**
       * A flag for if this Actor was created via the timeline
       * or via ActionScript.
       * @type {boolean}
       */
      this.isNonTimeline = false;

      /**
       * The ratio of the Actor for use in MorphShape.
       * @type {number}
       */
      this.ratio = 0;

      /**
       * Callback functions to be invoked when variable changes.
       * @type {Object}
       */
      this.listeners = {};

      // When we enter the Stage, all DisplayList Actors invalidate themselves for rendering.
      this.on('enter', onEnter);
    }

    function onEnter() {
      this.invalidate();
    }

    DisplayListActor.prototype = Object.create(pSuper.prototype);
    DisplayListActor.prototype.constructor = DisplayListActor;

    /**
     * The Display List ID of the actor. This is like a class ID
     * and is not unique per Actor.
     * It is also used as the key in the player's actorMap.
     * @type {number}
     */
    DisplayListActor.prototype.displayListId = -1;

    /**
     * Gets a bounding Rect for this Actor relative to the Stage
     * in absolute pixel coordinates.
     * @return {[type]} [description]
     */
    DisplayListActor.prototype.getBoundingRect = function() {

      var tChildren = this.getActors();

    };

    function fixName(pName) {
      var tName = pName.trim().toLowerCase();
      var tColon = tName.lastIndexOf(':');
      if (tColon !== -1) {
        tName = tName.slice(tColon + 1);
      }
      return tName;
    }

    /**
     * Registers callback function to be invoked when the variable changes.
     * @param {string} pVariableName The name of variable.
     * @param {function} pListener The callback function to be invoked when the variable changes.
     */
    DisplayListActor.prototype.addVariableListener = function (pVariableName, pListener) {
      var tName = fixName(pVariableName);
      var tListeners = this.listeners[tName];
      if (tListeners === void 0) {
        this.listeners[tName] = [pListener];
      } else {
        tListeners.push(pListener);
      }
    };

    /**
     * Unregisters callback function to be invoked when the variable changes.
     * @param {string} pVariableName The name of variable.
     * @param {function} pListener The callback function to be removed.
     */
    DisplayListActor.prototype.removeVariableListener = function (pVariableName, pListener) {
      var tName = fixName(pVariableName);
      var tListeners = this.listeners[tName];
      if (tListeners !== void 0) {
        var tIndex = tListeners.indexOf(pListener);
        if (tIndex !== -1) {
          tListeners.splice(tIndex, 1);
        }
      }
    };

    /**
     * Get's a variable saved in this Actor.
     * @param  {string} pName The name of the variable.
     */
    DisplayListActor.prototype.getVariable = function (pName) {
      return this.variables[pName.toLowerCase()];
    };

    /**
     * Set's a variable to be saved in this Actor.
     * @param {string} pName  The name of the variable.
     * @param {object} pValue The value of the variable.
     */
    DisplayListActor.prototype.setVariable = function (pName, pValue) {
      var tName = pName.toLowerCase();
      var tValue = this.variables[tName];
      if (tValue !== pValue) {
        this.variables[tName] = pValue;
        var tListeners = this.listeners[tName];
        if (tListeners) {
          for (var i = 0, il = tListeners.length; i < il; i++) {
            tListeners[i](pValue);
          }
        }
      }
    };

    return DisplayListActor;
  })(theatre.Actor);

  theatre.crews.swf.actors.DisplayListActor = DisplayListActor;

  function fixName(pName) {
    var tName = pName.trim().toLowerCase();
    var tColon = tName.lastIndexOf(':');
    if (tColon !== -1) {
      tName = tName.slice(tColon + 1);
    }
    return tName;
  }

}(this));
