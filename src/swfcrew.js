/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {
  var theatre = global.theatre;

  var swfcrew = theatre.crews.swf = {
    handlers: {},
    utils: {},
    ASHandlers: {},
    props: {},
    actors: {},
    actions: {},
    shaders: {}
  };

  function play(pLoader, pData, pAttachTo, pOptions) {
    var tPlayer = new swfcrew.Player(pLoader);

    pLoader.load(pData, pOptions);

    pLoader.on('loadcomplete', function() {
      tPlayer.takeCentreStage(pAttachTo);
    });

    return tPlayer;
  }

  swfcrew.playURL = function(pURL, pAttachTo, pOptions) {
    return play(new swfcrew.URLLoader(), pURL, pAttachTo, pOptions);
  };

  swfcrew.playData = function(pData, pAttachTo, pOptions) {
    return play(new swfcrew.DataLoader(), pData, pAttachTo, pOptions);
  };

  swfcrew.playSWF = function(pSWF, pAttachTo, pOptions) {
    return play(new swfcrew.Loader(), pSWF, pAttachTo, pOptions);
  };

}(this));
