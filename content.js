let isDragging = false;
let initialX = 0;
let initialSpeed = 1;
let isRecognizing = false; // Track if speech recognition is active

// Initialize Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false; // Do not keep recognizing speech continuously
recognition.interimResults = false; // Only finalize results

const handleVideoElement = (video) => {
  video.addEventListener("mousedown", (event) => {
    isDragging = true;
    initialX = event.clientX;
    initialSpeed = video.playbackRate;
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (isDragging) {
      const deltaX = event.clientX - initialX;
      const newSpeed = Math.max(0.25, Math.min(3, initialSpeed + deltaX / 100)); // Adjust the divisor to control sensitivity
      video.playbackRate = newSpeed;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
    }
  });

  document.addEventListener("mouseleave", () => {
    if (isDragging) {
      isDragging = false;
    }
  });

  // Keep existing feature for setting speed via message
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setSpeed") {
      if (video) {
        video.playbackRate = request.speed;
        sendResponse({ status: "success" });
      } else {
        sendResponse({ status: "fail" });
      }
    }
  });

  // Handle voice commands
  recognition.onresult = (event) => {
    const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
    console.log("Recognized command:", transcript);

    let newSpeed;
    const speedRegex = /(\d+(\.\d+)?)\s?(x|times)/i;
    const match = transcript.match(speedRegex);
  
    if (match) {
      const speed = parseFloat(match[1]);
      if (speed >= 0.25 && speed <= 3) {
        newSpeed = speed;
      }
    }
    // if (transcript.includes("speed up") || transcript.includes("faster")) {
    //   newSpeed = Math.min(3, video.playbackRate + 0.1); // Increase speed
    // } else if (transcript.includes("slow down") || transcript.includes("slower")) {
    //   newSpeed = Math.max(0.25, video.playbackRate - 0.1); // Decrease speed
    // }

    if (newSpeed !== undefined) {
      video.playbackRate = newSpeed;
      alert(`Video speed set to ${newSpeed}`);
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.log("Speech recognition ended.");
    if (isRecognizing) {
      recognition.start(); // Restart recognition after ending if still active
    }
  };

  // Start speech recognition if it's not already active
  if (isRecognizing) {
    recognition.start();
  }
};

// Handle keydown and keyup events for "p" key
document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyP') {
    event.preventDefault(); // Prevent default "p" key behavior
    if (!isRecognizing) {
      isRecognizing = true;
      alert("speech starting");
      recognition.start(); // Start speech recognition
      console.log("Speech recognition started.");
    }
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyP') {
    event.preventDefault(); // Prevent default "p" key behavior
    if (isRecognizing) {
      isRecognizing = false;
      recognition.stop(); // Stop speech recognition
      console.log("Speech recognition stopped.");
    }
  }
});

// Use MutationObserver to wait for the video element to be added
const observer = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    if (mutation.type === 'childList') {
      const video = document.querySelector("video");
      if (video) {
        handleVideoElement(video);
        observer.disconnect(); // Stop observing once video element is found
        break;
      }
    }
  }
});

// Start observing the document for changes
observer.observe(document.body, { childList: true, subtree: true });
