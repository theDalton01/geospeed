import { Speedtest } from "./speedtest.js";
import { BETA_LOCATIONS } from "./locationPage.js";

function I(i) {
  return document.getElementById(i);
}

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Function to check if user is within 200m of any beta location
function isWithinBetaZone(userLat, userLng) {
  const RADIUS_METERS = 200;

  for (const location of BETA_LOCATIONS) {
    const distance = calculateDistance(userLat, userLng, location.latitude, location.longitude);
    if (distance <= RADIUS_METERS) {
      console.log(`User is within ${Math.round(distance)}m of ${location.shortName}`);
      return true;
    }
  }

  console.log("User is not within 200m of any beta test location");
  return false;
}

//INITIALIZE SPEEDTEST WITH CUSTOM BACKEND URL
var s = null; // Will be initialized when needed

function initializeSpeedtest() {
  if (s !== null) return s; // Already initialized

  try {
    s = new Speedtest(); //create speedtest object

    // Set the backend URLs to your server
    // const baseUrl = 'https://netscope-production.up.railway.app/speedtest/backend';
    // const baseUrl = "https://api-staging-bf57.up.railway.app/speedtest/backend";
    const baseUrl = "api-production-473b.up.railway.app";
    s.setParameter("url_dl", baseUrl + "/garbage.php");
    s.setParameter("url_ul", baseUrl + "/empty.php");
    s.setParameter("url_ping", baseUrl + "/empty.php");
    s.setParameter("url_getIp", baseUrl + "/getIP.php");

    return s;
  } catch (error) {
    console.error("Failed to initialize Speedtest:", error);
    s = null;
    return null;
  }
}

// Function to get current location and set up telemetry
function setupTelemetryWithCurrentLocation(speedtestInstance) {
  return new Promise((resolve) => {
    // Check if user has previously granted location permission
    const hasLocationPermission = localStorage.getItem('hasVisited') === 'true';

    if (!hasLocationPermission) {
      console.log("Telemetry disabled - user hasn't granted location permission");
      resolve();
      return;
    }

    // Get fresh location data for this speed test
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentLocationData = {
          latitude: latitude,
          longitude: longitude,
          accuracy: accuracy || "unknown"
        };

        // Check if current location is within beta zone
        if (isWithinBetaZone(latitude, longitude)) {
          speedtestInstance.setParameter("telemetry_level", "basic");
          speedtestInstance.setParameter(
            "url_telemetry",
            "https://api-staging-bf57.up.railway.app/speedtest/results/telemetry.php"
          );
          speedtestInstance.setParameter("telemetry_extra", JSON.stringify(currentLocationData));
          console.log("Telemetry enabled - user is within beta test zone");
        } else {
          console.log("Telemetry disabled - user is outside beta test zones");
        }
        resolve();
      },
      (error) => {
        console.error("Failed to get current location:", error);
        console.log("Telemetry disabled - location access failed");
        resolve();
      },
      {
        timeout: 30000, // 30 second timeout (increased)
        maximumAge: 300000,  // Allow 5-minute cached location
        enableHighAccuracy: false // Use faster, less accurate location
      }
    );
  });
}

var meterBk = /Trident.*rv:(\d+\.\d+)/i.test(navigator.userAgent)
  ? "#EAEAEA"
  : "#80808040";
var dlColor = "#6060AA",
  ulColor = "#616161";
var progColor = meterBk;

//CODE FOR GAUGES
function drawMeter(c, amount, bk, fg, progress, prog) {
  var ctx = c.getContext("2d");
  var dp = window.devicePixelRatio || 1;
  var cw = c.clientWidth * dp,
    ch = c.clientHeight * dp;
  var sizScale = ch * 0.0055;
  if (c.width == cw && c.height == ch) {
    ctx.clearRect(0, 0, cw, ch);
  } else {
    c.width = cw;
    c.height = ch;
  }
  ctx.beginPath();
  ctx.strokeStyle = bk;
  ctx.lineWidth = 12 * sizScale;
  ctx.arc(
    c.width / 2,
    c.height - 58 * sizScale,
    c.height / 1.8 - ctx.lineWidth,
    -Math.PI * 1.1,
    Math.PI * 0.1
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = fg;
  ctx.lineWidth = 12 * sizScale;
  ctx.arc(
    c.width / 2,
    c.height - 58 * sizScale,
    c.height / 1.8 - ctx.lineWidth,
    -Math.PI * 1.1,
    amount * Math.PI * 1.2 - Math.PI * 1.1
  );
  ctx.stroke();
  if (typeof progress !== "undefined") {
    ctx.fillStyle = prog;
    ctx.fillRect(
      c.width * 0.3,
      c.height - 16 * sizScale,
      c.width * 0.4 * progress,
      4 * sizScale
    );
  }
}
function mbpsToAmount(s) {
  return 1 - 1 / Math.pow(1.3, Math.sqrt(s));
}
function format(d) {
  d = Number(d);
  if (d < 10) return d.toFixed(2);
  if (d < 100) return d.toFixed(1);
  return d.toFixed(0);
}

//UI CODE
var uiData = null;
export function startStop() {
  // Initialize speedtest if not already done
  if (s === null) {
    s = initializeSpeedtest();
    if (s === null) {
      console.error("Failed to initialize speedtest. Please try again.");
      return;
    }
  }

  if (s.getState() == 3) {
    //speedtest is running, abort
    s.abort();
    let data = null;
    I("startStopBtn").className = "";
    initUI();
  } else {
    //test is not running, begin
    I("startStopBtn").className = "running";

    // Get current location and set up telemetry before starting the test
    setupTelemetryWithCurrentLocation(s).then(() => {
      s.onupdate = function (data) {
        uiData = data;
      };
      s.onend = function (aborted) {
        I("startStopBtn").className = "";
        updateUI(true);
      };
      s.start();
    });
  }
}

//this function reads the data sent back by the test and updates the UI
function updateUI(forced) {
  if (!forced && (s === null || s.getState() != 3)) return;
  if (uiData == null) return;
  var status = uiData.testState;

  // Parse ISP from clientIp and display formatted text
  const clientIpText = uiData.clientIp;
  let extractedIspName = null;

  // Extract ISP name from the format: "IP - ISP NAME Communication limited, Nigeria"
  const ispMatch = clientIpText.match(/\d+\.\d+\.\d+\.\d+\s*-\s*(.+?)(?:\s*Communication\s*[Ll]imited)?,\s*Nigeria/i);
  if (ispMatch && ispMatch[1]) {
    extractedIspName = ispMatch[1].trim();
  }

  const ipArea = I("ipArea");
  if (ipArea) {
    ipArea.innerHTML = ""; // Clear previous content

    if (extractedIspName) {
      // Display formatted ISP text
      const ipSpan = document.createElement("span");
      ipSpan.id = "ip";
      ipSpan.textContent = `Internet Service Provider: ${extractedIspName}`;
      ipArea.appendChild(ipSpan);
    } else {
      // Fallback to displaying the original text if extraction fails
      const ipSpan = document.createElement("span");
      ipSpan.id = "ip";
      ipSpan.textContent = clientIpText;
      ipArea.appendChild(ipSpan);
    }
  }

  const dlText = I("dlText");
  const ulText = I("ulText");
  const pingText = I("pingText");
  const jitText = I("jitText");
  const dlMeter = I("dlMeter");
  const ulMeter = I("ulMeter");

  if (dlText) {
    dlText.textContent = status == 1 && uiData.dlStatus == 0 ? "..." : format(uiData.dlStatus);
  }
  if (dlMeter) {
    drawMeter(
      dlMeter,
      mbpsToAmount(Number(uiData.dlStatus * (status == 1 ? oscillate() : 1))),
      meterBk,
      dlColor,
      Number(uiData.dlProgress),
      progColor
    );
  }
  if (ulText) {
    ulText.textContent = status == 3 && uiData.ulStatus == 0 ? "..." : format(uiData.ulStatus);
  }
  if (ulMeter) {
    drawMeter(
      ulMeter,
      mbpsToAmount(Number(uiData.ulStatus * (status == 3 ? oscillate() : 1))),
      meterBk,
      ulColor,
      Number(uiData.ulProgress),
      progColor
    );
  }
  if (pingText) {
    pingText.textContent = format(uiData.pingStatus);
  }
  if (jitText) {
    jitText.textContent = format(uiData.jitterStatus);
  }
}
function oscillate() {
  return 1 + 0.02 * Math.sin(Date.now() / 100);
}

//update the UI every frame
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback, element) {
    setTimeout(callback, 1000 / 60);
  };
function frame() {
  requestAnimationFrame(frame);
  updateUI();
}
frame(); //start frame loop
//function to (re)initialize UI
export function initUI() {
  // Check if elements exist before trying to access them
  const dlMeter = I("dlMeter");
  const ulMeter = I("ulMeter");
  const dlText = I("dlText");
  const ulText = I("ulText");
  const pingText = I("pingText");
  const jitText = I("jitText");
  const ip = I("ip");

  if (dlMeter) drawMeter(dlMeter, 0, meterBk, dlColor, 0);
  if (ulMeter) drawMeter(ulMeter, 0, meterBk, ulColor, 0);
  if (dlText) dlText.textContent = "";
  if (ulText) ulText.textContent = "";
  if (pingText) pingText.textContent = "";
  if (jitText) jitText.textContent = "";
  if (ip) ip.textContent = "";
}
