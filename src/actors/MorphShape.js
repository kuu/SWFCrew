/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mActors = theatre.define('theatre.crews.swf.actors');

  mActors.MorphShapeActor = MorphShapeActor;

  /**
   * @constructor
   */
  function MorphShapeActor(pPlayer) {
    this.base(pPlayer);
  }
  theatre.inherit(MorphShapeActor, mActors.ShapeActor);

}(this));
