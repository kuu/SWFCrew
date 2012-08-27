(function(global) {

  var mActions = theatre.define('theatre.crews.swf.actions');

  /**
   * Sets up removing an Actor from the Stage.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor to remove from.
   * @param {Object.<String, theatre.Actor>} pDictionary A map of ids to Actor Classes.
   * @param {Object} pData The data to use to know what to remove.
   */
  mActions.remove = function(pSpriteActor, pDictionary, pData) {
    var tActor = pSpriteActor.getActorAtLayer(pData.layer);
    if (tActor !== null) tActor.leave();
  };

}(this));
