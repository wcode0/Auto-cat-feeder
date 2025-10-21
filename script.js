const classifier = knnClassifier.create();
let net;
let webcamElement;

async function loadImageAsTensor(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  await new Promise((resolve) => (img.onload = resolve));
  return tf.browser.fromPixels(img);
}

async function addExampleFromFile(imagePath, classId) {
  const imgTensor = await loadImageAsTensor(imagePath);
  const activation = net.infer(imgTensor, true);
  classifier.addExample(activation, classId);
  imgTensor.dispose();
}

async function trainFromFolder(folderName, count, classId) {
  for (let i = 1; i <= count; i++) {
    const imagePath = `${folderName}/${i}.jpg`;
    console.log(`Adding ${imagePath}...`);
    await addExampleFromFile(imagePath, classId);
  }
}

async function app() {
  document.getElementById("console").innerText = "Loading MobileNet...";
  net = await mobilenet.load();
  document.getElementById("console").innerText = "Model loaded ✅\nTraining...";

  // 🐱 Train Herrle images (class 0)
  await trainFromFolder("herrle", 50, 0);

  // 🐈 Train Peaches images (class 1)
  await trainFromFolder("peaches", 41, 1);

  document.getElementById("console").innerText += "\nTraining complete 🧠";

  // 🎥 Start webcam (rear camera)
  webcamElement = document.getElementById("webcam");
  const webcam = await tf.data.webcam(webcamElement, {
    facingMode: "environment"  // ✅ this tells it to use the rear camera
  });

  const classes = ["Herrle", "Peaches"];

  // 🔁 Continuous prediction loop
  while (true) {
    const img = await webcam.capture();
    const activation = net.infer(img, "conv_preds");
    const result = await classifier.predictClass(activation);

    document.getElementById("console").innerText = `
      Prediction: ${classes[result.label]}
      Probability: ${result.confidences[result.label].toFixed(2)}
    `;

    img.dispose();
    await tf.nextFrame();
  }
}

app();
