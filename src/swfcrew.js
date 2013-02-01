/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {
  var theatre = global.theatre;

  /**
   * The namespace for SWFCrew.
   * @type {object}
   */
  var swfcrew = theatre.crews.swf = {
    handlers: {},
    utils: {},
    ASHandlers: {},
    props: {},
    actors: {},
    actions: {},
    shaders: {}
  };

  /**
   * Plays a SWF file that will be loaded with the given Loader
   * in the given container.
   * @param  {theatre.crews.swf.Loader} pLoader The Loader to load in.
   * @param  {object} pData     The data to load via the Loader.
   * @param  {Node} pAttachTo The HTML Node to appendChild to.
   * @param  {object} pOptions  Options to customize play.
   * @return {theatre.crews.swf.Player} The Player that can play the SWF file.
   */
  function play(pLoader, pData, pAttachTo, pOptions) {
    var tPlayer = new swfcrew.Player(pLoader);

    pLoader.load(pData, pOptions);

    pLoader.on('loadcomplete', function() {
      tPlayer.takeCentreStage(pAttachTo);
    });

    return tPlayer;
  }

  /**
   * Plays the SWF file at the given URL.
   * @param  {string} pURL      The URL
   * @param  {Node} pAttachTo The HTML Node to appendChild to.
   * @param  {object} pOptions  Options to customize play.
   * @return {theatre.crews.swf.Player} The Player that can play the SWF file.
   */
  swfcrew.playURL = function(pURL, pAttachTo, pOptions) {
    return play(new swfcrew.URLLoader(), pURL, pAttachTo, pOptions);
  };

  /**
   * Plays the given byte array as a SWF.
   * @param  {Uint8Array} pData The data to play.
   * @param  {Node} pAttachTo The HTML Node to appendChild to.
   * @param  {object} pOptions  Options to customize play.
   * @return {theatre.crews.swf.Player} The Player that can play the SWF file.
   */
  swfcrew.playData = function(pData, pAttachTo, pOptions) {
    return play(new swfcrew.DataLoader(), pData, pAttachTo, pOptions);
  };

  /**
   * Plays the given QuickSWF SWF file.
   * @param  {quickswf.SWF} pSWF The SWF file to play.
   * @param  {Node} pAttachTo The HTML Node to appendChild to.
   * @param  {object} pOptions  Options to customize play.
   * @return {theatre.crews.swf.Player} The Player that can play the SWF file.
   */
  swfcrew.playSWF = function(pSWF, pAttachTo, pOptions) {
    return play(new swfcrew.Loader(), pSWF, pAttachTo, pOptions);
  };

}(this));
