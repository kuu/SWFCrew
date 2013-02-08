/**
 * @author Kuu Miyazaki
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
  var TextActor = (function(pSuper) {
    function TextActor(pPlayer) {
      pSuper.call(this, pPlayer);
    }

    TextActor.prototype = Object.create(pSuper.prototype);
    TextActor.prototype.constructor = TextActor;

    return TextActor;
  })(mActors.DisplayListActor);

  mActors.TextActor = TextActor;

}(this));
