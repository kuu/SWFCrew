(function(global) {
  var theatre = global.theatre,
      quickswf = global.quickswf;

  var swfcrew = theatre.define('theatre.crews.swf');

  /**
   * Converts the given SWF to a TheatreScript Stage.
   * It is recommended to destroy the SWF object after this if
   * you can to reduce memory usage. TheatreScript will not
   * use the given SWF object at all once converted.
   * @param {quickswf.SWF} pSWF The SWF to convert.
   * @param {Element} pAttachTo An element to attach to.
   * @param {Object=} pOptions Options to pass customize the conversion.
   * @return {theatre.Stage} The Stage to use inside TheatreScript.
   */
  swfcrew.create = function(pSWF, pAttachTo, pOptions) {
    var tStage = new theatre.Stage();

    var tContainer = new theatre.crews.dom.DOMActor();
    tStage.addActor(tContainer, {
      container: pAttachTo,
      width: pSWF.width,
      height: pSWF.height
    });

    tStage.stepRate = 1000 / pSWF.frameRate;
    
    var tActorTypes = swfcrew.actors;
    var tDictionaryToActorMap = new Object();
    var k;

    var tHandlers = swfcrew.handlers;

    var tDictionary = pSWF.dictionary;
    for (k in tDictionary) {
      var tDisplayListType = tDictionary[k].displayListType;
      if (tHandlers[tDisplayListType] === void 0) {
        continue;
      }
      tHandlers[tDisplayListType](pSWF, tDictionaryToActorMap, tDictionary[k], pOptions);
    }

    tHandlers[1](pSWF, tDictionaryToActorMap, pSWF.rootSprite, pOptions);

    tContainer.addActor(new tDictionaryToActorMap[0](), {
      layer: 0,
      name: 'root'
    });

    return tStage;
  };
}(this));
