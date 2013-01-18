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
    if (tAccessor) {
      if (tAccessor[pType]) {
        console.warn('AS variable accessor is overwritten: ' + tName + '#' + pType);
      }
    } else {
      tAccessor = this.accessors[tName] = {};
    }
    tAccessor[pType] = pFunction;
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
        delete tAccessor[pType];
      } else {
        delete this.accessors[tName];
      }
    }
  };

  DisplayListActor.prototype.getVariable = function (pName) {
    var tAccessor = this.accessors[pName.toLowerCase()];
    if (tAccessor && tAccessor.getter) {
      return tAccessor.getter();
    } else {
      return this.variables[pName];
    }
  };

  DisplayListActor.prototype.setVariable = function (pName, pValue) {
    var tAccessor = this.accessors[pName.toLowerCase()];
    if (tAccessor && tAccessor.setter) {
      tAccessor.setter(pValue);
    } else {
      this.variables[pName] = pValue;
    }
  };

}(this));
