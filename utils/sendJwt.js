import jwt from "jsonwebtoken";

export const sendJwt = (id,res,message,statusCode = 200) => {
    const value = jwt.sign({_id: id}, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res
    .status(statusCode)
    .json({
        success: true,
        jwt: value,
        message
    })
}