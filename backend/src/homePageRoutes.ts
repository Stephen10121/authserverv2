import { Router } from "express";
export const homePageRoutes = Router();

homePageRoutes.post("/contact", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
    console.log(req.body);
    console.log(`[server] ${req.body.email}@${ip} sent contact form.`);
    // sendMail(req.body.email, req.body.what);
    res.json({msg: "Message Recieved!"});
});