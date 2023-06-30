function addButton() {
  const body = document.querySelector("body");
  if (body) {
    const button = document.createElement("button");
    button.textContent = "Analyze your heart rate";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.zIndex = "1000";
    button.style.padding = "10px 20px";
    button.style.fontSize = "16px";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.background = "#ff5722";
    button.style.color = "white";
    button.style.cursor = "pointer";

    button.addEventListener("click", () => {
      const activityId = window.location.pathname.split("/")[2];
      chrome.runtime.sendMessage({
        action: "downloadTCX",
        activityId: activityId,
      });
    });
    body.appendChild(button);
  }
}

const intervalId = setInterval(() => {
  if (document.querySelector("body")) {
    addButton();
    clearInterval(intervalId);
  }
}, 100);
