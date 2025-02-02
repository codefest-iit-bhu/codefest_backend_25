import jwt from "jsonwebtoken";
import { Session } from "../models/session.js";
import { Team } from "../models/team.js";
import fs from "fs"
import YAML from "yamljs";
import { CARequest } from "../models/ca_request.js";
import { Referral } from "../models/ca_winzo_referrals.js";

export const sendJwt = async (
  user,
  res,
  next,
  statusCode,
  message,
  refreshToken
) => {
  try {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    res
      .status(statusCode)
      .json({
        success: true,
        message: message,
        token,
        refreshToken,
      });
  } catch (error) {
    next(error);
  }
};

export const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.JWT_SECRET_REFRESH,
    { expiresIn: "30d" }
  );

  await Session.create({
    user: user._id,
    token: refreshToken,
    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return refreshToken;
};

export const generateRandomCode = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  do {
    result = "";
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
  } while (await Team.findOne({ teamCode: result }));

  return result;
};

export const generateCAReferral = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  do {
    result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
  } while (await CARequest.findOne({ referralCode: result }));

  return result;
};

export const generateWinzoUsername = async (name) => {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  // const digits = "0123456789";
  let result = "";

  do {
    result = "";
    for (let i = 0; i < 3; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    result += `_${name.toLowerCase()}`;
  } while (await Referral.findOne({ referredBy: result }));

  return result;
};

export const loadSwaggerWithDynamicUrl = (filePath) => {
  let swaggerYaml = fs.readFileSync(filePath, 'utf8');

  const serverUrl =
    process.env.NODE_ENV === 'development'
      ? `http://localhost:${process.env.PORT}`
      : process.env.BACKEND_URL;

  swaggerYaml = swaggerYaml.replace(/\$\{SERVER_URL\}/g, serverUrl);
  return YAML.parse(swaggerYaml);
}

export function convertToDate(dateString) {
  const [day, month, year] = dateString.split('-');
  return new Date(year, month - 1, day);
}

export async function updateCAPoints(referralCode, points) {
  await CARequest.findOneAndUpdate(
    { referralCode },
    { $inc: { points } },
    { new: true }
  );
}
