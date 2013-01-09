/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mActors = theatre.define('theatre.crews.swf.actors');
  var mSWFCrew = theatre.crews.swf;

  mActors.ShapeActor = ShapeActor;

  /**
   * The actor for handling SWF Shapes.
   * @constructor
   * @type {theatre.crews.swf.actors.ShapeActor}
   * @extends {theatre.Actor}
   */
  function ShapeActor(pPlayer) {
    this.base(pPlayer);

    this.width = (((this.twipsWidth / 20) >>> 0) || 0) + 1;
    this.height = (((this.twipsHeight / 20) >>> 0) || 0) + 1;
  }
  theatre.inherit(ShapeActor, mSWFCrew.DisplayListActor);

}(this));
