/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var mActions = global.theatre.crews.swf.actions;
  var Color = global.benri.draw.Color;

  /**
   * Set's the background colour of the stage.
   * @param {theatre.Actor} pSpriteActor
   * @param {Object} pData The data to use to know what to add.
   */
  mActions.background = function(pSpriteActor, pData) {
    var tColor = pData.color;
    pSpriteActor.player.compositor.backgroundColor = new Color(tColor.red, tColor.green, tColor.blue, tColor.alpha * 255);
  }

}(this));
