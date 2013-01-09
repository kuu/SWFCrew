/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;

  theatre.define('actors.TextActor', TextActor, mSWFCrew);

  function TextActor(pPlayer) {
    this.base(pPlayer);
    this.width  = (this.bounds.right  - this.bounds.left) / 20;
    this.height = (this.bounds.bottom - this.bounds.top ) / 20;
  }
  theatre.inherit(TextActor, mSWFCrew.DisplayListActor);

}(this));
