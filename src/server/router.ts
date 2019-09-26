import * as Express from "express";
import * as BodyParser from "body-parser";
import api from "./api";

export default async function listen(port: number) {
    return await new Promise<void>((resolve) => {
        const app = Express();
        
        app.use(BodyParser.urlencoded({extended: true}));
        app.use(BodyParser.json());
        
        app.use("/api", api);
        app.use("/", Express.static(process.cwd() + "/build/client"));
        
        app.use(function (req, res) {
            res.status(404);
            if (req.xhr) {
                res.json({});
            } else {
                res.send("404 Error");
            }
        });
        
        app.use(function (err: Express.ErrorRequestHandler, req: Express.Request, res: Express.Response) {
            res.status(500);
            console.log(err);
            if (req.xhr) {
                res.json({});
            } else {
                res.send("500 Error");
            }
        });
    
        app.listen(port, () => resolve());
    });
}
