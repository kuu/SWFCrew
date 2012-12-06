/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {
  var theatre = global.theatre,
      quickswf = global.quickswf,
      AlphabetJS = global.AlphabetJS;

  var swfcrew = theatre.define('theatre.crews.swf');

  swfcrew.handlers = {};

  swfcrew.utils = {};

  swfcrew.ASHandlers = {};

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
    var tASType = pOptions.asType || 'AS1VM';

    tStage.stepRate = 1000 / pSWF.frameRate;
    tStage.backingContainer = pAttachTo;
    tStage.actionScriptProgram = AlphabetJS.createProgram(tASType, swfcrew.ASHandlers);
    tStage.actionScriptLoader = AlphabetJS.createLoader(tASType);

    theatre.crews.dom.enableKeyInput(tStage);
    theatre.crews.dom.enableMotionInput(tStage);

    var tActorTypes = swfcrew.actors;
    var tParams = {
      dictionaryToActorMap: {},
      eventSounds: pSWF.eventSounds,
      streamSoundMetadata: pSWF.streamSoundMetadata
      // More data will be added.
    };
    var tDictionaryToActorMap = tParams.dictionaryToActorMap;
    var k;

    var tHandlers = swfcrew.handlers;

    var tDictionary = pSWF.dictionary;
    for (k in tDictionary) {
      var tDisplayListType = tDictionary[k].displayListType;
      if (tHandlers[tDisplayListType] === void 0) {
        continue;
      }
      tHandlers[tDisplayListType](pSWF, tStage, tParams, tDictionary[k], pOptions);
    }

    tHandlers['DefineSprite'](pSWF, tStage, tParams, pSWF.rootSprite, pOptions);

    var tCompositor = new swfcrew.actors.Compositor(pSWF, pAttachTo, pOptions);
    tCompositor.name = '__compositor__';

    tStage.addActor(tCompositor, 0);

    var tRoot = new tDictionaryToActorMap[0]();
    tRoot.name = 'root';
    tRoot.__isRoot = true;
    tCompositor.addActor(tRoot, 0);

    tStage.open();

    tCompositor.invalidate();

    return tStage;
  };

}(this));
