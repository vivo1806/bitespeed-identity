import { Request, Response } from "express";
import { resolveIdentity } from "../services/identityService";

export async function identifyHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const body = req.body as { email?: string; phoneNumber?: string };

    const email =
      typeof body.email === "string"
        ? body.email.trim() || undefined
        : undefined;
    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim() || undefined
        : undefined;

    if (!email && !phoneNumber) {
      res.status(400).json({
        error: "At least one of email or phoneNumber must be provided",
      });
      return;
    }

    const result = await resolveIdentity(email, phoneNumber);

    res.status(200).json({ contact: result });
  } catch (error) {
    console.error("Error in identifyHandler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
