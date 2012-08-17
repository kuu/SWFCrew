
document.addEventListener('DOMContentLoaded', function(global) {(function(global) {

  var document = global.document;

  var theatre = global.theatre,
      DOMActor = theatre.crews.dom.DOMActor;

  var mWidth = global.innerWidth,
      mHeight = global.innerHeight;

  var mText = {
    en: [
      ['This is a test', '2s']
    ],
    ja: [
      ['これはテストです', '2s']
    ]
  };

  var mStage;

  var TextWriterActor = theatre.createActor('TextWriterActor', theatre.crews.canvas.CanvasActor, function() {
    this.finalText = '';
    this.currentText = '';
    this.time = 0;
  });

  TextWriterActor.prototype.draw = function(pContext) {
    pContext.font = "25px monospace";
    pContext.fillStyle = "#000000";
    pContext.fillText(this.currentText, 100, 100);
  };

  TextWriterActor.prototype.write = function(pText, pTime) {
    this.finalText = pText;
    this.currentText = pText;
    this.time = mStage.timeToStep(pTime);
  };

  document.getElementById('lang-en').addEventListener('click', function() {
    start('en');
  }, false);
  document.getElementById('lang-ja').addEventListener('click', function() {
    start('ja');
  }, false);

  function start(pLanguage) {
    document.getElementById('language').style.display = 'none';
    document.getElementById('video').style.display = 'block';
    mStage = new theatre.Stage();
    mStage.open();
    var tContainer = mStage.stageManager.addActor(theatre.crews.canvas.CanvasActor, {
      data: {
        width: mWidth,
        height: mHeight
      }
    });
    document.getElementById('video').appendChild(tContainer.context.canvas);
    var tWriter = tContainer.addActor(TextWriterActor);
    tWriter.write(mText[pLanguage][0][0], mText[pLanguage][0][1]);
  }



}(window))}, false);
