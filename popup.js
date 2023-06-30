document.getElementById("statistics").data = {
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

document.getElementById("statistics").updateMaxHR = function (maxHR) {
  this.data.maxHR = maxHR;
  this.plotHeartRateZones();
};

document.getElementById("statistics").updateRestingHR = function (restingHR) {
  this.data.restingHR = restingHR;
  this.plotHeartRateZones();
};

document.getElementById("statistics").calculateStats = function () {
  const heartRates = this.data.heartRates;
  heartRates.sort((a, b) => a - b);
  const len = heartRates.length;
  const q1 = heartRates[Math.floor(len / 4)];
  const median = heartRates[Math.floor(len / 2)];
  const q3 = heartRates[Math.floor((3 * len) / 4)];
  const sum = heartRates.reduce((a, b) => a + b, 0);
  const average = sum / len;
  this.data.stats = {
    maximum: Math.max(...heartRates),
    minimum: Math.min(...heartRates),
    average: average.toFixed(2),
    median: median,
    q3: q3,
    q1: q1,
  };
};

document.getElementById("statistics").plotRawHeartRate = function () {
  const heartRates = this.data.heartRates;
  const data = [
    {
      y: heartRates,
      type: "scatter",
    },
  ];
  Plotly.newPlot("raw-heart-rate", data);
};

document.getElementById("statistics").plotBoxPlot = function () {
  const heartRates = this.data.heartRates;
  const data = [
    {
      y: heartRates,
      boxpoints: "all",
      jitter: 0.3,
      pointpos: -1.8,
      type: "box",
    },
  ];
  Plotly.newPlot("boxplot", data);
};

document.getElementById("statistics").plotHeartRateZones = function () {
  if (this.data.maxHR && this.data.restingHR) {
    const heartRates = this.data.heartRates;
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
    const heartRates = Array.from(
      xmlDoc.getElementsByTagName("HeartRateBpm")
    ).map((elem) => Number(elem.getElementsByTagName("Value")[0].textContent));
    document.getElementById("statistics").data.heartRates = heartRates;
    const statisticsElem = document.getElementById("statistics");
    statisticsElem.calculateStats();
    statisticsElem.plotRawHeartRate();
    statisticsElem.plotBoxPlot();
    statisticsElem.plotHeartRateZones();
  }
});
