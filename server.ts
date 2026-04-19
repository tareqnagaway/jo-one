import express from "express";
import { createServer as createViteServer } from "vite";
import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";
import path from "path";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase server-side client helper
let supabaseAdminClient = null;
const getSupabaseAdmin = () => {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables on server-side');
    }
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminClient;
};

// استخدم مفاتيح حقيقية إذا توفرت، وإلا استمر بوضع الساندبوكس للتجربة
const isLive = process.env.PAYPAL_MODE === 'live';
const paypalId = process.env.PAYPAL_CLIENT_ID || 'sb';
const paypalSecret = process.env.PAYPAL_CLIENT_SECRET || 'test';

let paypalClient = null;
const getPayPalClient = () => {
  if (!paypalClient) {
    const environment = isLive 
      ? new paypal.core.LiveEnvironment(paypalId, paypalSecret)
      : new paypal.core.SandboxEnvironment(paypalId, paypalSecret);
    paypalClient = new paypal.core.PayPalHttpClient(environment);
  }
  return paypalClient;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/create-paypal-order", async (req, res) => {
    try {
      const { amount } = req.body;
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD", // JOD is not supported by standard PayPal Sandbox easily
            value: amount.toString(),
          },
        }],
      });

      const order = await getPayPalClient().execute(request);
      res.json({ id: order.result.id });
    } catch (error) {
      console.error("PayPal Create Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/capture-paypal-order", async (req, res) => {
    try {
      const { orderID, userId } = req.body;
      const request = new paypal.orders.OrdersCaptureRequest(orderID);
      request.requestBody({});

      const capture = await getPayPalClient().execute(request);
      
      if (capture.result.status === "COMPLETED") {
        const amount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value);
        
        // Update Supabase Wallet
        // We convert USD to JOD or just use 1:1 for demo
        const { data: wallet, error: walletError } = await getSupabaseAdmin()
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (walletError && walletError.code !== 'PGRST116') throw walletError;

        const newBalance = (wallet?.balance || 0) + amount;

        const { error: updateError } = await getSupabaseAdmin()
          .from('wallets')
          .upsert({ 
            user_id: userId, 
            balance: newBalance,
            updated_at: new Date().toISOString()
          });

        if (updateError) throw updateError;

        res.json({ status: "success", balance: newBalance });
      } else {
        res.status(400).json({ status: "failed" });
      }
    } catch (error) {
      console.error("PayPal Capture Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production fallback
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Server failed to start:", err);
  process.exit(1);
});
