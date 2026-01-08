import * as Brevo from "@getbrevo/brevo";
import { Verification } from "../models/verification.js";

export function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}

export const sendVerification = async (
  to,
  otp,
  name,
  password,
  referralCode,
  res
) => {
  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const image_url =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP63mBXmRPHkCh88H6n2upFPU-8ibISHho3A&s";

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "Email Verification - Codefest'26";
    sendSmtpEmail.htmlContent = `
      <html lang="en">
      <body>
        <table align="center" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <img src="${image_url}" width="70px" alt="Sloth">
            </td>
          </tr>
          <tr>
            <td align="center">
              <h2>Email Verification</h2>
            </td>
          </tr>
          <tr>
            <td align="center">
              <table align="center" width="500" height="300" cellpadding="0" cellspacing="0"
                style="border-radius: 10px; border: 1px solid rgb(195, 193, 193); padding: 30px;">
                <tr>
                  <td align="center">
                    <p>
                      To activate your email, please use the given OTP. Don't share with anyone :)
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span
                      style="text-align: center; background-color: rgb(201, 201, 201); border-radius: 2px; height: 40px; padding: 10px; margin: 10px; font-weight: bold; margin: 10px">
                      ${otp}</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p>If you don't use this OTP within 1 hour, it will expire.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "Codefest'26",
      email: process.env.BREVO_SENDER_EMAIL,
    };

    sendSmtpEmail.to = [
      {
        email: to,
        name: name,
      },
    ];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    await Verification.findOneAndUpdate(
      { email: to },
      {
        name,
        email: to,
        code: otp,
        password,
        expiry: new Date(Date.now() + 60 * 60 * 1000),
        referralCode,
      },
      { upsert: true }
    );

    res.status(200).json({
      status: "success",
      message: "Email sent for verification",
    });
  } catch (error) {
    console.error("Error sending email:", error);

    if (error.response) {
      console.error("Brevo API Error:", error.response.body);
    }

    res.status(500).json({
      status: "error",
      message: "Failed to send verification email. Please try again.",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
      }),
    });
  }
};
