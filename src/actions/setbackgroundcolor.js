(function(global) {

  var mActions = theatre.define('theatre.crews.swf.actions');

  /**
   * Set's the background colour of the stage.
   * @param {theatre.Actor} pSpriteActor Ignored..
   * @param {Object.<String, theatre.Actor>} pDictionary Ignored.
   * @param {Object} pData The data to use to know what to add.
   */
  mActions.background = function(pSpriteActor, pDictionary, pData) {
    var tElement = pSpriteActor.stage.stageManager.getActorAtLayer(0).element;
    tElement.style.backgroundColor = pData.color.toString();
  }

}(this));
