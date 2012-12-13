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
  function DisplayListActor() {
    this.base();
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

}(this));
