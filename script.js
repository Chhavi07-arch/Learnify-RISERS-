//POMODORO Integration
function initPomodoro() {
  const pomodoroDiv = document.getElementById("pomodoro");
  //pomodoroDiv.innerHTML += "<p>Pomodoro Timer will be here!</p>";
  let workMinutes = 25;
  let restMinutes = 5;
  let isWorkPhase = true; // Tracks if the current phase is work or rest
  let timerInterval = null; // Stores the interval ID
  let totalMinutes = 0; // Tracks total time spent on work
  let currentWorkSeconds = 0; // Tracks the ongoing seconds spent in the current work phase

  const timeDisplay = document.getElementById("time");
  const totalTimeDisplay = document.getElementById("total-time");

  // Request notification permission
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Function to show notifications
  function showNotification(message) {
    if (Notification.permission === "granted") {
      new Notification("Pomodoro Timer", {
        body: message,
        icon: "https://via.placeholder.com/128", // You can replace with your custom icon
      });
    }
  }

  // Function to play an alarm sound
  function playAlarm() {
    const audio = new Audio("beeep.mp3"); // Replace with your alarm sound file path
    audio.play();
  }

  function updateTimerDisplay(minutes, seconds) {
    // Formats and displays the timer
    timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  function startTimer() {
    if (timerInterval) return; // Prevent multiple intervals from starting

    let totalSeconds = isWorkPhase ? workMinutes * 60 : restMinutes * 60;
    currentWorkSeconds = 0; // Reset current work phase time

    timerInterval = setInterval(() => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      updateTimerDisplay(minutes, seconds);

      if (isWorkPhase) {
        currentWorkSeconds++;
        if (currentWorkSeconds % 60 === 0 || totalSeconds === 0) {
          totalMinutes += Math.floor(currentWorkSeconds / 60);
          currentWorkSeconds %= 60;
          totalTimeDisplay.textContent = totalMinutes; // Update total time display
        }
      }

      if (totalSeconds === 0) {
        clearInterval(timerInterval);
        timerInterval = null; // Reset the interval ID

        // Play alarm and show notification
        if (isWorkPhase) {
          totalMinutes += Math.floor(currentWorkSeconds / 60); // Add any remaining time
          totalTimeDisplay.textContent = totalMinutes;
          showNotification("Work session over! Time to rest.");
        } else {
          showNotification("Rest session over! Time to work.");
        }
        playAlarm();

        isWorkPhase = !isWorkPhase; // Switch phase
        startTimer(); // Automatically start the next phase
      }

      totalSeconds--;
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null; // Reset the interval ID
    isWorkPhase = true; // Reset to work phase
    updateTimerDisplay(workMinutes, 0); // Reset display to initial work time
  }

  // Event listeners for the buttons
  document.getElementById("start").addEventListener("click", () => {
    startTimer();
  });

  document.getElementById("reset").addEventListener("click", () => {
    resetTimer();
  });

  // Update Pomodoro settings when an option is clicked
  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => {
      workMinutes = parseInt(button.dataset.work);
      restMinutes = parseInt(button.dataset.rest);
      resetTimer(); // Reset timer with the new durations
    });
  });

  // Initialize the display
  updateTimerDisplay(workMinutes, 0);
}

initPomodoro();

// ChatBOT integration
function initChatBot() {
  const chatBotDiv = document.getElementById("Chat-bot-main");
  const messageInput = document.querySelector(".message-input");
  const chatBody = document.querySelector(".chat-body");
  const sendMessageButton = document.querySelector("#send-message");
  const fileInput = document.querySelector("#file-input");
  const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
  const fileCancelButton = document.querySelector("#file-cancel");
  const chatbotToggler = document.querySelector("#chatbot-toggler");
  const closeChatbot = document.querySelector("#close-chatbot");

  const API_KEY = "AIzaSyA4yBI2kUczuf9qxbN1K85H6TUjklw6m2Q";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const userData = {
    message: null,
    file: {
      data: null,
      mime_type: null,
    },
  };

  const chatHistory = [
    {
      role: "model",
      parts: [{ text: "Your company information here" }],
    },
  ];

  const initialInputHeight = messageInput.scrollHeight;

  // Create Message element with Dynamic classes and return it
  const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
  };

  // Generate bot response using API
  const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    chatHistory.push({
      role: "user",
      parts: [
        { text: userData.message },
        ...(userData.file.data ? [{ inline_data: userData.file }] : []),
      ],
    });

    // API request Options
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory,
      }),
    };

    try {
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);

      //Extract and  Display bot's response text
      const apiResponseText = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();
      messageElement.innerText = apiResponseText;

      //Add bot response
      chatHistory.push({
        role: "model",
        parts: [{ text: apiResponseText }],
      });
    } catch (error) {
      console.log(error);
      messageElement.innerText = error.message;
      messageElement.style.color = "#ff0000";
    } finally {
      // Reset user's file data, removing thinking indicator and scroll chat to bottom
      userData.file = {};
      incomingMessageDiv.classList.remove("thinking");
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
  };

  //handle outgoing user messages
  const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    messageInput.value = " ";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    //create and display user message
    const messageContent = ` <div class="message-text"></div>
                            ${
                              userData.file.data
                                ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
                                : ""
                            }`;
    const outgoingMessageDiv = createMessageElement(
      messageContent,
      "user-message"
    );
    outgoingMessageDiv.querySelector(".message-text").textContent =
      userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    //Simulate bot response with thinking indicator
    setTimeout(() => {
      const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
        </svg>
        <div class="message-text">
            <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>`;
      const incomingMessageDiv = createMessageElement(
        messageContent,
        "bot-message",
        "thinking"
      );
      chatBody.appendChild(incomingMessageDiv);
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      generateBotResponse(incomingMessageDiv);
    }, 600);
  };

  // Handle Enter key press for Sending messages
  messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (
      e.key === "Enter" &&
      userMessage &&
      !e.shiftKey &&
      window.innerWidth > 786
    ) {
      handleOutgoingMessage(e);
    }
  });
  messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius =
      messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
  });

  // Handle file input change and preview the selected file
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      fileUploadWrapper.querySelector("img").src = e.target.result;
      fileUploadWrapper.classList.add("file-uploaded");
      const base64String = e.target.result.split(",")[1];

      //storing file data in user data
      userData.file = {
        data: base64String,
        mime_type: file.type,
      };

      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  });

  //cancel file upload
  fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
  });

  //initialise emoji pickerand handle emoji selection
  const picker = new EmojiMart.Picker({
    theme: "dark",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
      const { selectionStart: start, selectionEnd: end } = messageInput;
      messageInput.setRangeText(emoji.native, start, end, "end");
      messageInput.focus();
    },
    onClickOutside: (e) => {
      if (e.target.id === "emoji-picker") {
        document.body.classList.toggle("show-emoji-picker");
      } else {
        document.body.classList.remove("show-emoji-picker");
      }
    },
  });

  document.querySelector(".chat-form").appendChild(picker);

  sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
  document
    .querySelector("#file-upload")
    .addEventListener("click", () => fileInput.click());
  chatbotToggler.addEventListener("click", () =>
    document.body.classList.toggle("show-chatbot")
  );
  closeChatbot.addEventListener("click", () =>
    document.body.classList.remove("show-chatbot")
  );
}
initChatBot();

function initResourseOrganiser() {
  const resourceOrganiserDiv = document.getElementById("resourse-organiser");
  const organizerForm = document.getElementById("organizerForm");
  const resourceType = document.getElementById("resourceType");
  const resourceInputGroup = document.getElementById("resourceInputGroup");
  const resourceList = document.querySelector("#resourceList .list-group");

  // Handle resource type selection
  resourceType.addEventListener("change", () => {
    const type = resourceType.value;

    resourceInputGroup.innerHTML = ""; // Clear previous input fields

    if (type === "video") {
      resourceInputGroup.innerHTML = `
            <label for="resourceInput" class="form-label">Enter Video Link</label>
            <input type="url" id="resourceInput" class="form-control" placeholder="Enter video link" required>
        `;
    } else if (type === "pdf" || type === "image") {
      resourceInputGroup.innerHTML = `
            <label for="resourceInput" class="form-label">Upload ${
              type === "pdf" ? "PDF" : "Image"
            }</label>
            <input type="file" id="resourceInput" class="form-control" accept="${
              type === "pdf" ? "application/pdf" : "image/png, image/jpeg"
            }" required>
        `;
    } else if (type === "note") {
      resourceInputGroup.innerHTML = `
            <label for="resourceInput" class="form-label">Enter Your Note</label>
            <textarea id="resourceInput" class="form-control" rows="3" placeholder="Enter your text note" required></textarea>
        `;
    }
  });

  // Handle form submission
  organizerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const type = resourceType.value;
    const inputField = document.getElementById("resourceInput");
    let value;

    if (type === "pdf" || type === "image") {
      const file = inputField.files[0];
      if (!file) {
        alert("Please upload a file!");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        value = reader.result;
        saveResource({ type, value });
        addResourceToDOM({ type, value });
      };
      reader.readAsDataURL(file);
    } else {
      value = inputField.value.trim();
      if (!value) {
        alert("Please enter a valid input!");
        return;
      }

      saveResource({ type, value });
      addResourceToDOM({ type, value });
    }

    organizerForm.reset();
    resourceInputGroup.innerHTML = "";
  });

  // Save resource to LocalStorage
  function saveResource(resource) {
    const resources = JSON.parse(localStorage.getItem("resources")) || [];
    resources.push(resource);
    localStorage.setItem("resources", JSON.stringify(resources));
  }

  // Load resources from LocalStorage
  function loadResources() {
    const resources = JSON.parse(localStorage.getItem("resources")) || [];
    resources.forEach((resource) => addResourceToDOM(resource));
  }

  // Add resource to the DOM
  function addResourceToDOM(resource) {
    const li = document.createElement("li");
    li.classList.add("list-group-item");

    if (resource.type === "video") {
      li.innerHTML = `<strong>Video:</strong> <a href="${resource.value}" target="_blank">${resource.value}</a>`;
    } else if (resource.type === "pdf") {
      li.innerHTML = `<strong>PDF:</strong> <a href="${resource.value}" target="_blank">Download PDF</a>`;
    } else if (resource.type === "image") {
      li.innerHTML = `<strong>Image:</strong> <a href="${resource.value}" target="_blank">View Image</a>`;
    } else if (resource.type === "note") {
      li.innerHTML = `<strong>Note:</strong> ${resource.value}`;
    }

    // Add delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn", "btn-danger", "btn-sm", "float-end");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      deleteResource(resource.value);
      li.remove();
    });

    li.appendChild(deleteBtn);
    resourceList.appendChild(li);
  }

  // Delete resource from LocalStorage
  function deleteResource(value) {
    let resources = JSON.parse(localStorage.getItem("resources")) || [];
    resources = resources.filter((resource) => resource.value !== value);
    localStorage.setItem("resources", JSON.stringify(resources));
  }

  // Load resources on page load
  document.addEventListener("DOMContentLoaded", loadResources);
}
initResourseOrganiser();

function initToDo() {
  const TodoDiv = document.getElementById("To-DO");
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskStartTime = document.getElementById("taskStartTime");
  const taskEndTime = document.getElementById("taskEndTime");
  const taskList = document.getElementById("taskList");

  // Request Notification Permission
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Event Listener for Adding Tasks
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const taskText = taskInput.value.trim();
    const startTime = taskStartTime.value;
    const endTime = taskEndTime.value;

    if (!taskText || !startTime || !endTime) return;

    const task = { text: taskText, startTime, endTime, completed: false };
    addTaskToDOM(task);
    scheduleNotifications(task);

    // Clear form inputs
    taskInput.value = "";
    taskStartTime.value = "";
    taskEndTime.value = "";
  });

  // Add Task to DOM
  function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center"
    );
    li.innerHTML = `
        <div>
            <strong>${task.text}</strong>
            <br>
            <small>${task.startTime} - ${task.endTime}</small>
        </div>
        <input type="checkbox" class="form-check-input mark-completed">
    `;

    const checkbox = li.querySelector(".mark-completed");
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      if (task.completed) {
        li.classList.add("text-decoration-line-through");
      } else {
        li.classList.remove("text-decoration-line-through");
      }
    });

    taskList.appendChild(li);
  }

  // Schedule Notifications
  function scheduleNotifications(task) {
    const now = new Date();

    // Schedule start notification
    const startTime = new Date();
    startTime.setHours(...task.startTime.split(":"));
    if (startTime > now) {
      setTimeout(
        () => showNotification(`Time to start: ${task.text}`),
        startTime - now
      );
    }

    // Schedule end notification
    const endTime = new Date();
    endTime.setHours(...task.endTime.split(":"));
    if (endTime > now) {
      setTimeout(() => {
        showNotification(`Did you complete: ${task.text}?`);
      }, endTime - now);
    }
  }

  // Show Notification
  function showNotification(message) {
    if (Notification.permission === "granted") {
      new Notification("Task Scheduler", { body: message });
    }
  }
}
initToDo();

function initCalender() {
  const calendarDiv = document.getElementById("Calendarbap");
  const calendar = document.getElementById("calendar");
  const eventModal = document.getElementById("event-modal");
  const eventTitleInput = document.getElementById("event-title");
  const eventColorInput = document.getElementById("event-color");
  const saveEventBtn = document.getElementById("save-event-btn");
  const yearFilter = document.getElementById("year-filter");
  const monthFilter = document.getElementById("month-filter");

  let events = {};
  let selectedDate = null;

  // Initialize Calendar
  function initializeCalendar() {
    // Populate Year and Month Filters
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    }

    for (let month = 0; month < 12; month++) {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = new Date(0, month).toLocaleString("default", {
        month: "long",
      });
      monthFilter.appendChild(option);
    }

    yearFilter.value = currentYear;
    monthFilter.value = new Date().getMonth();

    // Create Initial Calendar
    renderCalendar();
  }

  // Render Calendar
  function renderCalendar() {
    calendar.innerHTML = "";

    const selectedYear = yearFilter.value;
    const selectedMonth = monthFilter.value;
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(
      selectedYear,
      parseInt(selectedMonth) + 1,
      0
    ).getDate();

    // Empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("div");
      calendar.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.classList.add("day");
      dayElement.textContent = day;
      dayElement.dataset.date = `${selectedYear}-${
        parseInt(selectedMonth) + 1
      }-${day}`;

      // Add events to the day
      const dayEvents = events[dayElement.dataset.date] || [];
      dayEvents.forEach((event) => {
        const eventElement = document.createElement("div");
        eventElement.classList.add("event");
        eventElement.textContent = event.title;
        eventElement.style.backgroundColor = event.color;
        dayElement.appendChild(eventElement);
      });

      // Open modal on day click
      dayElement.addEventListener("click", () => {
        selectedDate = dayElement.dataset.date;
        eventModal.classList.remove("hidden");
      });

      calendar.appendChild(dayElement);
    }
  }

  // Save Event
  saveEventBtn.addEventListener("click", () => {
    const title = eventTitleInput.value;
    const color = eventColorInput.value;

    if (title && color && selectedDate) {
      if (!events[selectedDate]) {
        events[selectedDate] = [];
      }

      events[selectedDate].push({ title, color });
      renderCalendar();
      eventModal.classList.add("hidden");
      eventTitleInput.value = "";
      eventColorInput.value = "#000000";
    } else {
      alert("Please fill in all fields!");
    }
  });

  // Update Calendar on Filter Change
  yearFilter.addEventListener("change", renderCalendar);
  monthFilter.addEventListener("change", renderCalendar);

  // Initialize
  initializeCalendar();
}
initCalender();

function initFlashCard() {
  const pomodoroDiv = document.getElementById("FlashCardbap");
  const API_KEY = "AIzaSyBUsiLRETjyxhE9WZcayNyuNXbb9RXrsDU";
  const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
    API_KEY;

  async function getAIResponse(text, topic) {
    const prompt = `${topic} "${text}"`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
            topP: 1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return "Unable to generate AI response. Please try again.";
    }
  }

  document.querySelector("#generate").addEventListener("click", async () => {
    const inputText = document.querySelector("#inputText").value.trim();
    const topic = document.querySelector("#topic").value;

    if (!inputText || !topic) {
      alert("Please enter text and select a topic!");
      return;
    }

    // Show loading
    const loadingElement = document.querySelector("#loading");
    loadingElement.style.display = "block";

    try {
      // Get AI response
      const backText = await getAIResponse(inputText, topic);

      // Create the flashcard
      const flashcard = document.createElement("div");
      flashcard.className = "flashcard";
      flashcard.innerHTML = `
              <button class="close-btn">×</button>
              <div class="front">${inputText}</div>
              <div class="back">
                  <div class="back-content">${backText}</div>
              </div>
          `;

      // Toggle flip on click
      flashcard.onclick = (e) => {
        if (!e.target.closest(".close-btn")) {
          flashcard.classList.toggle("flipped");
        }
      };

      // Close button functionality
      const closeButton = flashcard.querySelector(".close-btn");
      closeButton.onclick = (e) => {
        e.stopPropagation();
        flashcard.remove();
      };

      document.querySelector("#flashcards").appendChild(flashcard);

      // Clear input
      document.querySelector("#inputText").value = "";
    } catch (error) {
      alert("Failed to generate flashcard. Please try again.");
    } finally {
      // Hide loading
      loadingElement.style.display = "none";
    }
  });

  // Clear all flashcards
  document.querySelector("#clear").addEventListener("click", () => {
    document.querySelector("#flashcards").innerHTML = "";
  });
}
initFlashCard();
