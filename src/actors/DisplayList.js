/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  theatre.define('crews.swf.DisplayListActor', DisplayListActor, theatre);

  /**
   * @constructor
   */
  function DisplayListActor(pPlayer) {
    this.base();
    this.player = pPlayer;
    this.variables = {};
    this.colorTransform = null;
    this.clipDepth = 0;
    this.isVisible = true;
    this.isMatrixLocked = false;
    this.isNonTimeline = false;
    this.stepAdded = -1;
    this.ratio = 0;

    // -1 means auto.
    this._width = -1;
    this._height = -1;

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
  }
  theatre.inherit(DisplayListActor, theatre.Actor)

  DisplayListActor.prototype.setSize = function(pWidth, pHeight) {
    this._width = pWidth;
    this._height = pHeight;

    this.invalidate();
  }

  DisplayListActor.prototype.getSize = function() {
    var tWidth = this._width;
    var tHeight = this._height;
    var tSize;

    tSize = [tWidth, tHeight];

    return tSize;
  }

  function fixName(pName) {
    var tName = pName.trim().toLowerCase();
    var tColon = tName.lastIndexOf(':');
    if (tColon !== -1) {
      tName = tName.slice(tColon + 1);
    }
    return tName;
  }

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

  DisplayListActor.prototype.getVariable = function (pName) {
    var tAccessor = this.accessors[pName.toLowerCase()];
    if (tAccessor && tAccessor.getter[0]) {
      return tAccessor.getter[0]();
    } else {
      return this.variables[pName];
    }
  };

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

}(this));
