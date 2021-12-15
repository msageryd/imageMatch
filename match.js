const cv = require('opencv4nodejs');

const findShape = async () => {
  const input = await cv.imreadAsync('blueprint.jpg');
  const pattern = await cv.imreadAsync('calibrationTarget.png');
  const cannyInput = await cv.applyColorMap(input, cv.COLOR_BGR2GRAY).canny(200, 100);
  const grayPattern = await cv.applyColorMap(pattern, cv.COLOR_BGR2GRAY);
  const inputSize = Math.max(input.cols, input.rows);

  let bestMatch = {
    maxVal: 0,
  };
  const loopSizes = (start, end, step) => {
    console.log({start, end, step});

    for (let scale = start; scale > end; scale -= step) {
      const resized = grayPattern
        .resize(Math.round(scale * grayPattern.sizes[1]), Math.round(scale * grayPattern.sizes[0]))
        .canny(200, 100);

      const matched = cannyInput.matchTemplate(resized, cv.TM_CCOEFF);
      const {maxVal, maxLoc} = matched.minMaxLoc();
      const {x, y} = maxLoc;

      if (maxVal > bestMatch.maxVal) {
        const adjustment = (resized.cols * 20) / 300;

        bestMatch.maxVal = maxVal;
        bestMatch.scale = scale;
        bestMatch.x = x + adjustment;
        bestMatch.y = y + adjustment;
        bestMatch.width = resized.cols - adjustment * 2;
        bestMatch.height = resized.rows - adjustment * 2;
      }
    }

    if (step <= 0.005) return;
    const newStep = step / 2;
    loopSizes(bestMatch.scale + newStep, bestMatch.scale - newStep, newStep);
  };

  loopSizes(1, 0.3, 0.1);

  const calibrationPoints = [
    {x: bestMatch.x / inputSize, y: bestMatch.y / inputSize},
    {
      x: (bestMatch.x + bestMatch.width) / inputSize,
      y: (bestMatch.y + bestMatch.height) / inputSize,
    },
    {x: bestMatch.x / inputSize, y: (bestMatch.y + bestMatch.height) / inputSize},
  ];

  //   input.drawRectangle(
  //     new cv.Rect(bestMatch.x, bestMatch.y, bestMatch.width, bestMatch.height),
  //     new cv.Vec(0, 255, 0),
  //     2,
  //     cv.LINE_8
  //   );

  console.log(calibrationPoints);

  cv.imshow("We've found Waldo!", input);
  cv.waitKey();
};

findShape();
