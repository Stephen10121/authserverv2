import { Response } from "express";

export const sendRefreshToken = (res: Response, token: string) => {
    res.cookie("G_VAR", token, {httpOnly: true});
}