/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var mActions = theatre.define('theatre.crews.swf.actions');

  /**
   * Set's the background colour of the stage.
   * @param {theatre.Actor} pSpriteActor Ignored..
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {Object} pData The data to use to know what to add.
   */
  mActions.background = function(pSpriteActor, pParams, pData) {
    pSpriteActor.backingContainer.style.backgroundColor = pData.color.toString();
  }

}(this));
