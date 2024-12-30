import { loadCarsView } from "./cars.js";
import { loadBookingsView } from "./bookings.js";
import { loadCustomersView } from "./customers.js";
import { isAdmin, showAlert, renderLoader, removeLoader } from "./utils.js";

const appContainer = document.getElementById("app-container");
const navigationContainer = document.getElementById("nav-btns");
const navigationContainerMobile = document.getElementById("sidebar-nav-btns");
const loginContainer = document.getElementById("login-container");
const loginForm = document.getElementById("login-form");

// Global sort state for tables(not cars)
export let currentSort = {
  column: null,
  ascending: true,
};

export function updateSortIcons(activeColumn) {
  document.querySelectorAll(".sort-icon").forEach((icon) => {
    const column = icon.closest("th").dataset.column;
    if (column === activeColumn) {
      icon.textContent = currentSort.ascending ? "↑" : "↓";
    } else {
      icon.textContent = "↕️";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("hamburger")
    .addEventListener("click", toggleHamburgerMenu);
  document
    .getElementById("load-cars-btn")
    .addEventListener("click", loadCarsView);
  document
    .getElementById("load-cars-btn-mobile")
    .addEventListener("click", loadCarsView);
  document
    .getElementById("load-bookings-btn")
    .addEventListener("click", loadBookingsView);
  document
    .getElementById("load-bookings-btn-mobile")
    .addEventListener("click", loadBookingsView);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document
    .getElementById("logout-btn-mobile")
    .addEventListener("click", logout);
  const auth = sessionStorage.getItem("auth");

  if (auth) {
    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");

    if (isAdmin()) {
      const logoutButton = navigationContainer.querySelector("#logout-btn");
      const logoutButtonMobile =
        navigationContainerMobile.querySelector("#logout-btn-mobile");
      const adminCustomerButton = document.createElement("button");
      const adminCustomerButtonMobile = document.createElement("button");

      adminCustomerButton.textContent = "Customers";
      adminCustomerButton.addEventListener("click", loadCustomersView);
      adminCustomerButton.id = "admin-customer-btn";
      adminCustomerButton.classList.add("nav-btn");
      navigationContainer.insertBefore(adminCustomerButton, logoutButton);

      adminCustomerButtonMobile.textContent = "Customers";
      adminCustomerButtonMobile.addEventListener("click", loadCustomersView);
      adminCustomerButtonMobile.id = "admin-customer-btn-mobile";
      adminCustomerButtonMobile.classList.add("nav-btn");
      navigationContainerMobile.insertBefore(
        adminCustomerButtonMobile,
        logoutButtonMobile
      );
    }
    loadCarsView();
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    renderLoader();
    const response = await fetch("http://localhost:8080/api/v1/login/me", {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
      },
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const userDetails = await response.json();
    removeLoader();
    sessionStorage.setItem("auth", btoa(`${username}:${password}`));
    sessionStorage.setItem("userDetails", JSON.stringify(userDetails));

    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");

    if (!document.getElementById("admin-customer-btn")) {
      if (isAdmin()) {
        const logoutButton = navigationContainer.querySelector("#logout-btn");
        const logoutButtonMobile =
          navigationContainerMobile.querySelector("#logout-btn-mobile");
        const adminCustomerButton = document.createElement("button");
        const adminCustomerButtonMobile = document.createElement("button");

        adminCustomerButton.textContent = "Customers";
        adminCustomerButton.addEventListener("click", loadCustomersView);
        adminCustomerButton.id = "admin-customer-btn";
        adminCustomerButton.classList.add("nav-btn");
        navigationContainer.insertBefore(adminCustomerButton, logoutButton);

        adminCustomerButtonMobile.textContent = "Customers";
        adminCustomerButtonMobile.addEventListener("click", loadCustomersView);
        adminCustomerButtonMobile.id = "admin-customer-btn-mobile";
        adminCustomerButtonMobile.classList.add("nav-btn");
        navigationContainerMobile.insertBefore(
          adminCustomerButtonMobile,
          logoutButtonMobile
        );
      }
    }

    loadCarsView();
  } catch (error) {
    removeLoader();
    showAlert("Invalid username or password", "negative");
    console.error("Login error:", error);
  }
});

function logout() {
  const adminButton = document.getElementById("admin-customer-btn");
  if (adminButton) {
    adminButton.remove();
  }

  const adminButtonMobile = document.getElementById(
    "admin-customer-btn-mobile"
  );
  if (adminButtonMobile) {
    adminButtonMobile.remove();
  }

  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("userDetails");

  appContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");

  loginForm.reset();
}

function toggleHamburgerMenu() {
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburger");

  sidebar.classList.toggle("open");
  hamburger.classList.toggle("open");
}

document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburger");

  if (
    !sidebar.contains(event.target) &&
    !hamburger.contains(event.target) &&
    sidebar.classList.contains("open")
  ) {
    sidebar.classList.remove("open");
    hamburger.classList.remove("open");
  }
});
