const initializeSocket = () => {
  const socket = io();
  return socket;
};

const updateChatUI = (data, user = "Anonymous") => {
  const li = $("<li>").text(data.message);
  const div = $("<div>");
  const span = $("<span>").text(user + " just now");

  div.append(span).append(li);
  $("#messages").append(div);
};

const updateUserListUI = (data) => {
  const userList = $("#users-list-sidepanel");
  userList.empty();

  if (data) {
    data.forEach((user) => {
      const li = $("<li>").text(user.socketName);
      userList.append(li);
    });
  }

  $("#users-count").text(data ? data.length : 0);
};

const fetchAndDisplayChatMessages = () => {
  $.ajax({
    url: "/chats",
    method: "GET",
    dataType: "json",
    success: (json) => {
      json.forEach((data) => {
        const div = $("<div>");
        const li = $("<li>").text(data.message);
        const span = $("<span>").text(data.sender + " " + formatTimeAgo(data.createdAt));

        div.append(span).append(li);
        $("#messages").append(div);
      });
    },
    error: (error) => {
      console.error("Error fetching chat messages:", error);
    },
  });
};

$(function () {
  const socket = initializeSocket();

  $("form").submit((e) => {
    e.preventDefault();

    const messageValue = $("#message").val();

    // Check if the message is not empty
    if (messageValue.trim() !== "") {
      socket.emit("chat message", messageValue);
      updateChatUI({ message: messageValue });
      $("#message").val("");
    }

    return false;
  });

  socket.on("received", (data) => {
    updateChatUI(data, data.name);
  });

  socket.on("userlist", (data) => {
    updateUserListUI(data);
  });

  fetchAndDisplayChatMessages();

  let messageInput = $("#message");
  let typing = $("#typing");

  messageInput.on("keypress", () => {
    socket.emit("typing", { user: "Someone", message: "is typing..." });
  });

  socket.on(`${hello}`, (data) => {
    typing.text(data.user + " " + data.message);
  });

  messageInput.on("keyup", () => {
    socket.emit("stopTyping", "");
  });

  socket.on("notifyStopTyping", () => {
    typing.text("");
  });
});
