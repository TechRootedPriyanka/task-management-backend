const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/TaskManagementDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define mongoose models (User, Room, Task)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Done"],
    default: "To Do",
  },
  roomID: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
});

const User = mongoose.model("User", userSchema);
const Room = mongoose.model("Room", roomSchema);
const Task = mongoose.model("Task", taskSchema);

// Define Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Task Management API",
    version: "1.0.0",
    description: "API for managing tasks in a Task Management System.",
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Development server",
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ["./models/*.js", "./server.js"],
};

const swaggerSpec = swaggerJSDoc(options);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpec));

// // Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    console.log(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(password + "password");
    console.log(user.password + "userpassword");
    console.log(isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
    console.log(token);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Login route




// CRUD routes for user

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         schema:
 *           $ref: '#/definitions/User'
 *       500:
 *         description: Internal Server Error
 */
app.post("/users", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const newUser = new User({ email, password, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// /**
//  * @swagger
//  * /users:
//  *   post:
//  *     summary: Create a new user
//  *     tags:
//  *       - Users
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/definitions/User'
//  *     responses:
//  *       201:
//  *         description: User created successfully
//  *         schema:
//  *           $ref: '#/definitions/User'
//  *       500:
//  *         description: Internal Server Error
//  */
// app.post("/users", async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user with hashed password
//     const newUser = new User({ email, password: hashedPassword, role });
//     await newUser.save();

//     res.status(201).json(newUser);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/User'
 *       500:
 *         description: Internal Server Error
 */
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update a user
 *     tags:
 *       - Users
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated user information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         schema:
 *           $ref: '#/definitions/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
app.put("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { email, password, role } = req.body;

    // Check if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user fields
    existingUser.email = email;
    existingUser.password = password;
    existingUser.role = role;

    // Save the updated user
    const updatedUser = await existingUser.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - Users
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
app.delete("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the user
    await User.deleteOne({ _id: userId });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// CRUD routes for user end

// CRUD routes for rooms
/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Room'
 *     responses:
 *       201:
 *         description: Room created successfully
 *         schema:
 *           $ref: '#/definitions/Room'
 *       500:
 *         description: Internal Server Error
 */
app.post("/rooms", async (req, res) => {
  try {
    const { roomCode, userID } = req.body;
    const newRoom = new Room({ roomCode, userID });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: List of rooms
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Room'
 *       500:
 *         description: Internal Server Error
 */
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /rooms/{roomId}:
 *   put:
 *     summary: Update a room
 *     tags:
 *       - Rooms
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated room information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Room'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         schema:
 *           $ref: '#/definitions/Room'
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal Server Error
 */
app.put("/rooms/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { roomCode, userID } = req.body;

    // Check if the room exists
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Update room fields
    existingRoom.roomCode = roomCode;
    existingRoom.userID = userID;

    // Save the updated room
    const updatedRoom = await existingRoom.save();

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /rooms/{roomId}:
 *   delete:
 *     summary: Delete a room
 *     tags:
 *       - Rooms
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal Server Error
 */
app.delete("/rooms/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;

    // Check if the room exists
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Delete the room
    await Room.deleteOne({ _id: roomId });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// CRUD routes for rooms end

// CRUD routes for tasks
/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Task'  # Reference to the Task schema
 *     responses:
 *       201:
 *         description: Task created successfully
 *         schema:
 *           $ref: '#/definitions/Task'
 *       500:
 *         description: Internal Server Error
 */
app.post("/tasks", async (req, res) => {
  try {
    const { title, description, status, roomID } = req.body;

    const newTask = new Task({ title, description, status, roomID });
    await newTask.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: List of tasks
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Task'
 *       500:
 *         description: Internal Server Error
 */
app.get("/tasks", async (req, res) => {
  try {
    // Fetch all tasks from the database
    const tasks = await Task.find();

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     tags:
 *       - Tasks
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated task information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         schema:
 *           $ref: '#/definitions/Task'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal Server Error
 */
app.put("/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { title, description, status, roomID } = req.body;

    // Check if the task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Update task fields
    existingTask.title = title;
    existingTask.description = description;
    existingTask.status = status;
    existingTask.roomID = roomID;

    // Save the updated task
    const updatedTask = await existingTask.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags:
 *       - Tasks
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal Server Error
 */
app.delete("/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Check if the task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete the task
    await Task.deleteOne({ _id: taskId });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// CRUD routes for tasks ends
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
