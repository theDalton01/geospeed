import "./css/style.css";
import { createTestPage } from "./js/dom.js";
import { initUI, startStop } from "./js/speedtest-integration.js";
import { handleLocationModal } from "./js/modal.js";

document.addEventListener("DOMContentLoaded", () => {
    handleLocationModal();
    createTestPage();

    const start = document.getElementById("startStopBtn");
    start.addEventListener("click", () => {
        startStop();
    })

    setTimeout(function () {
      initUI();
    }, 100);
});
