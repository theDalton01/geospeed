import "./css/style.css";
import { createTestPage } from "./js/testPage.js";
import { handleLocationModal } from "./js/modal.js";

document.addEventListener("DOMContentLoaded", () => {
    handleLocationModal();
    createTestPage();
});
