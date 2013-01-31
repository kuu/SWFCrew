/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;

  /**
   * @class
   * @extends {theatre.crews.swf.actors.DisplayListActor}
   */
  var TextActor = (function(pSuper) {
    function TextActor(pPlayer) {
      pSuper.call(this, pPlayer);

      this.width  = (this.bounds.right  - this.bounds.left) / 20;
      this.height = (this.bounds.bottom - this.bounds.top ) / 20;
    }

    TextActor.prototype = Object.create(pSuper.prototype);
    TextActor.prototype.constructor = TextActor;

    return TextActor;
  })(mSWFCrew.actors.DisplayListActor);

  mSWFCrew.actors.TextActor = TextActor;

}(this));
