import { Router } from "express";

import { z } from "zod";
import { dbConnect } from "../../db/connection.js";
import { Admin } from "../../models/Admin.js";
import { verifyPassword } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";

const router = Router();

const LoginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// router.get("/auth/ping", (_req, res) => {
//   res.json({ ok: true, where: "admin.auth.routes.ts" });
// });


router.post("/auth/login", async (req, res, next) => {
  try {
    // console.log("[LOGIN] start", new Date().toISOString());
    await dbConnect();
    // console.log("[LOGIN] connected to DB");

    const { email, password } = LoginDTO.parse(req.body);
    // console.log("[LOGIN] parsed body", email);

    const admin = await Admin.findOne({ email }).lean();
    // console.log("[LOGIN] admin found?", !!admin);

    if (!admin)
      return res.status(401).json({ ok: false, code: "INVALID_CREDENTIALS" });


    if (!("passwordHash" in admin) || !admin.passwordHash) {
      // console.error("[LOGIN] admin has no passwordHash field");
      return res.status(500).json({ ok: false, code: "BAD_ADMIN_DOC" });
    }

    const ok = await verifyPassword(password, admin.passwordHash as string);
    // console.log("[LOGIN] password ok?", ok);

    if (!ok)
      return res.status(401).json({ ok: false, code: "INVALID_CREDENTIALS" });

    const payload = {
      sub: (admin as any)._id.toString(),
      email: (admin as any).email,
      role: "ADMIN" as const,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await Admin.updateOne({ _id: admin._id }, { refreshToken });

    console.log("[LOGIN] success");
    res.json({ ok: true, data: { accessToken, refreshToken } });
  } catch (err) {
    // console.error("[LOGIN] error:", err);
    next(err);
  }
});


router.post("/auth/refresh", async (req, res, next) => {
  try {
    await dbConnect();

    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ ok: false, code: "NO_REFRESH_TOKEN" });

    const decoded = verifyRefreshToken(refreshToken);

    const admin = await Admin.findById(decoded.sub).lean();
    if (!admin || admin.refreshToken !== refreshToken)
      return res.status(401).json({ ok: false, code: "INVALID_REFRESH_TOKEN" });

    const payload = {
      sub: (admin as any)._id.toString(),
      email: admin.email,
      role: "ADMIN" as const,
    };

    const accessToken = signAccessToken(payload);

    res.json({ ok: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
});

export default router;
