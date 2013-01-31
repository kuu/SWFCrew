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
   * @extends {theatre.crews.swf.actors.DisplayListActor}
   */
  var ShapeActor = (function(pSuper) {
    function ShapeActor(pPlayer) {
      pSuper.call(this, pPlayer);
    }

    ShapeActor.prototype = Object.create(pSuper.prototype);
    ShapeActor.prototype.constructor = ShapeActor;

    return ShapeActor;
  })(mActors.DisplayListActor);

  mActors.ShapeActor = ShapeActor;

}(this));
