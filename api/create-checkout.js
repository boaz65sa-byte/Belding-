/**
 * =====================================================
 * Vercel Serverless Function: Create Stripe Checkout
 * POST /api/create-checkout
 * =====================================================
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 * - STRIPE_PRICE_MONTHLY: Price ID for monthly subscription (price_...)
 * - STRIPE_PRICE_YEARLY: Price ID for yearly subscription (price_...)
 * - STRIPE_PRICE_LIFETIME: Price ID for lifetime one-time payment (price_...)
 * - NEXT_PUBLIC_SITE_URL: Your site URL (e.g., https://yourapp.vercel.app)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY,
    lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

const PLAN_CONFIG = {
    monthly: {
        mode: 'subscription',
        priceId: PRICE_IDS.monthly,
    },
    yearly: {
        mode: 'subscription',
        priceId: PRICE_IDS.yearly,
    },
    lifetime: {
        mode: 'payment',
        priceId: PRICE_IDS.lifetime,
    },
};

module.exports = async (req, res) => {
    // Validate required env vars
    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({
            error: 'Server misconfiguration',
            message: 'STRIPE_SECRET_KEY is not set in Vercel Environment Variables',
        });
    }
        if (!PRICE_IDS.monthly || !PRICE_IDS.yearly || !PRICE_IDS.lifetime) {
        const missing = [];
        if (!PRICE_IDS.monthly) missing.push('STRIPE_PRICE_MONTHLY');
        if (!PRICE_IDS.yearly) missing.push('STRIPE_PRICE_YEARLY');
        if (!PRICE_IDS.lifetime) missing.push('STRIPE_PRICE_LIFETIME');
        return res.status(500).json({
            error: 'Server misconfiguration',
            message: `${missing.join(', ')} not set. Create Products & Prices in Stripe Dashboard, add the price_xxx IDs to Vercel env.`,
        });
    }
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl || siteUrl === 'http://localhost:3000') {
        siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    }
    if (!siteUrl) {
        return res.status(500).json({
            error: 'Server misconfiguration',
            message: 'Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://belding.vercel.app)',
        });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { planType, userId, userEmail } = req.body;

        // Validate input
        if (!planType || !PLAN_CONFIG[planType]) {
            return res.status(400).json({ 
                error: 'Invalid plan type. Must be: monthly, yearly, or lifetime' 
            });
        }

        if (!userId || !userEmail) {
            return res.status(400).json({ 
                error: 'Missing userId or userEmail' 
            });
        }

        const config = PLAN_CONFIG[planType];

        // Create or retrieve Stripe customer
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: userEmail,
            limit: 1,
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            
            // Update metadata if needed
            if (customer.metadata.supabase_user_id !== userId) {
                customer = await stripe.customers.update(customer.id, {
                    metadata: { supabase_user_id: userId },
                });
            }
        } else {
            customer = await stripe.customers.create({
                email: userEmail,
                metadata: { supabase_user_id: userId },
            });
        }

        // Build checkout session parameters
        const sessionParams = {
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: config.priceId,
                    quantity: 1,
                },
            ],
            mode: config.mode,
            success_url: `${siteUrl}/index.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/pricing.html?canceled=true`,
            metadata: {
                supabase_user_id: userId,
                plan_type: planType,
            },
            // For subscriptions, allow promotion codes
            ...(config.mode === 'subscription' && {
                allow_promotion_codes: true,
                subscription_data: {
                    metadata: {
                        supabase_user_id: userId,
                        plan_type: planType,
                    },
                },
            }),
            // For one-time payments (lifetime), add invoice for records
            ...(config.mode === 'payment' && {
                invoice_creation: {
                    enabled: true,
                },
                payment_intent_data: {
                    metadata: {
                        supabase_user_id: userId,
                        plan_type: planType,
                    },
                },
            }),
        };

        // Create checkout session
        const session = await stripe.checkout.sessions.create(sessionParams);

        return res.status(200).json({
            url: session.url,
            sessionId: session.id,
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        
        return res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message,
        });
    }
};
