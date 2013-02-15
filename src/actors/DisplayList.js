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

      // this.accessors holds the references to the functions for accessing child node's variables.
      // It has the following structure:
      //
      // accessors = {
      //    "variableName-1" : {
      //        "getter" : [
      //            function () { return v; },
      //            function () { return v; }
      //          ],
      //        "setter" : [
      //            function (v) { },
      //            function (v) { }
      //          ]
      //    },
      //    "variableName-2" : {
      //        ...
      //    }
      //}
      this.accessors = {};

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

    /**
     * Registers callback function to be invoked when the variable is accessed.
     * @param {string} pVariableName The name of variable.
     * @param {function} pGetter The callback function to be invoked when reading the variable.
     *                    The function must take no argument and returns a value.
     * @param {function} pSetter The callback function to be invoked when writing the variable.
     *                    The function must take an argument and returns no value.
     */
    DisplayListActor.prototype.hookVariable = function (pVariableName, pGetter, pSetter) {
      var tName = fixName(pVariableName);
      var tAccessor = this.accessors[tName];
      if (tAccessor === void 0) {
        tAccessor = this.accessors[tName] = {};
      }
      var tHook = function (pType, pFunc) {
          var tFuncList = tAccessor[pType];
          if (!tFuncList) {
            tAccessor[pType] = [pFunc];
          } else if (tFuncList.indexOf(pFunc) === -1) {
            tFuncList.push(pFunc);
          } else {
            return false;
          }
          return true;
        };
      var tGetterHooked = pGetter && tHook('getter', pGetter);
      var tSetterHooked = pSetter && tHook('setter', pSetter);
      if (tGetterHooked != tSetterHooked) {
        throw new Error('DisplayListActor#hookVariable: atempted to hook either of the getter/setter pair.');
      }
    };

    /**
     * Unregisters callback function to be invoked when the variable is accessed.
     * @param {string} pVariableName The name of variable.
     * @param {function} pGetter The callback function registered via hookVariable.
     * @param {function} pSetter The callback function registered via hookVariable.
     */
    DisplayListActor.prototype.unhookVariable = function (pVariableName, pGetter, pSetter) {
      var tName = fixName(pVariableName);
      var tAccessor = this.accessors[tName];
      var tUnhook = function (pType, pFunc) {
          var tFuncList = tAccessor[pType], tIndex;
          if (tFuncList && (tIndex = tFuncList.indexOf(pFunc)) !== -1) {
            tFuncList.splice(tIndex, 1);
            tFuncList.length === 0 && delete tAccessor[pType];
            return true;
          }
          return false;
        };

      if (tAccessor) {
        var tGetterUnhooked = tUnhook('getter', pGetter);
        var tSetterUnhooked = tUnhook('setter', pSetter);
        if (tGetterUnhooked != tSetterUnhooked) {
          throw new Error('DisplayListActor#unhookVariable: atempted to unhook either of the getter/setter pair.');
        }
        if (Object.getOwnPropertyNames(tAccessor).length === 0) {
          delete this.accessors[tName];
        }
      }
    };

    /**
     * Get's a variable saved in this Actor.
     * @param  {string} pName The name of the variable.
     */
    DisplayListActor.prototype.getVariable = function (pName) {
      var tAccessor = this.accessors[pName.toLowerCase()];
      if (tAccessor && tAccessor.getter[0]) {
        return tAccessor.getter[0]();
      } else {
        return this.variables[pName];
      }
    };

    /**
     * Set's a variable to be saved in this Actor.
     * @param {string} pName  The name of the variable.
     * @param {object} pValue The value of the variable.
     */
    DisplayListActor.prototype.setVariable = function (pName, pValue) {
      var tAccessor = this.accessors[pName.toLowerCase()];
      if (tAccessor && tAccessor.setter) {
        var tSetters = tAccessor.setter;
        for (var i = 0, il = tSetters.length; i < il; i++) {
          tSetters[i](pValue);
        }
      } else {
        this.variables[pName] = pValue;
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
