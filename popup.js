const statisticsElem = document.getElementById("statistics");

statisticsElem.data = {
  maxHR: null,
  restingHR: null,
  heartRates: [180, 178, 145, 144, 136, 145, 146, 157],
  stats: {
    maximum: null,
    minimum: null,
    average: null,
    median: null,
    q3: null,
    q1: null,
  },
};

document.getElementById("maxHR").addEventListener("input", (event) => {
  statisticsElem.data.maxHR = event.target.value;
  statisticsElem.plotHeartRateZones();
});

document.getElementById("restingHR").addEventListener("input", (event) => {
  statisticsElem.data.restingHR = event.target.value;
  statisticsElem.plotHeartRateZones();
});

statisticsElem.calculateStats = function () {
  const values = this.data.heartRates.map((hr) => hr.value);
  values.sort((a, b) => a - b);
  const len = values.length;
  const q1 = values[Math.floor(len / 4)];
  const median = values[Math.floor(len / 2)];
  const q3 = values[Math.floor((3 * len) / 4)];
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / len;
  this.data.stats = {
    maximum: Math.max(...values),
    minimum: Math.min(...values),
    average: average.toFixed(2),
    median: median,
    q3: q3,
    q1: q1,
  };
  this.updateStatisticsInDOM();
};

statisticsElem.updateStatisticsInDOM = function () {
  document.getElementById("maximum").innerText = this.data.stats.maximum;
  document.getElementById("minimum").innerText = this.data.stats.minimum;
  document.getElementById("average").innerText = this.data.stats.average;
  document.getElementById("median").innerText = this.data.stats.median;
  document.getElementById("q3").innerText = this.data.stats.q3;
  document.getElementById("q1").innerText = this.data.stats.q1;
};

statisticsElem.plotRawHeartRate = function () {
  const heartRates = this.data.heartRates;
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
};

statisticsElem.plotBoxPlot = function () {
  const values = this.data.heartRates.map((hr) => hr.value);
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
};

statisticsElem.plotHeartRateZones = function () {
  if (this.data.maxHR && this.data.restingHR) {
    const heartRates = this.data.heartRates.map((hr) => hr.value);
    const maxHR = this.data.maxHR;
    const restingHR = this.data.restingHR;
    const zones = [0, 0, 0, 0, 0];
    heartRates.forEach((hr) => {
      const percentage = ((hr - restingHR) / (maxHR - restingHR)) * 100;
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
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayData") {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(request.data, "text/xml");

    const trackpoints = xmlDoc.getElementsByTagName("Trackpoint");
    const heartRates = Array.from(trackpoints).map((trackpoint) => {
      const timestamp = trackpoint.getElementsByTagName("Time")[0].textContent;
      const value = Number(
        trackpoint.getElementsByTagName("Value")[0].textContent
      );
      return { timestamp, value };
    });

    statisticsElem.data.heartRates = heartRates;
    statisticsElem.calculateStats();
    statisticsElem.plotRawHeartRate();
    statisticsElem.plotBoxPlot();
    statisticsElem.plotHeartRateZones();
  }
});
