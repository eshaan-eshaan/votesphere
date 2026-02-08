const jwt = require("jsonwebtoken");
const prisma = require("../db");

// const prisma = new PrismaClient(); // Removed

/**
 * JWT Authentication Middleware
 * Verifies the access token from HTTP-only cookie
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.accessToken ||
            req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                ok: false,
                error: "Authentication required. Please login.",
                code: "NO_TOKEN"
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Check if admin still exists
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.adminId },
            select: { id: true, email: true, role: true }
        });

        if (!admin) {
            return res.status(401).json({
                ok: false,
                error: "Admin account not found.",
                code: "ADMIN_NOT_FOUND"
            });
        }

        // Attach admin to request
        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                ok: false,
                error: "Session expired. Please login again.",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                ok: false,
                error: "Invalid authentication token.",
                code: "INVALID_TOKEN"
            });
        }

        console.error("Auth middleware error:", error);
        return res.status(500).json({
            ok: false,
            error: "Authentication error.",
            code: "AUTH_ERROR"
        });
    }
};

/**
 * Role-based authorization middleware
 * Use after authenticate middleware
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                ok: false,
                error: "Authentication required.",
                code: "NO_AUTH"
            });
        }

        if (!allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({
                ok: false,
                error: "You do not have permission to access this resource.",
                code: "FORBIDDEN"
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 * Attaches admin if token is valid
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken ||
            req.headers.authorization?.replace("Bearer ", "");

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const admin = await prisma.admin.findUnique({
                where: { id: decoded.adminId },
                select: { id: true, email: true, role: true }
            });
            if (admin) {
                req.admin = admin;
            }
        }
    } catch (error) {
        // Ignore errors - this is optional auth
    }
    next();
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
