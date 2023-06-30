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
  maxHR = event.target.value;
  plotHeartRateZones();
});

document.getElementById("restingHR").addEventListener("input", (event) => {
  restingHR = event.target.value;
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

  Plotly.newPlot("raw-heart-rate", data);
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
    },
  ];

  Plotly.newPlot("boxplot", data);
}

function plotHeartRateZones() {
  if (maxHR && restingHR) {
    const values = heartRates.map((hr) => hr.value);
    const zones = [0, 0, 0, 0, 0];

    values.forEach((value) => {
      const percentage = ((value - restingHR) / (maxHR - restingHR)) * 100;
      if (percentage < 60) zones[0]++;
      else if (percentage < 70) zones[1]++;
      else if (percentage < 80) zones[2]++;
      else if (percentage < 90) zones[3]++;
      else zones[4]++;
    });

    const data = [
      {
        x: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
        y: zones,
        type: "bar",
      },
    ];

    Plotly.newPlot("heart-rate-zones", data);
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

    calculateStats();
    plotRawHeartRate();
    plotBoxPlot();
    plotHeartRateZones();
  }
});
