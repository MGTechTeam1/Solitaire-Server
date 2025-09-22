import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import routes from "./segments";
import qs from 'qs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Rate limiting (100 requests / 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    limit: 100, // max 100 request per window per IP
});

// ✅ Security headers
app.use(helmet());
app.use(limiter);

// ✅ supaya req.body JSON bisa kebaca
app.use(express.json());
app.set("trust proxy", 1);
app.set('query parser', (str: string) => qs.parse(str));

// kalau pakai form-urlencoded
app.use(express.urlencoded({ extended: true }));

// ✅ JSON body parser with size limit
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1", routes);

app.get("/api/v1/health", (req, res) => {
    res.send("OK");
});

app.get("/api/v1/server-time", (req, res) => {
    res.send(new Date());
})

// ✅ Routes
app.get("/", (req, res) => {
    res.send("🚀 Secure Express Server for Unity Client!");
});



app.listen(port, async () => {
    console.log(`Server running securely at http://localhost:${port}`);
});
