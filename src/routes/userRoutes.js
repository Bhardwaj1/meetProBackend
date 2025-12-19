const express = require("express");
const { getMe } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get current logged-in user
 *     description: Returns the profile of the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f1c9a8a1b23c00123abcd
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.get("/", protect, getMe);

module.exports = router;

