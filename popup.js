document.getElementById("setSpeed").addEventListener("click", () => {
    const speed = parseFloat(document.getElementById("speed").value);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "setSpeed", speed: speed}, (response) => {
        if (response.status === "success") {
          alert("Speed set to " + speed);
        } else {
          alert("Failed to set speed");
        }
      });
    });
  });
  