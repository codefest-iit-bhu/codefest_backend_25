import nodemailer from "nodemailer";
import { Verification } from "../models/verification.js";

export function generateOTP() {
	const otp = Math.floor(100000 + Math.random() * 900000);
	return otp;
}

export const sendVerification = async (to, otp, name, password) => {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "kolanuvarun739@gmail.com",
			pass: process.env.SMTP_APP_PASS,
		},
	});

	const image_url = "https://iili.io/2cwlabs.png";
	const from = "kolanuvarun739@gmail.com";
	const mailOptions = {
		from,
		to,
		subject: "Email Verification - Codefest'25",
		html: `
        <html lang="en">

		<body>
			<table align="center" width="100%%" cellpadding="0" cellspacing="0">
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
        `,
	};

	await transporter.sendMail(mailOptions, async (error, info) => {
		if (error) {
			console.error("Error sending email:", error);
			throw new Error("Error sending email:", error);
		}
		await Verification.create({
			name,
			email: to,
			code: otp,
			password,
			expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry time
		});
		console.log("Email sent:", info.response);
	});
};
