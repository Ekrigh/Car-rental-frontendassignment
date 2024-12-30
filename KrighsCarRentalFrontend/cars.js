import {
  isAdmin,
  showConfirmation,
  showAlert,
  renderLoader,
  removeLoader,
} from "./utils.js";
import { showCreateBookingModal } from "./bookings.js";

let cars = [];

export function loadCarsView() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";

  const carsHTML = `
    <div class="cars-view">
    <div class="cars-header">
      <div class="sort-controls">
        <label>Sort by:</label>
        <select id="car-sort-select">
          <option value="name">Name</option>
          <option value="type">Type</option>
        </select>
        <button id="sort-car-btn" class="btn btn-standard">Sort</button>
        </div>
        ${
          isAdmin()
            ? `
        <button id="add-car-btn" class="btn btn-positive">Add New Car</button> `
            : ""
        }
      </div>
      <div id="car-list"></div>
    </div>
  `;

  mainContent.innerHTML = carsHTML;

  document.getElementById("sort-car-btn").addEventListener("click", sortCars);
  const addCarButton = document.getElementById("add-car-btn");
  if (addCarButton) {
    addCarButton.addEventListener("click", () => showManageCarModal());
  }

  initializeCars();
}

async function initializeCars() {
  try {
    cars = await fetchCars();
    renderCars(cars);
  } catch (error) {
    console.error("Error initializing cars:", error);
    showAlert("Failed to load cars. Please try again.", "negative");
  }
}

async function fetchCars() {
  try {
    renderLoader();
    const auth = sessionStorage.getItem("auth");
    const response = await fetch("http://localhost:8080/api/v1/cars", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cars`);
    }
    removeLoader();
    return await response.json();
  } catch (error) {
    removeLoader();
    console.error("Error fetching cars:", error);
    throw error;
  }
}

function renderCars(carList) {
  const carListContainer = document.getElementById("car-list");

  carListContainer.innerHTML = carList
    .map(
      (car) => `
        <div class="car-card">
        <img src="./images/peugeot-308-pezho-belyy-fon-P.jpg" class="car-image">
          <h3>${car.name} ${car.model}</h3>
          <p>Type: ${car.type}</p>
          <p>Price: $${car.price.toFixed(2)}/day</p>
          <p>Features: 
            ${[car.feature1, car.feature2, car.feature3]
              .filter(Boolean)
              .join(" | ")}
          </p>
           ${
             isAdmin()
               ? `
            <button class="edit-car-btn btn btn-standard" data-id="${car.id}">Edit</button>
            <button class="delete-car-btn btn btn-negative" data-id="${car.id}">Delete</button>
          `
               : `<button class="book-car-btn btn btn-standard" data-id="${car.id}">Book Now</button>`
           }
        </div>
      `
    )
    .join("");

  const editButtons = document.querySelectorAll(".edit-car-btn");
  const deleteButtons = document.querySelectorAll(".delete-car-btn");
  const bookButtons = document.querySelectorAll(".book-car-btn");

  editButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const carId = e.target.getAttribute("data-id");
      showManageCarModal(carId);
    })
  );

  deleteButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const carId = e.target.getAttribute("data-id");
      deleteCar(carId);
    })
  );

  bookButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const carId = e.target.getAttribute("data-id");
      showCreateBookingModal(carId);
    })
  );
}

function sortCars() {
  const sortBy = document.getElementById("car-sort-select").value;

  cars.sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "type") {
      return a.type.localeCompare(b.type);
    }
  });

  renderCars(cars);
}

async function showManageCarModal(carId = null) {
  let car = null;
  if (carId) {
    try {
      const auth = sessionStorage.getItem("auth");
      renderLoader();
      const response = await fetch(
        `http://localhost:8080/api/v1/cars/${carId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch car");
      }

      car = await response.json();
      removeLoader();
    } catch (error) {
      removeLoader();
      console.error("Error fetching customer:", error);
      showAlert("Failed to load customer data", "negative");
      return;
    }
  }

  const modal = document.createElement("div");
  modal.className = "modal";
  const isEdit = car !== null;

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${isEdit ? "Edit" : "Add"} Car</h2>
      <form id="carForm">
        <div class="form-group">
          <label>Name:</label>
          <input type="text" id="name" value="${
            isEdit ? car.name : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Model:</label>
          <input type="text" id="model" value="${
            isEdit ? car.model : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Feature 1:</label>
          <input type="text" id="feature1" value="${
            isEdit ? car.feature1 : ""
          }">
        </div>
        <div class="form-group">
          <label>Feature 2:</label>
          <input type="text" id="feature2" value="${
            isEdit ? car.feature2 : ""
          }">
        </div>
        <div class="form-group">
          <label>Feature 3:</label>
          <input type="text" id="feature3" value="${
            isEdit ? car.feature3 : ""
          }">
        </div>
        <div class="form-group">
          <label>Type:</label>
          <input type="text" id="type" value="${
            isEdit ? car.type : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Price:</label>
          <input type="number" id="price" value="${
            isEdit ? car.price : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Booked:</label>
          <input type="number" id="booked" value="${
            isEdit ? car.booked : "0"
          }" required>
        </div>
        <button type="submit" class="btn btn-positive">${
          isEdit ? "Save Changes" : "Add Car"
        }</button>
      </form>
    </div>
  `;

  modal.querySelector(".close").onclick = () => {
    modal.remove();
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  };

  modal.querySelector("#carForm").onsubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateCar(car.id);
    } else {
      await createCar();
    }
  };
  document.body.appendChild(modal);
  return modal;
}

async function createCar() {
  try {
    const auth = sessionStorage.getItem("auth");

    const newCar = {
      name: document.getElementById("name").value,
      model: document.getElementById("model").value,
      feature1: document.getElementById("feature1").value,
      feature2: document.getElementById("feature2").value,
      feature3: document.getElementById("feature3").value,
      type: document.getElementById("type").value,
      price: parseFloat(document.getElementById("price").value),
      booked: parseInt(document.getElementById("booked").value),
    };
    renderLoader();
    const response = await fetch("http://localhost:8080/api/v1/cars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(newCar),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create car: ${errorText}`);
    }
    removeLoader();
    const modal = document.querySelector(".modal");
    modal.remove();
    await initializeCars();
    showAlert("Successfully created car", "positive");
  } catch (error) {
    removeLoader();
    console.error("Error creating car:", error);
    showAlert("Failed to create car", "negative");
  }
}

async function updateCar(carId) {
  try {
    const auth = sessionStorage.getItem("auth");
    const car = {
      id: carId,
      name: document.getElementById("name").value,
      model: document.getElementById("model").value,
      feature1: document.getElementById("feature1").value,
      feature2: document.getElementById("feature2").value,
      feature3: document.getElementById("feature3").value,
      type: document.getElementById("type").value,
      price: parseFloat(document.getElementById("price").value),
      booked: parseInt(document.getElementById("booked").value),
    };
    renderLoader();
    const response = await fetch(`http://localhost:8080/api/v1/cars/${carId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(car),
    });

    if (!response.ok) {
      throw new Error("Failed to update car");
    }
    removeLoader();
    const modal = document.querySelector(".modal");
    modal.remove();
    await initializeCars();
    showAlert("Successfully updated car", "positive");
  } catch (error) {
    removeLoader();
    console.error("Error updating car:", error);
    showAlert("Failed to update car", "negative");
  }
}

async function deleteCar(carId) {
  const confirmed = await showConfirmation(
    "⚠️ Are you sure you want to delete this car?"
  );

  if (confirmed) {
    try {
      const auth = sessionStorage.getItem("auth");
      renderLoader();
      const response = await fetch(
        `http://localhost:8080/api/v1/cars/${carId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete car");
      }
      removeLoader();
      showAlert("Successfully deleted car", "positive");
      await initializeCars();
    } catch (error) {
      removeLoader();
      console.error("Error deleting car:", error);
      showAlert("Failed to delete car", "negative");
    }
  }
}
