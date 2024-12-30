import { currentSort, updateSortIcons } from "./app.js";
import {
  showConfirmation,
  showAlert,
  renderLoader,
  removeLoader,
} from "./utils.js";

export function loadCustomersView() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";

  const columns = [
    { id: "id", label: "ID" },
    { id: "firstName", label: "First Name" },
    { id: "lastName", label: "Last Name" },
    { id: "customerName", label: "Username" },
    { id: "phone", label: "Phone" },
    { id: "email", label: "Email" },
    { id: "noOfOrders", label: "Orders" },
  ];

  let tableHTML = `
    <div id="customer-container">
      <div class="table-header">
        <h2>Customer Management</h2>
        <button id="create-customer-btn" class="btn btn-positive">Add New Customer</button>
      </div>
      <table id="customerTable" class="data-table">
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="customerTableBody">
        </tbody>
      </table>
    </div>
  `;

  mainContent.innerHTML = tableHTML;

  document
    .getElementById("create-customer-btn")
    .addEventListener("click", () => showManageCustomerModal());

  columns.forEach((col) => {
    const header = document.querySelector(`th[data-column="${col.id}"]`);
    header.addEventListener("click", async () => {
      try {
        const customers = await fetchCustomers();
        sortCustomers(col.id, customers);
      } catch (error) {
        console.error("Error sorting customers:", error);
        showAlert("Failed to sort customers", "negative");
      }
    });
  });

  initializeCustomers();
}

async function initializeCustomers() {
  try {
    const customers = await fetchCustomers();
    renderCustomers(customers);
  } catch (error) {
    console.error("Error initializing customers:", error);
    showAlert("Failed to load customers", "negative");
  }
}

async function fetchCustomers() {
  try {
    const auth = sessionStorage.getItem("auth");
    renderLoader();

    const response = await fetch("http://localhost:8080/api/v1/customers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch customers");
    }
    removeLoader();
    return await response.json();
  } catch (error) {
    removeLoader();
    console.error("Error fetching customers:", error);
    throw error;
  }
}

function renderCustomers(customers) {
  const tableBody = document.getElementById("customerTableBody");
  tableBody.innerHTML = "";

  if (customers.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6">No customers available</td>`;
    tableBody.appendChild(row);
  } else {
    customers.forEach((customer) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${customer.id}</td>
      <td>${customer.firstName}</td>
      <td>${customer.lastName}</td>
      <td>${customer.customerName}</td>
      <td>${customer.phone}</td>
      <td>${customer.email}</td>
      <td>${customer.noOfOrders}</td>
      <td>
        <button class="edit-customer-btn btn btn-standard" data-id="${customer.id}">Edit</button>
        <button class="delete-customer-btn btn btn-negative" data-id="${customer.id}">Delete</button>
      </td>
    `;
      tableBody.appendChild(row);
    });
  }
  const editButtons = document.querySelectorAll(".edit-customer-btn");
  const deleteButtons = document.querySelectorAll(".delete-customer-btn");

  editButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const customerId = e.target.getAttribute("data-id");
      showManageCustomerModal(customerId);
    })
  );

  deleteButtons.forEach((button) =>
    button.addEventListener("click", (e) => {
      const customerId = e.target.getAttribute("data-id");
      deleteCustomer(customerId);
    })
  );
}

function sortCustomers(column, customers) {
  if (currentSort.column === column) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    currentSort.column = column;
    currentSort.ascending = true;
  }

  updateSortIcons(column);

  customers.sort((a, b) => {
    let comparison = 0;

    if (column === "noOfOrders") {
      comparison = a[column] - b[column];
    } else {
      comparison = String(a[column]).localeCompare(String(b[column]));
    }

    return currentSort.ascending ? comparison : -comparison;
  });

  renderCustomers(customers);
}

async function showManageCustomerModal(customerId = null) {
  let customer = null;

  if (customerId) {
    try {
      const auth = sessionStorage.getItem("auth");
      renderLoader();
      const response = await fetch(
        `http://localhost:8080/api/v1/customers/${customerId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customer");
      }

      customer = await response.json();
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
  const isEdit = customer !== null;

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${isEdit ? "Edit" : "Add"} Customer</h2>
      <form id="customerForm">
        <div class="form-group">
          <label>First Name:</label>
          <input type="text" id="firstName" value="${
            isEdit ? customer.firstName : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Last Name:</label>
          <input type="text" id="lastName" value="${
            isEdit ? customer.lastName : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Username:</label>
          <input type="text" id="customerName" value="${
            isEdit ? customer.customerName : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Phone:</label>
          <input type="tel" id="phone" value="${
            isEdit ? customer.phone : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="email" value="${
            isEdit ? customer.email : ""
          }" required>
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="text" id="password" value="${
            isEdit ? customer.password : ""
          }" required>
        </div>
        <button type="submit" class="btn btn-positive">${
          isEdit ? "Save Changes" : "Add Customer"
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

  modal.querySelector("#customerForm").onsubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateCustomer(customer.id);
    } else {
      await createCustomer();
    }
  };
  document.body.appendChild(modal);
  return modal;
}

async function createCustomer() {
  try {
    const auth = sessionStorage.getItem("auth");

    const newCustomer = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      customerName: document.getElementById("customerName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      noOfOrders: 0,
    };

    renderLoader();
    const response = await fetch("http://localhost:8080/api/v1/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(newCustomer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create customer: ${errorText}`);
    }
    removeLoader();
    const modal = document.querySelector(".modal");
    modal.remove();
    await initializeCustomers();
    showAlert("Successfully created customer", "positive");
  } catch (error) {
    removeLoader();
    console.error("Error creating customer:", error);
    showAlert("Failed to create customer", "negative");
  }
}

async function updateCustomer(customerId) {
  try {
    const auth = sessionStorage.getItem("auth");
    const customer = {
      id: customerId,
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      customerName: document.getElementById("customerName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    renderLoader();
    const response = await fetch(
      `http://localhost:8080/api/v1/customers/${customerId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(customer),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update customer");
    }

    removeLoader();
    const modal = document.querySelector(".modal");
    modal.remove();
    await initializeCustomers();
    showAlert("Successfully updated customer", "positive");
  } catch (error) {
    removeLoader();
    console.error("Error updating customer:", error);
    showAlert("Failed to update customer", "negative");
  }
}

async function deleteCustomer(customerId) {
  const confirmed = await showConfirmation(
    "⚠️ Are you sure you want to delete this customer?"
  );

  try {
    const auth = sessionStorage.getItem("auth");
    renderLoader();
    const response = await fetch(
      `http://localhost:8080/api/v1/customers/${customerId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete customer");
    }

    removeLoader();
    showAlert("Successfully deleted customer", "positive");
    await initializeCustomers();
  } catch (error) {
    removeLoader();
    console.error("Error deleting customer:", error);
    showAlert("Failed to delete customer", "negative");
  }
}
