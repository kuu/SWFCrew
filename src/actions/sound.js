/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var AudioProp = theatre.crews.audio.AudioProp;
  var mActions = theatre.crews.swf.actions;

  /**
   * Sets up playing back event sounds.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor the sound belongs to.
   * @param {Object} pData The data to use to know haw to play back the sound.
   */
  mActions.startSound = function(pSpriteActor, pData) {
    var tId = pData.soundId,
        tInfo = pData.soundInfo,
        tSound = pSpriteActor.player.media.get('audio', tId + ''),
        tProps = pSpriteActor.getProps('Audio'), tAudioProp;

    console.log('StartSound: id=' + tId);
    console.log(tSound);
    console.log(tInfo);

    // Check if the same id's AudioProp already exists.
    for (var i = tProps, il = tProps.length; i < il; i++) {
      if (tProps[i].id === tId) {
        tAudioProp = tProps[i];
      }
    }

    if (tInfo.syncStop) {
        // Stop sound
        if (tAudioProp) {
          tAudioProp.stop();
        }
    } else {
        // Create AudioProp
        if (!tAudioProp) {
          tAudioProp = new AudioProp(tId, tSound);
          pSpriteActor.addProp(tAudioProp);
        }
        // Start sound
        tAudioProp.play();
    }
  };

  /**
   * Sets up playing back audio streams.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor the sound belongs to.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {Object} pData The audio data.
   */
  mActions.soundStreamBlock = function(pSpriteActor, pParams, pData) {
    var tMetadata = pSpriteActor.player.soundStreamHead,
        tSound = pData.soundData;

    console.log('SoundStreamBlock:');
    console.log(tMetadata);
    console.log(tSound);

    // Feed stream data
  };
}(this));
