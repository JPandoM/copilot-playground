document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper para escapar contenido y evitar XSS
  function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and reset activity select to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section HTML (with remove button)
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHtml = `<div class="participants"><h5>Participants</h5>`;
        if (participants.length > 0) {
          participantsHtml += `<ul class="participants-list">` +
            participants.map(p => `
              <li class="participant-item">
                <span class="participant-email">${escapeHtml(p)}</span>
                <button class="remove-participant" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" title="Unregister">🗑️</button>
              </li>
            `).join("") +
            `</ul>`;
        } else {
          participantsHtml += `<p class="no-participants">No participants yet</p>`;
        }
        participantsHtml += `</div>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    
      // Delegate click events for remove buttons
      activitiesList.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target.classList || !target.classList.contains('remove-participant')) return;

        const activity = target.dataset.activity;
        const email = target.dataset.email;

        if (!activity || !email) return;

        if (!confirm(`Remove ${email} from ${activity}?`)) return;

        try {
          const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
          const result = await res.json();
          if (res.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = 'success';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || 'Failed to unregister';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
          }
        } catch (err) {
          console.error('Unregister error:', err);
          messageDiv.textContent = 'Failed to unregister. Please try again.';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
