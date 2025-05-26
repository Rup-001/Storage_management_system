const nodemailer = require("nodemailer");
require("dotenv").config();

const transporterrr = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

/**
 * Send OTP email
 */
exports.sendOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
        };
        await transporterrr.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error("Email sending error:", error);
        throw new Error("Failed to send OTP email");
    }
};
