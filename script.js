var video = document.createElement('video');
video.setAttribute('playsinline', '');
video.setAttribute('autoplay', '');
video.setAttribute('muted', '');
video.style.width = '200px';
video.style.height = '200px';
var canvas= document.createElement('canvas');
canvas.style.display = 'none';
canvas.width=200;
canvas.height=200;
document.body.appendChild(canvas);
let model, maxPredictions;

async function loadModel() {
  const modelURL = "model/model.json";
  const metadataURL = "model/metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
}


var facingMode = "environment"; 
var constraints = {
  audio: false,
  video: {
   facingMode: facingMode
  }
};
/* Stream it to video element */
navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
  video.srcObject = stream;
});
loadModel().then(() => {
  navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
    video.srcObject = stream;
    document.body.appendChild(video);

    video.addEventListener('playing', () => {
      loop();
    });
  });
});

async function loop() {
  var ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (model) {
    const prediction = await model.predict(canvas);
    // Find highest probability result
    let best = prediction[0];
    for (let i = 1; i < prediction.length; i++) {
      if (prediction[i].probability > best.probability) best = prediction[i];
    }
    document.getElementById('result').innerText = 
      `${best.className}: ${(best.probability * 100).toFixed(1)}%`;
  }

  requestAnimationFrame(loop);
}
loop();