let maxHR = null;
let restingHR = null;
let heartRates = [{ timestamp: 1688133600011, value: 139 }];
let stats = {
  maximum: null,
  minimum: null,
  average: null,
  median: null,
  q3: null,
  q1: null,
};

document.getElementById("maxHR").addEventListener("input", (event) => {
  maxHR = parseFloat(event.target.value);
  chrome.storage.sync.set({ maxHR: maxHR }, () => {});
  plotHeartRateZones();
});

document.getElementById("restingHR").addEventListener("input", (event) => {
  restingHR = parseFloat(event.target.value);
  chrome.storage.sync.set({ restingHR: restingHR }, () => {});
  plotHeartRateZones();
});

function calculateStats() {
  const values = heartRates.map((hr) => hr.value).sort((a, b) => a - b);
  const len = values.length;
  stats.q1 = values[Math.floor(len / 4)];
  stats.median = values[Math.floor(len / 2)];
  stats.q3 = values[Math.floor((3 * len) / 4)];
  stats.maximum = Math.max(...values);
  stats.minimum = Math.min(...values);
  stats.average = (values.reduce((a, b) => a + b, 0) / len).toFixed(2);

  updateStatisticsInDOM();
}

function updateStatisticsInDOM() {
  document.getElementById("maximum").innerText = stats.maximum;
  document.getElementById("minimum").innerText = stats.minimum;
  document.getElementById("average").innerText = stats.average;
  document.getElementById("median").innerText = stats.median;
  document.getElementById("q3").innerText = stats.q3;
  document.getElementById("q1").innerText = stats.q1;
}

function plotRawHeartRate() {
  const timestamps = heartRates.map((hr) => hr.timestamp);
  const values = heartRates.map((hr) => hr.value);

  const data = [
    {
      x: timestamps,
      y: values,
      type: "scatter",
      mode: "lines",
    },
  ];

  Plotly.newPlot("raw-heart-rate", data, {
    margin: { t: 5, r: 5, l: 25, b: 30 },
  });
}

function plotBoxPlot() {
  const values = heartRates.map((hr) => hr.value);

  const data = [
    {
      y: values,
      boxpoints: "all",
      jitter: 0.3,
      pointpos: -1.8,
      type: "box",
      name: "Distribution",
    },
  ];

  Plotly.newPlot("boxplot", data, {
    margin: { t: 5, r: 5, l: 50, b: 30 },
  });
}

function plotHeartRateZones() {
  if (maxHR && restingHR) {
    const values = heartRates.map((hr) => hr.value);
    const zoneCounter = [0, 0, 0, 0, 0];

    // Calculate the heart rate zones with the Karvonen formula
    // https://en.wikipedia.org/wiki/Heart_rate#Karvonen_method
    // target heart rate = ((max HR − resting HR) × %Intensity) + resting HR
    values.forEach((value) => {
      const percentage = ((value - restingHR) / (maxHR - restingHR)) * 100;
      if (percentage < 60) zoneCounter[0]++;
      else if (percentage < 70) zoneCounter[1]++;
      else if (percentage < 80) zoneCounter[2]++;
      else if (percentage < 90) zoneCounter[3]++;
      else zoneCounter[4]++;
    });

    // Based on the zoneCounter, calculate the percentage of time spent in each zone
    const total = zoneCounter.reduce((a, b) => a + b, 0);
    zoneCounter.forEach((value, index) => {
      zoneCounter[index] = ((value / total) * 100).toFixed(2);
    });

    // Print the heart rate zones (e.g. 60-70% (133-156))
    const Boundary60 = Math.round(0.6 * (maxHR - restingHR) + restingHR);
    const Boundary70 = Math.round(0.7 * (maxHR - restingHR) + restingHR);
    const Boundary80 = Math.round(0.8 * (maxHR - restingHR) + restingHR);
    const Boundary90 = Math.round(0.9 * (maxHR - restingHR) + restingHR);
    const data = [
      {
        x: [
          `<${Boundary60}`,
          `${Boundary60}-${Boundary70}`,
          `${Boundary70}-${Boundary80}`,
          `${Boundary80}-${Boundary90}`,
          `>${Boundary90}`,
        ],
        y: zoneCounter,
        type: "bar",
      },
    ];

    Plotly.newPlot("heart-rate-zones", data, {
      margin: { t: 5, r: 5, l: 25, b: 30 },
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayData") {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(request.data, "text/xml");

    const trackpoints = xmlDoc.getElementsByTagName("Trackpoint");
    heartRates = Array.from(trackpoints).map((trackpoint) => {
      const timestamp = trackpoint.getElementsByTagName("Time")[0].textContent;
      const value = Number(
        trackpoint.getElementsByTagName("Value")[0].textContent
      );
      return { timestamp, value };
    });

    chrome.storage.sync.get(["maxHR", "restingHR"], (result) => {
      if (result.maxHR) {
        maxHR = result.maxHR;
        document.getElementById("maxHR").value = maxHR;
      }
      if (result.restingHR) {
        restingHR = result.restingHR;
        document.getElementById("restingHR").value = restingHR;
      }

      calculateStats();
      plotRawHeartRate();
      plotBoxPlot();
      plotHeartRateZones();
    });
  }
});
