/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mActors = theatre.crews.swf.actors;

  /**
   * @class
   * @extends {theatre.crews.swf.actors.ShapeActor}
   */
  var MorphShapeActor = (function(pSuper) {
    function MorphShapeActor(pPlayer) {
      pSuper.call(this, pPlayer);
    }

    MorphShapeActor.prototype = Object.create(pSuper.prototype);
    MorphShapeActor.prototype.constructor = MorphShapeActor;

    return MorphShapeActor;
  })(mActors.ShapeActor);

  mActors.MorphShapeActor = MorphShapeActor;

}(this));
