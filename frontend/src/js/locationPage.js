// Import the function to create the speed test page, allowing for easy page switching.
import { createTestPage } from "./testPage.js";

// importing ISP logos
import mtnLogo from "../../assets/mtn.svg";
import gloLogo from "../../assets/glo.svg";
import airtelLogo from "../../assets/airtel.svg";
import ni9MobileLogo from "../../assets/9mobile.svg";

// A global variable to hold the complete details of the location selected by the user.
// This will be populated by the Google Places Autocomplete listener.
let selectedPlace = null;

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

  // Create the text input field for location searching.
  const locationInput = document.createElement("input");
  locationInput.type = "text";
  locationInput.placeholder = "e.g. Lagos, NG";
  locationInput.className = "location-input";

  // --- Google Places API Integration ---
  // Attach the Google Places Autocomplete functionality to the input field.
  // This enables location suggestions as the user types.
  const autocomplete = new google.maps.places.Autocomplete(locationInput);

  // Add a listener that fires when the user selects a place from the autocomplete dropdown.
  autocomplete.addListener("place_changed", () => {
    // When a place is selected, get the full place details and store them.
    selectedPlace = autocomplete.getPlace();
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
    
    // test functionality //
    selectedPlace = {
      geometry: {
        location: {
          lat: () => 1.23,
          lng: () => 4.56,
        },
      },
    };

    // Ensure a place has been selected and has geometry data.
    if (selectedPlace && selectedPlace.geometry) {
      // Extract the latitude and longitude from the selected place's geometry.
      const lat = selectedPlace.geometry.location.lat();
      const lng = selectedPlace.geometry.location.lng();

      // Log the coordinates to the console.
      // In a real application, this is where you would send the lat and lng to your backend.
      console.log(`Latitude: ${lat}, Longitude: ${lng}`);

      // Simulate backend call
      setTimeout(() => {
        loadingSpinner.style.display = "none";
        ispList.style.display = "block";
      }, 2000); // Simulate 2 seconds delay
    } else {
      // If no location was selected, inform the user/developer.
      console.log("No location selected");
      loadingSpinner.style.display = "none"; // Hide spinner if no location
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

  // Loop through the array to create a card for each ISP.
  isps.forEach((isp) => {
    const ispCard = document.createElement("div");
    ispCard.className = "isp-card";

    const ispLogoContainer = document.createElement("div");
    ispLogoContainer.className = "isp-logo-container";
    // Create an img element for the logo.
    const ispLogo = document.createElement("img");
    ispLogo.className = "isp-logo";
    // Set the src to the imported logo file.
    ispLogo.src = isp.logo;
    ispLogo.alt = `${isp.name} logo`; // Add alt text for accessibility.
    ispLogoContainer.appendChild(ispLogo);

    const ispNameContainer = document.createElement("div");
    ispNameContainer.className = "isp-name-container";
    const ispName = document.createElement("span");
    ispName.className = "isp-name";
    ispName.textContent = isp.name;
    ispNameContainer.appendChild(ispName);

    const avgSpeed = document.createElement("span");
    avgSpeed.className = "avg-speed";
    avgSpeed.textContent = "10 Mbps"; // Using placeholder text for the speed.

    // Assemble the card by appending the logo, name, and speed.
    ispCard.appendChild(ispLogoContainer);
    ispCard.appendChild(ispNameContainer);
    ispCard.appendChild(avgSpeed);

    // Add the newly created card to the ISP list.
    ispList.appendChild(ispCard);
  });

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
