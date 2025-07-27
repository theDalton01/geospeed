// Import the function to create the speed test page, allowing for easy page switching.
import { createTestPage } from "./testPage.js";

// importing ISP logos
import mtnLogo from "../../assets/mtn.svg";
import gloLogo from "../../assets/glo.svg";
import airtelLogo from "../../assets/airtel.svg";
import ni9MobileLogo from "../../assets/9mobile.svg";

// Beta test locations for FUTA
const BETA_LOCATIONS = [
  {
    name: "School of Engineering and Engineering Technology, FUTA (SEET)",
    shortName: "SEET",
    latitude: 7.30334,
    longitude: 5.13612
  },
  {
    name: "School of Agriculture and Agricultural Engineering, FUTA (SAAT)",
    shortName: "SAAT",
    latitude: 7.30176,
    longitude: 5.13923
  },
  {
    name: "School of Computing, FUTA (SOC)",
    shortName: "SOC",
    latitude: 7.30000, // Placeholder value
    longitude: 5.13500 // Placeholder value
  }
];

// Export beta locations for use in speedtest-integration.js
export { BETA_LOCATIONS };

/**
 * Dynamically creates and renders the "Check Location Speed" page.
 * This function builds all the necessary HTML elements in JavaScript,
 * attaches event listeners, and integrates the Google Places API.
 */
export function createLocationPage() {
  // Find the main container element in the DOM. All page content will be injected here.
  const container = document.querySelector("div.container");
  if (!container) {
    // If the container doesn't exist, log an error and stop execution.
    console.error("The container element was not found in the DOM.");
    return;
  }
  // Clear any previous content from the container to make way for the new page.
  container.innerHTML = "";

  // Create the header section of the page.
  const header = document.createElement("header");
  const startTestBtn = document.createElement("button");
  startTestBtn.id = "startTestBtn";
  startTestBtn.textContent = "Start test";
  header.appendChild(startTestBtn);

  // Add a click event listener to the "Start test" button.
  // When clicked, it will call createTestPage() to switch back to the speed test view.
  startTestBtn.addEventListener("click", () => {
    createTestPage();
  });

  // Create the main content area that will hold the location input and check button.
  const mainContent = document.createElement("div");
  mainContent.className = "main-content";

  // Create the text input field for location searching (no datalist to avoid dropdown arrow)
  const locationInput = document.createElement("input");
  locationInput.type = "text";
  locationInput.placeholder = "e.g. SEET, SAAT, SOC";
  locationInput.className = "location-input";

  // Handle input changes to auto-expand acronyms
  locationInput.addEventListener("input", (e) => {
    const inputValue = e.target.value.trim();

    // Check if user typed an acronym and auto-expand to full name
    const matchingLocation = BETA_LOCATIONS.find(location =>
      location.shortName.toLowerCase() === inputValue.toLowerCase()
    );

    if (matchingLocation && inputValue.length <= 4) { // Only expand short inputs (acronyms)
      // Use setTimeout to avoid conflicts with datalist
      setTimeout(() => {
        locationInput.value = matchingLocation.name;
      }, 100);
    }
  });

  // Create the "Check" button.
  const checkButton = document.createElement("button");
  checkButton.textContent = "Check";
  checkButton.className = "check-btn";

  // Add a click event listener to the "Check" button.
  checkButton.addEventListener("click", () => {
    // Show loading spinner and hide ISP list
    loadingSpinner.style.display = "block";
    ispList.style.display = "none";

    // Get the input value and find matching location
    const inputValue = locationInput.value.trim();
    let selectedLocation = null;

    // Find location by short name or full name
    selectedLocation = BETA_LOCATIONS.find(location =>
      location.shortName.toLowerCase() === inputValue.toLowerCase() ||
      location.name.toLowerCase() === inputValue.toLowerCase()
    );

    if (selectedLocation) {
      const lat = selectedLocation.latitude;
      const lng = selectedLocation.longitude;

      console.log(`Selected: ${selectedLocation.name} - Lat: ${lat}, Lng: ${lng}`);

      // Call the backend API
      getAverageSpeeds(lat, lng)
        .then(speedData => {
          loadingSpinner.style.display = "none";
          ispList.style.display = "block";
          updateIspCards(speedData); // Update ISP cards with fetched data
        })
        .catch(error => {
          console.error("Error fetching speed data:", error);
          loadingSpinner.style.display = "none";
          // Optionally, display an error message to the user
        });
    } else {
      // If no valid location was selected, inform the user
      console.log("Please select a valid location from the list");
      loadingSpinner.style.display = "none"; // Hide spinner if no location

      // Show error message to user
      alert("Please select a valid location: SEET, SAAT, or SOC");
    }
  });

  // Add the location input and "Check" button to the main content area.
  mainContent.appendChild(locationInput);
  mainContent.appendChild(checkButton);

  // Create loading visual
  const loadingSpinner = document.createElement("div");
  loadingSpinner.className = "loading-spinner";
  loadingSpinner.style.display = "none"; // Initially hidden
  mainContent.appendChild(loadingSpinner);

  // Create the container for the list of Internet Service Providers (ISPs).
  const ispList = document.createElement("div");
  ispList.className = "isp-list";
  ispList.style.display = "none"; // Initially hide the ISP list

  // An array of ISP data, including names and the imported logo assets.
  const isps = [
    { name: "MTN", logo: mtnLogo },
    { name: "Glo", logo: gloLogo },
    { name: "Airtel", logo: airtelLogo },
    { name: "9mobile", logo: ni9MobileLogo },
  ];

  // Function to fetch average speeds from the backend
  async function getAverageSpeeds(latitude, longitude) {
    try {
      const baseUrl = "https://api-staging-bf57.up.railway.app";
      const response = await fetch(`${baseUrl}/api/average-speed?latitude=${latitude}&longitude=${longitude}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch average speeds:", error);
      throw error; // Re-throw to be caught by the .catch in the event listener
    }
  }

  // Function to update ISP cards with actual speed data
  function updateIspCards(speedData) {
    ispList.innerHTML = ""; // Clear existing cards
    isps.forEach((isp) => {
      const ispCard = document.createElement("div");
      ispCard.className = "isp-card";

      const ispLogoContainer = document.createElement("div");
      ispLogoContainer.className = "isp-logo-container";
      const ispLogo = document.createElement("img");
      ispLogo.className = "isp-logo";
      ispLogo.src = isp.logo;
      ispLogo.alt = `${isp.name} logo`;
      ispLogoContainer.appendChild(ispLogo);

      const ispNameContainer = document.createElement("div");
      ispNameContainer.className = "isp-name-container";
      const ispName = document.createElement("span");
      ispName.className = "isp-name";
      ispName.textContent = isp.name;
      ispNameContainer.appendChild(ispName);

      const speedInfoContainer = document.createElement("div");
      speedInfoContainer.className = "speed-info-container";

      const matchingSpeed = speedData.find(data => data.ispinfo === isp.name);

      // Determine if we should show "Not Enough Data" as a single message
      const showSingleNoData = !matchingSpeed ||
        (matchingSpeed.average_download === "Not Enough Data" &&
          matchingSpeed.average_upload === "Not Enough Data");

      if (showSingleNoData) {
        const noDataSpan = document.createElement("span");
        noDataSpan.className = "avg-speed";
        noDataSpan.textContent = "Not Enough Data";
        speedInfoContainer.appendChild(noDataSpan);
      } else {
        // Display both download and upload speeds
        const avgDownloadSpeed = document.createElement("span");
        avgDownloadSpeed.className = "avg-speed download";
        avgDownloadSpeed.textContent = matchingSpeed.average_download === "Not Enough Data" ? "Not Enough Data" : `${matchingSpeed.average_download.toFixed(2)} Mbps ↓`;
        speedInfoContainer.appendChild(avgDownloadSpeed);

        const avgUploadSpeed = document.createElement("span");
        avgUploadSpeed.className = "avg-speed upload";
        avgUploadSpeed.textContent = matchingSpeed.average_upload === "Not Enough Data" ? "Not Enough Data" : `${matchingSpeed.average_upload.toFixed(2)} Mbps ↑`;
        speedInfoContainer.appendChild(avgUploadSpeed);
      }

      ispCard.appendChild(ispLogoContainer);
      ispCard.appendChild(ispNameContainer);
      ispCard.appendChild(speedInfoContainer); // Append the new container

      ispList.appendChild(ispCard);
    });
  }

  //footer
  const footer = document.createElement("footer");
  footer.innerHTML =
    'Powered by <a href="https://github.com/librespeed/speedtest">Librespeed</a>';

  // Append all the major sections (header, main content, ISP list) to the main container.
  container.appendChild(header);
  container.appendChild(mainContent);
  container.appendChild(ispList);
  container.appendChild(footer);
}
("");
