/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var Rect = global.benri.geometry.Rect;

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
       * The name of the Actor as written in the SWF file.
       * Normally this gets lower-cased by placeObject.
       * @type {string}
       */
      this.swfName = null;

      // When we enter the Stage, all DisplayList Actors invalidate themselves for rendering.
      this.on('enter', onEnter);

      // Privates

      /**
       * Function for handling hit tests.
       * If null, it means we are not doing hit tests.
       * @private
       * @type {function}
       */
      this._onHitTest = null;
    }

    function onEnter() {
      this.invalidate();

      /*this.enableHitTest();
      this.on('pointerdown', function(pData){console.log("DOWN", pData.target.getName(), pData.x, pData.y)});
      this.on('pointermove', function(pData){console.log("MOVE", pData.target.getName(), pData.x, pData.y)});
      this.on('pointerup', function(pData){console.log("UP", pData.target.getName(), pData.x, pData.y)});*/
    }

    DisplayListActor.prototype = Object.create(pSuper.prototype);
    DisplayListActor.prototype.constructor = DisplayListActor;

    /**
     * The type of the display list.
     * This holds the SWF tag name.
     * @type {string}
     */
    DisplayListActor.prototype.displayListType = '';

    /**
     * The Display List ID of the actor. This is like a class ID
     * and is not unique per Actor.
     * It is also used as the key in the player's actorMap.
     * @type {number}
     */
    DisplayListActor.prototype.displayListId = -1;

    function onHitTest(pData) {
      var tMatrix = this.getAbsoluteMatrix();
      if (this.getBoundingRect().getPolygon().transform(tMatrix).isPointInside(pData.x, pData.y)) {
        pData.add(this);
      }
    }

    DisplayListActor.prototype.enableHitTest = function() {
      if (this._onHitTest !== null) {
        return;
      }

      this._onHitTest = onHitTest;

      this.on('hittest', onHitTest);
    };

    DisplayListActor.prototype.disableHitTest = function() {
      if (this._onHitTest === null) {
        return;
      }

      this._onHitTest = null;

      this.ignore('hittest', this._onHitTest);
    };

    /**
     * Gets a bounding Rect for this Actor relative to itself.
     * @return {benri.geometry.Rect}
     */
    DisplayListActor.prototype.getBoundingRect = function() {
      return new Rect(0, 0, this.twipsWidth || 0, this.twipsHeight || 0).transform(this.matrix);
    };

    /**
     * Gets a bounding Rect for this Actor relative to the Stage
     * in absolute pixel coordinates.
     * @return {benri.geometry.Rect}
     */
    DisplayListActor.prototype.getAbsoluteBoundingRect = function() {
      var tRect = this.getBoundingRect();

      if (tRect === null) {
        return new Rect(0, 0, 0, 0);
      }

      return tRect.transform(this.parent.getAbsoluteMatrix());
    };

    /**
     * Registers callback function to be invoked when the variable changes.
     * @param {string} pVariableName The name of variable.
     * @param {function} pListener The callback function to be invoked when the variable changes.
     */
    DisplayListActor.prototype.addVariableListener = function (pVariableName, pListener) {
      var tVarName = pVariableName.toLowerCase();
      var tVarData = this.variables[tVarName];
      if (tVarData) {
        var tListeners = tVarData.listeners;
        if (tListeners) {
          tListeners.push(pListener);
        } else {
          tVarData.listeners = [pListener];
        }
      } else {
        tVarData = {
            name: pVariableName,
            listeners: [pListener]
          };
        this.variables[tVarName] = tVarData;
      }
    };

    /**
     * Unregisters callback function to be invoked when the variable changes.
     * @param {string} pVariableName The name of variable.
     * @param {function} pListener The callback function to be removed.
     */
    DisplayListActor.prototype.removeVariableListener = function (pVariableName, pListener) {
      var tVarData = this.variables[pVariableName.toLowerCase()];
      if (tVarData) {
        var tListeners = tVarData.listeners;
        if (tListeners) {
          var tIndex = tListeners.indexOf(pListener);
          if (tIndex !== -1) {
            tListeners.splice(tIndex, 1);
          }
        }
      }
    };

    /**
     * Get's a variable saved in this Actor.
     * @param  {string} pName The name of the variable.
     */
    DisplayListActor.prototype.getVariable = function (pName) {
      var tData = this.variables[pName.toLowerCase()];
      return tData ? tData.value : undefined;
    };

    /**
     * Set's a variable to be saved in this Actor.
     * @param {string} pName  The name of the variable.
     * @param {object} pValue The value of the variable.
     */
    DisplayListActor.prototype.setVariable = function (pName, pValue) {
      var tName = pName.toLowerCase();
      var tData = this.variables[tName];

      if (tData) {
        if (tData.value !== pValue) {
          tData.value = pValue;
          // Notify the listeners.
          var tListeners = tData.listeners;
          if (tListeners) {
            for (var i = 0, il = tListeners.length; i < il; i++) {
              tListeners[i](pValue);
            }
          }
        }
      } else {
        tData = {
            name: pName,
            value: pValue
          };
        this.variables[tName] = tData;
      }
    };

    return DisplayListActor;
  })(theatre.Actor);

  theatre.crews.swf.actors.DisplayListActor = DisplayListActor;

}(this));
