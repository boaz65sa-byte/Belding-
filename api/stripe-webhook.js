/**
 * =====================================================
 * Vercel Serverless Function: Stripe Webhook Handler
 * POST /api/stripe-webhook
 * =====================================================
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret (whsec_...)
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for admin access)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Disable body parsing - we need raw body for signature verification
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

// Helper to get raw body
async function getRawBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let event;

    try {
        const rawBody = await getRawBody(req);
        const signature = req.headers['stripe-signature'];

        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`Received Stripe event: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook handler error:', error);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session) {
    console.log('Processing checkout.session.completed:', session.id);

    const userId = session.metadata?.supabase_user_id;
    const planType = session.metadata?.plan_type;
    const customerId = session.customer;

    if (!userId) {
        console.error('No supabase_user_id in session metadata');
        return;
    }

    // Base update data
    const updateData = {
        stripe_customer_id: customerId,
        plan_type: planType,
    };

    // Handle lifetime (one-time payment)
    if (planType === 'lifetime') {
        updateData.has_lifetime_access = true;
        updateData.subscription_status = 'active';
        updateData.status = 'active';
        
        console.log(`Granting lifetime access to user: ${userId}`);
    }
    // Handle subscription (monthly/yearly)
    else if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        updateData.stripe_subscription_id = subscription.id;
        updateData.subscription_status = subscription.status;
        updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        updateData.status = 'active';
        
        console.log(`Activating ${planType} subscription for user: ${userId}`);
    }

    // Update user profile in Supabase
    const { error } = await supabaseAdmin
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }

    // Log the payment in payments table
    await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: session.amount_total / 100,
        currency: session.currency?.toUpperCase() || 'ILS',
        payment_method: 'stripe',
        transaction_id: session.payment_intent || session.subscription,
        status: 'completed',
        subscription_type: planType,
        metadata: {
            stripe_session_id: session.id,
            stripe_customer_id: customerId,
        },
    });

    console.log(`Successfully processed checkout for user: ${userId}`);
}

/**
 * Handle subscription updates (renewals, plan changes)
 */
async function handleSubscriptionUpdate(subscription) {
    console.log('Processing subscription update:', subscription.id);

    const userId = subscription.metadata?.supabase_user_id;
    
    if (!userId) {
        // Try to find user by customer ID
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .single();

        if (!profile) {
            console.error('Could not find user for subscription:', subscription.id);
            return;
        }

        await updateUserSubscription(profile.id, subscription);
    } else {
        await updateUserSubscription(userId, subscription);
    }
}

async function updateUserSubscription(userId, subscription) {
    const updateData = {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    };

    // Update status based on subscription state
    if (subscription.status === 'active' || subscription.status === 'trialing') {
        updateData.status = 'active';
    } else if (subscription.status === 'past_due') {
        updateData.status = 'active'; // Still allow access during grace period
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        updateData.status = 'expired';
    }

    const { error } = await supabaseAdmin
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error('Failed to update subscription:', error);
        throw error;
    }

    console.log(`Updated subscription for user: ${userId}, status: ${subscription.status}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
    console.log('Processing subscription deletion:', subscription.id);

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, has_lifetime_access')
        .eq('stripe_subscription_id', subscription.id)
        .single();

    if (!profile) {
        console.error('Could not find user for deleted subscription:', subscription.id);
        return;
    }

    // Don't downgrade if user has lifetime access
    if (profile.has_lifetime_access) {
        console.log('User has lifetime access, skipping downgrade');
        return;
    }

    const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({
            subscription_status: 'canceled',
            status: 'expired',
            stripe_subscription_id: null,
        })
        .eq('id', profile.id);

    if (error) {
        console.error('Failed to handle subscription deletion:', error);
        throw error;
    }

    console.log(`Subscription canceled for user: ${profile.id}`);
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice) {
    if (!invoice.subscription) return;

    console.log('Processing invoice payment succeeded:', invoice.id);

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', invoice.customer)
        .single();

    if (!profile) {
        console.error('Could not find user for invoice:', invoice.id);
        return;
    }

    // Log the renewal payment
    await supabaseAdmin.from('payments').insert({
        user_id: profile.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency?.toUpperCase() || 'ILS',
        payment_method: 'stripe',
        transaction_id: invoice.payment_intent,
        status: 'completed',
        subscription_type: invoice.lines?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
        metadata: {
            stripe_invoice_id: invoice.id,
            is_renewal: true,
        },
    });

    console.log(`Logged renewal payment for user: ${profile.id}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
    if (!invoice.subscription) return;

    console.log('Processing invoice payment failed:', invoice.id);

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', invoice.customer)
        .single();

    if (!profile) {
        console.error('Could not find user for failed invoice:', invoice.id);
        return;
    }

    // Update subscription status to past_due
    await supabaseAdmin
        .from('user_profiles')
        .update({ subscription_status: 'past_due' })
        .eq('id', profile.id);

    // Log the failed payment
    await supabaseAdmin.from('payments').insert({
        user_id: profile.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency?.toUpperCase() || 'ILS',
        payment_method: 'stripe',
        transaction_id: invoice.payment_intent,
        status: 'failed',
        subscription_type: invoice.lines?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
        metadata: {
            stripe_invoice_id: invoice.id,
            failure_reason: invoice.last_finalization_error?.message,
        },
    });

    console.log(`Logged failed payment for user: ${profile.id}`);
}
