import {
  isAdmin,
  showConfirmation,
  showAlert,
  renderLoader,
  removeLoader,
} from "./utils.js";
import { currentSort, updateSortIcons } from "./app.js";

export function loadBookingsView() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";

  const columns = [
    { id: "id", label: "ID" },
    { id: "from_date", label: "From Date" },
    { id: "to_date", label: "To Date" },
    { id: "customerId", label: "Customer ID" },
    { id: "car_id", label: "Car ID" },
    { id: "active", label: "Status" },
  ];

  let tableHTML = `
    <div id="booking-container">
      <table id="bookingTable" class="data-table">
        <thead>
          <tr>
            ${columns
              .map(
                (col) => `
              <th data-column="${col.id}" style="cursor: pointer">
              <div class="header-content">
                ${col.label} <span class="sort-icon">↕️</span>
                </div>
              </th>
            `
              )
              .join("")}
            ${isAdmin() ? '<th id="actionsHeader">Actions</th>' : ""}
          </tr>
        </thead>
        <tbody id="bookingTableBody">
        </tbody>
      </table>
    </div>
  `;

  mainContent.innerHTML = tableHTML;

  columns.forEach((col) => {
    const header = document.querySelector(`th[data-column="${col.id}"]`);
    header.addEventListener("click", async () => {
      try {
        const bookings = await fetchBookings();
        sortBookings(col.id, bookings);
      } catch (error) {
        console.error("Error sorting bookings:", error);
        showAlert("Failed to sort bookings", "negative");
      }
    });
  });

  initializeBookings();
}

async function initializeBookings() {
  try {
    const bookings = await fetchBookings();
    renderBookings(bookings);
  } catch (error) {
    console.error("Error initializing bookings:", error);
    showAlert("Failed to load bookings", "negative");
  }
}

async function fetchBookings() {
  try {
    renderLoader();
    const auth = sessionStorage.getItem("auth");
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    let url;
    if (isAdmin()) {
      url = "http://localhost:8080/api/v1/bookings";
    } else {
      url = `http://localhost:8080/api/v1/customers/orders/${userDetails.userId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }

    const bookings = await response.json();
    removeLoader();
    return bookings;
  } catch (error) {
    removeLoader();
    console.error("Error fetching bookings:", error);
    throw error;
  }
}

function renderBookings(bookings) {
  const tableBody = document.getElementById("bookingTableBody");
  tableBody.innerHTML = "";

  if (bookings.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6">No bookings available</td>`;
    tableBody.appendChild(row);
  } else {
    bookings.forEach((booking) => {
      const row = document.createElement("tr");

      row.innerHTML = `
      <td>${booking.id}</td>
      <td>${booking.from_date}</td>
      <td>${booking.to_date}</td>
      <td>${booking.customerId}</td>
      <td>${booking.car_id}</td>
      <td>${booking.active === 1 ? "Active" : "Inactive"}</td>
    `;

      if (isAdmin()) {
        const actionsCell = document.createElement("td");
        actionsCell.innerHTML = `
        <button class="edit-booking-btn btn-standard btn" data-id="${booking.id}">Edit</button>
        <button class="delete-booking-btn btn-negative btn" data-id="${booking.id}">Delete</button>
      `;
        row.appendChild(actionsCell);
      }

      tableBody.appendChild(row);
    });
  }
  const editButtons = document.querySelectorAll(".edit-booking-btn");
  const deleteButtons = document.querySelectorAll(".delete-booking-btn");

  editButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const bookingId = e.target.getAttribute("data-id");
      showEditBookingModal(bookingId);
    })
  );

  deleteButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const bookingId = e.target.getAttribute("data-id");
      deleteBooking(bookingId);
    })
  );
}

function sortBookings(column, bookings) {
  if (currentSort.column === column) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    currentSort.column = column;
    currentSort.ascending = true;
  }

  updateSortIcons(column);

  bookings.sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case "from_date":
      case "to_date":
        comparison = new Date(a[column]) - new Date(b[column]);
        break;
      case "active":
      case "customerId":
      case "car_id":
        comparison = Number(a[column]) - Number(b[column]);
        break;
      default:
        comparison = String(a[column]).localeCompare(String(b[column]));
    }

    return currentSort.ascending ? comparison : -comparison;
  });

  renderBookings(bookings);
}

export async function showCreateBookingModal(carId) {
  const modal = await createBookingModal(carId);
  document.body.appendChild(modal);
}

//TODO MAKE MORE USERFRIENDLY
async function createBookingModal(carId) {
  const modal = document.createElement("div");
  modal.className = "modal";

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const auth = sessionStorage.getItem("auth");
  renderLoader();
  const response = await fetch(
    "http://localhost:8080/api/v1/customers/orders",
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  const bookings = await response.json();
  removeLoader();

  const carBookings = bookings.filter((b) => b.car_id == carId && b.active);

  const bookedDates = new Set();
  carBookings.forEach((booking) => {
    let date = new Date(booking.from_date);
    const end = new Date(booking.to_date);
    while (date <= end) {
      bookedDates.add(date.toISOString().split("T")[0]);
      date = new Date(date.setDate(date.getDate() + 1));
    }
  });

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Book a Car</h2>
      <form id="bookingForm">
        <div class="form-group">
          <label>From Date:</label>
          <input type="date" id="fromDate" min="${today}" required>
        </div>
        <div class="form-group">
          <label>To Date:</label>
          <input type="date" id="toDate" min="${tomorrowStr}" required>
        </div>
        <input type="hidden" id="bookingCarId" value="${carId}">
        <button type="submit" class="btn btn-positive">Confirm Booking</button>
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

  const fromDateInput = modal.querySelector("#fromDate");
  const toDateInput = modal.querySelector("#toDate");

  const validateDateRange = () => {
    if (!fromDateInput.value || !toDateInput.value) return;

    let current = new Date(fromDateInput.value);
    const end = new Date(toDateInput.value);

    while (current <= end) {
      if (bookedDates.has(current.toISOString().split("T")[0])) {
        fromDateInput.value = "";
        toDateInput.value = "";
        showAlert(
          "Selected date range includes unavailable dates. Please choose different dates.",
          "negative"
        );
        return false;
      }
      current.setDate(current.getDate() + 1);
    }
    return true;
  };

  fromDateInput.addEventListener("change", () => {
    const fromDate = new Date(fromDateInput.value);
    fromDate.setDate(fromDate.getDate() + 1);
    toDateInput.min = fromDate.toISOString().split("T")[0];

    if (
      toDateInput.value &&
      new Date(toDateInput.value) <= new Date(fromDateInput.value)
    ) {
      toDateInput.value = fromDate.toISOString().split("T")[0];
    }

    validateDateRange();
  });

  toDateInput.addEventListener("change", validateDateRange);

  modal.querySelector("#bookingForm").onsubmit = async (e) => {
    e.preventDefault();
    if (validateDateRange()) {
      await createBooking();
    }
  };

  return modal;
}

async function createBooking() {
  try {
    const auth = sessionStorage.getItem("auth");
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    const carId = parseInt(document.getElementById("bookingCarId").value);

    const newBooking = {
      from_date: fromDate,
      to_date: toDate,
      customerId: parseInt(userDetails.userId),
      car_id: carId,
      active: 1,
    };
    renderLoader();
    const response = await fetch("http://localhost:8080/api/v1/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(newBooking),
    });

    if (!response.ok) {
      throw new Error("Failed to create booking");
    }
    removeLoader();
    const modal = document.querySelector(".modal");
    modal.remove();
    showAlert("Booking created successfully!", "positive");

    if (document.getElementById("bookingTable")) {
      await initializeBookings();
    }
  } catch (error) {
    removeLoader();
    console.error("Error creating booking:", error);
    showAlert("Failed to create booking.", "negative");
  }
}

function findBookingById(bookingId) {
  const bookingRows = document.querySelectorAll("#bookingTableBody tr");
  let bookingData = null;

  bookingRows.forEach((row) => {
    if (row.querySelector("td").textContent === bookingId.toString()) {
      bookingData = {
        id: bookingId,
        from_date: row.children[1].textContent,
        to_date: row.children[2].textContent,
        customer_id: parseInt(row.children[3].textContent),
        car_id: parseInt(row.children[4].textContent),
        active: row.children[5].textContent === "Active" ? 1 : 0,
      };
    }
  });

  return bookingData;
}

function showEditBookingModal(bookingId) {
  const booking = findBookingById(bookingId);
  if (!booking) return;

  const modal = createEditBookingModal(booking);
  document.body.appendChild(modal);
}

function createEditBookingModal(booking) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Edit Booking</h2>
      <form id="editBookingForm">
        <div class="form-group">
          <label>From Date:</label>
          <input type="date" id="editFromDate" value="${
            booking.from_date
          }" required>
        </div>
        <div class="form-group">
          <label>To Date:</label>
          <input type="date" id="editToDate" value="${
            booking.to_date
          }" required>
        </div>
        <div class="form-group">
          <label>Customer ID:</label>
          <input type="number" id="editCustomerId" value="${
            booking.customer_id
          }" required>
        </div>
        <div class="form-group">
          <label>Car ID:</label>
          <input type="number" id="editCarId" value="${
            booking.car_id
          }" required>
        </div>
        <div class="form-group">
          <label>Status:</label>
          <select id="editStatus">
            <option value="1" ${
              booking.active === 1 ? "selected" : ""
            }>Active</option>
            <option value="0" ${
              booking.active === 0 ? "selected" : ""
            }>Inactive</option>
          </select>
        </div>
        <button type="submit" class="btn btn-positive">Save Changes</button>
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

  modal.querySelector("#editBookingForm").onsubmit = async (e) => {
    e.preventDefault();
    await updateBooking(booking.id);
  };

  return modal;
}

async function updateBooking(bookingId) {
  try {
    const auth = sessionStorage.getItem("auth");
    const fromDate = document.getElementById("editFromDate").value;
    const toDate = document.getElementById("editToDate").value;
    const customerId = parseInt(
      document.getElementById("editCustomerId").value
    );
    const carId = parseInt(document.getElementById("editCarId").value);
    const active = parseInt(document.getElementById("editStatus").value);

    const updatedBooking = {
      id: bookingId,
      from_date: fromDate,
      to_date: toDate,
      customerId: customerId,
      car_id: carId,
      active: active,
    };
    renderLoader();
    const response = await fetch(
      `http://localhost:8080/api/v1/bookings/${bookingId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(updatedBooking),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update booking");
    }
    removeLoader();
    const modal = document.querySelector(".modal");
    modal.remove();
    showAlert("Successfully updated booking", "positive");
    await initializeBookings();
  } catch (error) {
    removeLoader();
    console.error("Error updating booking:", error);
    showAlert("Failed to update booking.", "negative");
  }
}

async function deleteBooking(bookingId) {
  const confirmed = await showConfirmation(
    "⚠️ Are you sure you want to delete this booking?"
  );

  if (confirmed) {
    try {
      const auth = sessionStorage.getItem("auth");
      renderLoader();
      const response = await fetch(
        `http://localhost:8080/api/v1/bookings/${bookingId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }
      removeLoader();
      showAlert("Successfully deleted booking", "positive");
      await initializeBookings();
    } catch (error) {
      removeLoader();
      console.error("Error deleting booking:", error);
      showAlert("Failed to delete booking");
    }
  } else {
    console.log("booking deletion cancelled.");
  }
}
