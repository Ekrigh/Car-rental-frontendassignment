export function renderLoader() {
  // Create the loader element
  const loader = document.createElement("div");
  loader.id = "loader";
  document.getElementById("main-content").appendChild(loader);
}

export function removeLoader() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.remove();
  }
}

export function isAdmin() {
  const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
  return userDetails?.authorities.some(
    (auth) => auth.authority === "ROLE_ADMIN"
  );
}

export function showConfirmation(message) {
  return new Promise((resolve) => {
    const confirmationModal = document.createElement("div");
    confirmationModal.classList.add("modal");
    confirmationModal.innerHTML = `
      <div class="modal-content warning">
        <p>${message}</p>
        <button id="confirm-yes" class="btn btn-standard">Yes</button>
        <button id="confirm-no" class="btn btn-negative">No</button>
      </div>
    `;

    document.body.appendChild(confirmationModal);

    const yesButton = document.getElementById("confirm-yes");
    const noButton = document.getElementById("confirm-no");

    yesButton.onclick = () => {
      confirmationModal.remove();
      resolve(true);
    };

    noButton.onclick = () => {
      confirmationModal.remove();
      resolve(false);
    };

    confirmationModal.onclick = (e) => {
      if (e.target === confirmationModal) {
        confirmationModal.remove();
        resolve(false);
      }
    };
  });
}

export function showAlert(message, type = "info") {
  // Create the alert container
  const alertBox = document.createElement("div");
  alertBox.classList.add(type); // Use the provided type class (info, positive, negative, warning, etc.)
  alertBox.classList.add("alert-box"); // Add a general class for styling
  alertBox.innerHTML = `
    <p>${message}</p>
    <button id="alert-close" class="btn btn-${type}">Close</button>
  `;

  // Append alert box to the document body
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.remove();
  }, 5000);

  // Get the close button and attach click handler
  const closeButton = alertBox.querySelector("#alert-close");
  closeButton.onclick = () => {
    alertBox.remove(); // Remove the alert box when the close button is clicked
  };
}
