const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
// const prisma = new PrismaClient(); // Removed

// Constants
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate JWT tokens
 */
const generateTokens = (adminId) => {
    const accessToken = jwt.sign(
        { adminId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    return { accessToken, refreshToken };
};

/**
 * Set secure cookie options
 */
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge,
    path: "/"
});

/**
 * POST /api/auth/register
 * Register a new admin (first-time setup)
 */
router.post("/register", async (req, res) => {
    try {
        const { email, password, setupKey } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                error: "Email and password are required."
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                ok: false,
                error: "Invalid email format."
            });
        }

        // Password strength check
        if (password.length < 8) {
            return res.status(400).json({ ok: false, error: "Password must be at least 8 characters long." });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ ok: false, error: "Password must contain uppercase, lowercase, and numbers." });
        }

        // Check if any admin exists (only allow registration if no admins exist)
        const adminCount = await prisma.admin.count();
        if (adminCount > 0) {
            // Require setup key for additional admins
            if (setupKey !== process.env.ADMIN_SETUP_KEY) {
                return res.status(403).json({
                    ok: false,
                    error: "Admin registration is disabled. Contact system administrator."
                });
            }
        }

        // Check if email already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingAdmin) {
            return res.status(409).json({
                ok: false,
                error: "An account with this email already exists."
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                role: adminCount === 0 ? "superadmin" : "admin"
            },
            select: { id: true, email: true, role: true }
        });

        console.log(`New admin registered: ${admin.email} (${admin.role})`);

        res.status(201).json({
            ok: true,
            message: "Admin account created successfully.",
            admin: { email: admin.email, role: admin.role }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            ok: false,
            error: "Failed to create account. Please try again."
        });
    }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                error: "Email and password are required."
            });
        }

        // Find admin
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!admin) {
            // Use same error message to prevent email enumeration
            return res.status(401).json({
                ok: false,
                error: "Invalid email or password."
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, admin.passwordHash);

        if (!isValid) {
            return res.status(401).json({
                ok: false,
                error: "Invalid email or password."
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(admin.id);

        // Store refresh token in database
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                adminId: admin.id,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
            }
        });

        // Set cookies
        res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000)); // 15 min
        res.cookie("refreshToken", refreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_MS));

        console.log(`Admin logged in: ${admin.email}`);

        res.json({
            ok: true,
            message: "Login successful.",
            admin: {
                email: admin.email,
                role: admin.role
            },
            accessToken // Also return in body for clients that can't use cookies
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            ok: false,
            error: "Login failed. Please try again."
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate tokens
 */
router.post("/logout", async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            // Delete refresh token from database
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
        }

        // Clear cookies
        res.clearCookie("accessToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });

        res.json({
            ok: true,
            message: "Logged out successfully."
        });

    } catch (error) {
        console.error("Logout error:", error);
        // Still clear cookies even if DB operation fails
        res.clearCookie("accessToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });
        res.json({
            ok: true,
            message: "Logged out."
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                ok: false,
                error: "Refresh token required.",
                code: "NO_REFRESH_TOKEN"
            });
        }

        // Find refresh token in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { admin: { select: { id: true, email: true, role: true } } }
        });

        if (!storedToken) {
            return res.status(401).json({
                ok: false,
                error: "Invalid refresh token.",
                code: "INVALID_REFRESH_TOKEN"
            });
        }

        // Check if expired
        if (new Date() > storedToken.expiresAt) {
            // Delete expired token
            await prisma.refreshToken.delete({
                where: { id: storedToken.id }
            });
            return res.status(401).json({
                ok: false,
                error: "Refresh token expired. Please login again.",
                code: "REFRESH_TOKEN_EXPIRED"
            });
        }

        // Generate new tokens (token rotation)
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(storedToken.adminId);

        // Delete old refresh token and create new one
        await prisma.$transaction([
            prisma.refreshToken.delete({ where: { id: storedToken.id } }),
            prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    adminId: storedToken.adminId,
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
                }
            })
        ]);

        // Set new cookies
        res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie("refreshToken", newRefreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_MS));

        res.json({
            ok: true,
            accessToken,
            admin: storedToken.admin
        });

    } catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({
            ok: false,
            error: "Failed to refresh token."
        });
    }
});

/**
 * GET /api/auth/me
 * Get current admin info (requires auth)
 */
router.get("/me", authenticate, async (req, res) => {
    res.json({
        ok: true,
        admin: req.admin
    });
});

/**
 * POST /api/auth/change-password
 * Change password (requires auth)
 */
router.post("/change-password", authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                ok: false,
                error: "Current password and new password are required."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                ok: false,
                error: "New password must be at least 8 characters long."
            });
        }

        // Get admin with password hash
        const admin = await prisma.admin.findUnique({
            where: { id: req.admin.id }
        });

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                ok: false,
                error: "Current password is incorrect."
            });
        }

        // Hash new password and update
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await prisma.admin.update({
            where: { id: req.admin.id },
            data: { passwordHash }
        });

        // Invalidate all refresh tokens for this admin
        await prisma.refreshToken.deleteMany({
            where: { adminId: req.admin.id }
        });

        // Clear cookies
        res.clearCookie("accessToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/" });

        res.json({
            ok: true,
            message: "Password changed successfully. Please login again."
        });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            ok: false,
            error: "Failed to change password."
        });
    }
});

module.exports = router;
