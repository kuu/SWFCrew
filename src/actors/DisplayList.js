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
   * @param {function} pFunction The callback function to be invoked when reading/writing the variable.
   *                    Read (getter) function must take no argument and returns a value.
   *                    Write(setter) function must take an argument and returns no value.
   * @param {string} pType 'getter' or 'setter'
   */
  DisplayListActor.prototype.hookVariable = function (pVariableName, pFunction, pType) {
    var tName = fixName(pVariableName);
    var tAccessor = this.accessors[tName];
    if (tAccessor === void 0) {
      tAccessor = this.accessors[tName] = {};
    }
    if (tAccessor[pType] === void 0) {
        tAccessor[pType] = [];
    }
    tAccessor[pType].push(pFunction);
  };

  /**
   * Unregisters callback function to be invoked when the variable is accessed.
   * @param {string} pVariableName The name of variable.
   * @param {string} pType 'getter' or 'setter', if avoided, both.
   */
  DisplayListActor.prototype.unhookVariable = function (pVariableName, pType) {
    var tName = fixName(pVariableName);
    var tAccessor = this.accessors[tName];
    if (tAccessor) {
      if (pType) {
        if (tAccessor[pType]) {
          tAccessor[pType].pop();
          tAccessor[pType].length === 0 && delete tAccessor[pType];
        }
      } else {
        for (var k in tAccessor) {
          var v = tAccessor[k];
          if (v && v instanceof global.Array) {
            v.pop();
            v.length === 0 && delete tAccessor[k];
          }
        }
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
