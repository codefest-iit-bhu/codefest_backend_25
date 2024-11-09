const nodemailer=require("nodemailer")

module.exports=async (req,res)=>{
    const transporter = nodemailer.createTransport({
        service: "Outlook365",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
}