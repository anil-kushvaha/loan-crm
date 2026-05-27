import User from "../models/user.model.js";

export const createSuperAdmin = async (req, res) => {
  // Only allow if env variable is true
  if (process.env.ALLOW_SUPER_ADMIN_CREATION !== "true") {
    return res.status(403).json({
      success: false,
      message:
        "Super admin creation is disabled. Set ALLOW_SUPER_ADMIN_CREATION",
    });
  }

  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const admin = new User({
      name,
      email,
      password,
      role: "admin",
      mobile: mobile || "",
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Super admin created successfully",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
