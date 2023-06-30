chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadTCX") {
    const activityId = request.activityId;
    const storageKey = `tcx-${activityId}`;

    // Check if the TCX file is already in local storage
    chrome.storage.local.get([storageKey], (result) => {
      if (result[storageKey]) {
        sendDataToPopup(result[storageKey]);
      } else {
        const tcxUrl = `https://www.strava.com/activities/${activityId}/export_tcx`;
        fetch(tcxUrl, { redirect: "error" })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.text();
          })
          .then((data) => {
            chrome.storage.local.set({ [storageKey]: data }, () => {
              sendDataToPopup(data);
            });
          })
          .catch((error) => {
            console.error(
              `Could not download TCX file for activity ${activityId}`
            );
          });
      }
    });
  }
});

function sendDataToPopup(data) {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") }, (tab) => {
    const listener = (tabId, changeInfo) => {
      if (tabId === tab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.sendMessage(tabId, { action: "displayData", data: data });
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
