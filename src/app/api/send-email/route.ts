// app/api/send-email/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

type Payload = {
  to: string[];          // array of recipients
  subject: string;
  html: string;          // send the edited summary as HTML
};

export async function POST(req: Request) {
  try {
    const { to, subject, html } = (await req.json()) as Payload;
    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    // Prefer Resend on Vercel (simple + reliable)
    if (process.env.RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "iqbal@project.com",
          to,
          subject: subject || "Meeting Summary",
          html
        })
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        return NextResponse.json({ error: `Resend error: ${t}` }, { status: 500 });
      }
      const data = await r.json();
      return NextResponse.json({ ok: true, id: data.id ?? null });
    }

    // --- Nodemailer fallback (Node runtime only; not Edge). ---
    // To use this, remove `export const runtime = "edge"` at top,
    // npm i nodemailer, and configure SMTP creds in env.
    // Example (Gmail App Password):
    // SMTP_HOST=smtp.gmail.com
    // SMTP_PORT=465
    // SMTP_USER=you@gmail.com
    // SMTP_PASS=your_app_password
    //
    // const nodemailer = await import("nodemailer");
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST!,
    //   port: Number(process.env.SMTP_PORT!),
    //   secure: true,
    //   auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! }
    // });
    // const info = await transporter.sendMail({
    //   from: process.env.EMAIL_FROM || process.env.SMTP_USER!,
    //   to: to.join(","),
    //   subject: subject || "Meeting Summary",
    //   html
    // });
    // return NextResponse.json({ ok: true, id: info.messageId });

    return NextResponse.json(
      { error: "No email provider configured. Set RESEND_API_KEY (recommended) or enable Nodemailer." },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
