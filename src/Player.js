/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre,
      swfcrew = theatre.crews.swf;

  swfcrew.Player = Player;

  /**
   * A class that can play SWF files.
   * @param {theatre.crews.swf.Loader} pLoader The Loader that loaded the SWF file.
   * @param {theatre.Stage=} pStage The Stage to play this SWF file in.
   */
  function Player(pLoader, pStage) {
    var tStage = pStage || new theatre.Stage();

    /**
     * The Stage the SWF file is playing in.
     * @type {theatre.Stage}
     */
    this.stage = tStage;

    /**
     * The Loader that loaded the SWF file.
     * @type {theatre.crews.swf.Loader}
     */
    this.loader = pLoader;

    /**
     * The compositor that sets up the rendering system
     * and manages various rendering effects such as
     * masks.
     * @type {theatre.crews.swf.props.Compositor}
     */
    this.compositor = null;

    /**
     * A reference to the current root Sprite.
     * @type {theatre.crews.swf.actors.SpriteActor}
     */
    this.root = null;

    /**
     * A reference to all media loaded in QuickSWF.
     * @type {quickswf.utils.MediaLoader}
     */
    this.media = pLoader.media;

    /**
     * The ActionScript Loader that is used to load ActionScript bytecode.
     * @type {AlphabetJS.Loader}
     */
    this.actionScriptLoader = pLoader.actionScriptLoader;

    /**
     * The ActionScript Program that all ActionScript code will run in.
     * @type {AlphabetJS.Program}
     */
    this.actionScriptProgram = pLoader.actionScriptProgram;

    /**
     * Counter used to count the number of Sprite instances.
     * Used to create the correct name for the Sprite.
     * @type {number}
     */
    tStage.spriteInstanceCounter = 0;

    /**
     * Counter used to count the number of non-Sprite instances.
     * Used to create a meaningful name for non-Sprite objects.
     * @type {number}
     */
    tStage.notSpriteInstanceCounter = 0;

    theatre.crews.dom.enableKeyInput(tStage);
    theatre.crews.dom.enableMotionInput(tStage);
  }

  /**
   * Tells this Player to completely take control over it's Stage.
   * Usually you want to use this to play a SWF file.
   * @param  {Node} pAttachTo The container to attach to.
   */
  Player.prototype.takeCentreStage = function(pAttachTo) {
    var tStage = this.stage;
    var tLoader = this.loader;

    // Set up the step rate to match the SWF file frame rate.
    tStage.stepRate = 1000 / tLoader.swf.frameRate;

    // Create a new Compositor.
    var tCompositor = this.compositor = this.newCompositor();

    // Let the Compositor be the first thing the render
    // in the rendering process. This allows it to control
    // many aspects of the rendering process.
    tStage.getStageManager().addProp(tCompositor);

    // TODO: This is depending on the DOM... should fix it later...
    pAttachTo.appendChild(tCompositor.getSurface());

    // Create the root Sprite.
    var tRoot = this.root = this.newRoot();

    // Add the root Sprite to the stage.
    tStage.addActor(tRoot, 0);

    // Start playing.
    tStage.open();

    // Do the initial render.
    tStage.getStageManager().invalidate();
  };

  /**
   * Creates a new Compositor for this Player.
   * @return {theatre.crews.swf.props.Compositor}
   */
  Player.prototype.newCompositor = function() {
    return new swfcrew.props.Compositor(this);
  };

  /**
   * Creates a new root Sprite for this Player.
   * @return {theatre.crews.swf.actors.SpriteActor}
   */
  Player.prototype.newRoot = function() {
    var tRoot = new this.loader.actorMap[0](this);
    tRoot.setName('root');
    tRoot.__isRoot = true;

    return tRoot;
  };

  /**
   * Instantiates a new DisplayList object from
   * the given ID.
   * @param  {number} pId The ID DisplayList ID of the object.
   * @return {theatre.crews.swf.actors.DisplayListActor}
   */
  Player.prototype.newFromId = function(pId) {
    var tClass = this.loader.actorMap[pId];
    if (tClass === void 0) {
      return null;
    }

    var tActor = new tClass(this);

    return tActor;
  };

  /**
   * Instantiates a new DisplayList object from
   * the given name. This name must have been
   * exported via ExportAssets
   * @param  {string} pName The name of the object.
   * @return {theatre.crews.swf.actors.DisplayListActor}
   */
  Player.prototype.newFromName = function(pName) {
    var tClass = this.loader.actorNameMap[pName];
    if (tClass === void 0) {
      return null;
    }

    var tActor = new tClass(this);

    return tActor;
  };

}(this));
