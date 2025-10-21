const classifier = knnClassifier.create();
let net;

async function loadImageAsTensor(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  return tf.browser.fromPixels(img);
}

async function addExampleFromFile(imagePath, classId) {
  const imgTensor = await loadImageAsTensor(imagePath);
  const activation = net.infer(imgTensor, true);
  classifier.addExample(activation, classId);
  imgTensor.dispose();
}

async function app() {
  console.log("Loading MobileNet...");
  net = await mobilenet.load();
  console.log("Model loaded ✅");

  // 🐱 Train with Cat 1 images
  await addExampleFromFile("images/cat1_1.jpg", 0);
  await addExampleFromFile("images/cat1_2.jpg", 0);
  await addExampleFromFile("images/cat1_3.jpg", 0);

  // 🐈 Train with Cat 2 images
  await addExampleFromFile("images/cat2_1.jpg", 1);
  await addExampleFromFile("images/cat2_2.jpg", 1);
  await addExampleFromFile("images/cat2_3.jpg", 1);

  console.log("Training examples added 🧠");

  // 🧪 Test on a new image
  const testTensor = await loadImageAsTensor("images/test.jpg");
  const activation = net.infer(testTensor, "conv_preds");
  const result = await classifier.predictClass(activation);
  const classes = ["Cat 1 (Herrle)", "Cat 2 (Peaches)"];

  document.getElementById("console").innerText = `
    Prediction: ${classes[result.label]}
    Probability: ${result.confidences[result.label].toFixed(2)}
  `;

  testTensor.dispose();
}

app();
