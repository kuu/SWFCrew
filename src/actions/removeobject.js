/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var mActions = theatre.crews.swf.actions;

  /**
   * Sets up removing an Actor from the Stage.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor to remove from.
   * @param {Object} pData The data to use to know what to remove.
   */
  mActions.remove = function(pSpriteActor, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.depth);

    if (tActor !== null) {
      tActor.leave();
    }
  };

}(this));
